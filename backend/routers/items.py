from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, Request
from sqlalchemy.orm import Session
import io
from PIL import Image, ImageDraw, ImageFont
from ultralytics import YOLO
import crud, schemas, utils
from crud import encode_image, get_current_user 
from database import get_db
import models
  # ✅ นำเข้าฟังก์ชันสำหรับ cookie-based auth

router = APIRouter(prefix="/api", tags=["Items"])
yolo_model = YOLO("best.pt")

# ============================
# Upload item
# ============================
@router.post("/upload", response_model=schemas.ItemOut)
async def upload_item(
    title: str = Form(...),
    type: str = Form(...),
    category: str = Form(...),
    image: UploadFile = File(...),
    current_user: models.User = Depends(get_current_user),  # ✅ ใช้ cookie auth
    db: Session = Depends(get_db),
    request: Request = None  # ✅ เพิ่ม Request เพื่อเข้าถึง yolo_model
):
    # ตรวจสอบไฟล์ภาพ
    if not image.filename.lower().endswith((".jpg", ".jpeg", ".png")):
        raise HTTPException(status_code=400, detail="File must be an image (jpg, jpeg, png)")

    # อ่านภาพต้นฉบับ
    image_bytes = await image.read()
    pil_image = Image.open(io.BytesIO(image_bytes)).convert("RGB")

    # ตรวจจับวัตถุด้วย YOLO
    results = yolo_model.predict(pil_image)
    result = results[0]

    boxes = result.boxes.xyxy.cpu().numpy()
    labels = result.boxes.cls.cpu().numpy()
    confs = result.boxes.conf.cpu().numpy()
    class_names = result.names

    if len(boxes) > 0:
        padding = 5
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

        rgba_image = pil_image.convert("RGBA")
        rgba_image.putalpha(mask)
        crop_box = rgba_image.getbbox()
        cropped_image = rgba_image.crop(crop_box)

        cropped_io = io.BytesIO()
        cropped_image.convert("RGB").save(cropped_io, format="PNG")
        cropped_image_bytes = cropped_io.getvalue()

        # วาดกรอบและ label
        final_image = cropped_image.copy()
        draw_final = ImageDraw.Draw(final_image)
        try:
            font = ImageFont.truetype("arial.ttf", size=16)
        except:
            font = ImageFont.load_default()

        crop_left, crop_upper = crop_box[0], crop_box[1]

        for i, (x1, y1, x2, y2) in enumerate(boxes):
            rect_x1 = max(int(x1) - padding - crop_left, 0)
            rect_y1 = max(int(y1) - padding - crop_upper, 0)
            rect_x2 = min(int(x2) + padding - crop_left, final_image.width - 1)
            rect_y2 = min(int(y2) + padding - crop_upper, final_image.height - 1)

            draw_final.rectangle([rect_x1, rect_y1, rect_x2, rect_y2], outline="red", width=3)
            label_text = f"{class_names[int(labels[i])]} {confs[i]:.2f}"
            draw_final.text((rect_x1, max(rect_y1 - 16, 0)), label_text, fill="white", font=font)

        boxed_io = io.BytesIO()
        final_image.convert("RGB").save(boxed_io, format="PNG")
        boxed_image_bytes = boxed_io.getvalue()
    else:
        cropped_image_bytes = image_bytes
        boxed_image_bytes = image_bytes
        confs = []

    # สร้าง Item
    item_in = schemas.ItemCreate(title=title, type=type, category=category)
    item = crud.create_item(
        db=db,
        item=item_in,
        image_bytes=cropped_image_bytes,
        image_filename=image.filename,
        image_content_type=image.content_type,
        user_id=current_user.id,  # ✅ ใช้ user จาก cookie
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
         confidence_list=confs.tolist() if hasattr(confs, "tolist") else confs
    )

# ============================
# Get lost items
# ============================
@router.get("/lost-items", response_model=list[schemas.ItemOut])
def get_lost_items(
    db: Session = Depends(get_db)
):
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

@router.get("/items/user", response_model=list[schemas.ItemOut])
def get_my_items(
    current_user: models.User = Depends(get_current_user),  # ✅ ต้อง login
    db: Session = Depends(get_db)
):
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

# ============================
# Get items by user
# ============================

# ============================
# Delete item
# ============================
@router.delete("/items/{item_id}")
def delete_item(
    item_id: int,
    current_user: models.User = Depends(get_current_user),  # ✅ ต้อง login
    db: Session = Depends(get_db)
):
    item = db.query(models.Item).filter(models.Item.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    if item.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Cannot delete others' items")
    db.delete(item)
    db.commit()
    return {"message": "Item deleted successfully"}

# ============================
# Get found items
# ============================
@router.get("/found-items", response_model=list[schemas.ItemOut])
def get_found_items(
    current_user: models.User = Depends(get_current_user),  # ✅ ต้อง login
    db: Session = Depends(get_db)
):
    items = crud.get_items(db, type_filter="found")
    return [
        schemas.ItemOut(
            id=i.id,
            title=i.title,
            type=i.type,
            category=i.category,
            image_data=encode_image(i.image_data, i.image_content_type),
            boxed_image_data=encode_image(i.boxed_image_data, i.image_content_type),
            image_filename=i.image_filename,
            user_id=i.user_id,
            username=i.user.username if i.user else None
        )
        for i in items
    ]