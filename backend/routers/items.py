from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, Request
from sqlalchemy.orm import Session
import io
import logging
from PIL import Image, ImageDraw, ImageFont
import crud, schemas, utils
from crud import encode_image, get_current_user 
from database import get_db
import models
from huggingface_hub import hf_hub_download
import os

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["Items"])

# ===============================
# Global YOLO cache (Lazy Load)
# ===============================
_yolo_model = None
HF_TOKEN = os.getenv("HF_TOKEN")

def get_yolo_model():
    """✅ Lazy load YOLO model - โหลดเมื่อต้องใช้เท่านั้น"""
    global _yolo_model
    
    if _yolo_model is not None:
        return _yolo_model
    
    if not HF_TOKEN:
        logger.error("❌ HF_TOKEN not set")
        raise HTTPException(status_code=503, detail="HF_TOKEN not configured")
    
    try:
        logger.info("📥 Downloading YOLO model from HuggingFace...")
        from ultralytics import YOLO
        
        repo_id = "freemanlnwza/modelYOLOv8"
        filename = "weights/best.pt"
        
        model_path = hf_hub_download(
            repo_id=repo_id,
            filename=filename,
            token=HF_TOKEN,
            cache_dir="./models"
        )
        
        _yolo_model = YOLO(model_path)
        logger.info("✅ YOLO model loaded successfully")
        return _yolo_model
        
    except Exception as e:
        logger.error(f"❌ Error loading YOLO: {str(e)}")
        raise HTTPException(status_code=503, detail=f"YOLO model failed to load: {str(e)}")

# ===============================
# Helper function - Draw boxes & labels
# ===============================
def process_yolo_detections(pil_image, boxes, labels, confs, class_names, padding=5):
    """
    ✅ Process YOLO detections and return:
    - cropped_image_bytes: เฉพาะ object ที่ detect
    - boxed_image_bytes: ภาพเต็มพร้อมกรอบ
    - confs: confidence scores
    """
    
    if len(boxes) == 0:
        # ไม่เจอ object ให้ส่งรูปต้นฉบับ
        original_io = io.BytesIO()
        pil_image.save(original_io, format="PNG")
        return original_io.getvalue(), original_io.getvalue(), []
    
    try:
        # ===============================
        # 1. สร้าง mask สำหรับ cropped image
        # ===============================
        mask = Image.new("L", pil_image.size, 0)
        draw_mask = ImageDraw.Draw(mask)

        for (x1, y1, x2, y2) in boxes:
            draw_mask.rectangle(
                [
                    max(int(x1) - padding, 0),
                    max(int(y1) - padding, 0),
                    min(int(x2) + padding, pil_image.width),
                    min(int(y2) + padding, pil_image.height),
                ],
                fill=255,
            )

        # ===============================
        # 2. Crop image ให้เหลือเฉพาะ object
        # ===============================
        rgba_image = pil_image.convert("RGBA")
        rgba_image.putalpha(mask)
        crop_box = rgba_image.getbbox()
        cropped_image = rgba_image.crop(crop_box)

        cropped_io = io.BytesIO()
        cropped_image.convert("RGB").save(cropped_io, format="PNG")
        cropped_image_bytes = cropped_io.getvalue()

        # ===============================
        # 3. วาดกรอบและ label บนภาพเต็ม
        # ===============================
        final_image = pil_image.copy()
        draw_final = ImageDraw.Draw(final_image)
        
        try:
            font = ImageFont.truetype("arial.ttf", size=16)
        except:
            font = ImageFont.load_default()

        for i, (x1, y1, x2, y2) in enumerate(boxes):
            x1, y1, x2, y2 = int(x1), int(y1), int(x2), int(y2)
            
            # วาดกรอบแดง
            draw_final.rectangle(
                [x1 - padding, y1 - padding, x2 + padding, y2 + padding],
                outline="red",
                width=3
            )
            
            # วาด label
            label_text = f"{class_names[int(labels[i])]} {confs[i]:.2f}"
            draw_final.text(
                (x1 - padding, max(y1 - padding - 20, 0)),
                label_text,
                fill="white",
                font=font
            )

        boxed_io = io.BytesIO()
        final_image.save(boxed_io, format="PNG")
        boxed_image_bytes = boxed_io.getvalue()
        
        return cropped_image_bytes, boxed_image_bytes, confs.tolist() if hasattr(confs, "tolist") else confs
        
    except Exception as e:
        logger.error(f"❌ Error processing detections: {str(e)}")
        # Fallback: ส่งรูปต้นฉบับ
        original_io = io.BytesIO()
        pil_image.save(original_io, format="PNG")
        return original_io.getvalue(), original_io.getvalue(), []

# ===============================
# Upload item (with YOLO detection)
# ===============================
@router.post("/upload", response_model=schemas.ItemOut)
async def upload_item(
    title: str = Form(...),
    type: str = Form(...),
    category: str = Form(...),
    image: UploadFile = File(...),
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """✅ Upload item พร้อม YOLO detection"""
    
    # ✅ ตรวจสอบไฟล์ภาพ
    if not image.filename:
        raise HTTPException(status_code=400, detail="No filename provided")
    
    if not image.filename.lower().endswith((".jpg", ".jpeg", ".png")):
        raise HTTPException(status_code=400, detail="File must be an image (jpg, jpeg, png)")

    try:
        # ✅ อ่านภาพต้นฉบับ
        image_bytes = await image.read()
        pil_image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    except Exception as e:
        logger.error(f"❌ Error reading image: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Invalid image file: {str(e)}")

    # ===============================
    # ✅ YOLO Detection (Lazy Load)
    # ===============================
    try:
        yolo_model = get_yolo_model()
        
        logger.info("🔍 Running YOLO detection...")
        results = yolo_model.predict(pil_image, conf=0.5, verbose=False)
        result = results[0]

        boxes = result.boxes.xyxy.cpu().numpy()
        labels = result.boxes.cls.cpu().numpy()
        confs = result.boxes.conf.cpu().numpy()
        class_names = result.names

        logger.info(f"✅ YOLO found {len(boxes)} objects")

        # ✅ Process detections
        cropped_image_bytes, boxed_image_bytes, confs_list = process_yolo_detections(
            pil_image, boxes, labels, confs, class_names
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ YOLO detection error: {str(e)}")
        # Fallback: ใช้รูปต้นฉบับถ้า YOLO fail
        cropped_image_bytes = image_bytes
        boxed_image_bytes = image_bytes
        confs_list = []

    # ===============================
    # ✅ สร้าง Item ใน Database
    # ===============================
    try:
        item_in = schemas.ItemCreate(title=title, type=type, category=category)
        item = crud.create_item(
            db=db,
            item=item_in,
            image_bytes=cropped_image_bytes,
            image_filename=image.filename,
            image_content_type=image.content_type or "image/png",
            user_id=current_user.id,
            boxed_image_data=boxed_image_bytes,
            original_image_data=image_bytes,
            image_emb=utils.validate_image_embedding(cropped_image_bytes)
        )

        return schemas.ItemOut(
            id=item.id,
            title=item.title,
            type=item.type,
            category=item.category,
            image_data=encode_image(item.image_data, item.image_content_type),
            boxed_image_data=encode_image(item.boxed_image_data, "image/png"),
            original_image_data=encode_image(item.original_image_data, item.image_content_type),
            image_filename=item.image_filename,
            user_id=item.user_id,
            username=item.user.username if item.user else None,
            confidence_list=confs_list
        )
        
    except Exception as e:
        logger.error(f"❌ Error creating item: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to create item: {str(e)}")

# ===============================
# Get lost items
# ===============================
@router.get("/lost-items", response_model=list[schemas.ItemOut])
def get_lost_items(db: Session = Depends(get_db)):
    """✅ ดึงรายการของที่หายไป"""
    try:
        items = crud.get_items(db, type_filter="lost")
        return [
            schemas.ItemOut(
                id=i.id,
                title=i.title,
                type=i.type,
                category=i.category,
                image_data=encode_image(i.image_data, i.image_content_type),
                boxed_image_data=encode_image(i.boxed_image_data, i.image_content_type),
                original_image_data=encode_image(i.original_image_data, i.image_content_type) if i.original_image_data else None,
                image_filename=i.image_filename,
                user_id=i.user_id,
                username=i.user.username if i.user else None
            )
            for i in items
        ]
    except Exception as e:
        logger.error(f"❌ Error getting lost items: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch lost items")

# ===============================
# Get my items (current user)
# ===============================
@router.get("/items/user", response_model=list[schemas.ItemOut])
def get_my_items(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """✅ ดึงรายการของฉัน"""
    try:
        items = db.query(models.Item).filter(models.Item.user_id == current_user.id).all()
        return [
            schemas.ItemOut(
                id=i.id,
                title=i.title,
                type=i.type,
                category=i.category,
                image_data=encode_image(i.image_data, i.image_content_type),
                boxed_image_data=encode_image(i.boxed_image_data, i.image_content_type),
                original_image_data=encode_image(i.original_image_data, i.image_content_type) if i.original_image_data else None,
                image_filename=i.image_filename,
                user_id=i.user_id,
                username=i.user.username if i.user else None
            )
            for i in items
        ]
    except Exception as e:
        logger.error(f"❌ Error getting user items: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch your items")

# ===============================
# Delete item
# ===============================
@router.delete("/items/{item_id}")
def delete_item(
    item_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """✅ ลบรายการ (เฉพาะของตัวเอง)"""
    try:
        item = db.query(models.Item).filter(models.Item.id == item_id).first()
        
        if not item:
            raise HTTPException(status_code=404, detail="Item not found")
        
        if item.user_id != current_user.id:
            raise HTTPException(status_code=403, detail="Cannot delete others' items")
        
        db.delete(item)
        db.commit()
        
        logger.info(f"✅ Item {item_id} deleted by user {current_user.id}")
        return {"message": "Item deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error deleting item: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to delete item")

# ===============================
# Get found items
# ===============================
@router.get("/found-items", response_model=list[schemas.ItemOut])
def get_found_items(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """✅ ดึงรายการของที่พบ"""
    try:
        items = crud.get_items(db, type_filter="found")
        return [
            schemas.ItemOut(
                id=i.id,
                title=i.title,
                type=i.type,
                category=i.category,
                image_data=encode_image(i.image_data, i.image_content_type),
                boxed_image_data=encode_image(i.boxed_image_data, i.image_content_type),
                original_image_data=encode_image(i.original_image_data, i.image_content_type) if i.original_image_data else None,
                image_filename=i.image_filename,
                user_id=i.user_id,
                username=i.user.username if i.user else None
            )
            for i in items
        ]
    except Exception as e:
        logger.error(f"❌ Error getting found items: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch found items")