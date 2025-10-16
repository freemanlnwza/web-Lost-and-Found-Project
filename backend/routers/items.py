from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from sqlalchemy.orm import Session
import io
from PIL import Image, ImageDraw, ImageFont
from ultralytics import YOLO
import crud, schemas, utils
from crud import encode_image
from database import get_db

router = APIRouter(prefix="/api", tags=["Items"])
yolo_model = YOLO("best.pt")

@router.post("/upload", response_model=schemas.ItemOut)
async def upload_item(
    title: str = Form(...),
    type: str = Form(...),
    category: str = Form(...),
    image: UploadFile = File(...),
    user_id: int = Form(...),
    db: Session = Depends(get_db)
):
    # ตรวจสอบไฟล์ภาพ
    if not image.filename.lower().endswith((".jpg", ".jpeg", ".png")):
        raise HTTPException(status_code=400, detail="File must be an image (jpg, jpeg, png)")

    # อ่านไฟล์ภาพทั้งหมดเป็น bytes
    image_bytes = await image.read()
    pil_image = Image.open(io.BytesIO(image_bytes)).convert("RGB")

    # ตรวจจับวัตถุด้วย YOLO
    results = yolo_model.predict(pil_image)
    result = results[0]

    boxes = result.boxes.xyxy.cpu().numpy()  # [[x1, y1, x2, y2], ...]
    labels = result.boxes.cls.cpu().numpy()  # class index
    confs = result.boxes.conf.cpu().numpy()  # confidence
    class_names = result.names               # idx -> class name

    if len(boxes) > 0:
        padding = 5
        # สร้าง mask สำหรับ alpha crop
        mask = Image.new("L", pil_image.size, 0)
        draw_mask = ImageDraw.Draw(mask)
        for i, (x1, y1, x2, y2) in enumerate(boxes):
            draw_mask.rectangle(
                [
                    max(int(x1)-padding, 0),
                    max(int(y1)-padding, 0),
                    min(int(x2)+padding, pil_image.width),
                    min(int(y2)+padding, pil_image.height)
                ],
                fill=255
            )

        # แปลงเป็น RGBA และใส่ mask เป็น alpha
        rgba_image = pil_image.convert("RGBA")
        rgba_image.putalpha(mask)
        crop_box = rgba_image.getbbox()
        cropped_image = rgba_image.crop(crop_box)

        # แปลงภาพ cropped เป็น bytes
        cropped_io = io.BytesIO()
        cropped_image.convert("RGB").save(cropped_io, format="PNG")
        cropped_image_bytes = cropped_io.getvalue()

        # สำหรับแสดง boxed image ใส่กรอบและ label
        final_image = cropped_image.copy()
        draw_final = ImageDraw.Draw(final_image)
        try:
            font = ImageFont.truetype("arial.ttf", size=16)
        except:
            font = ImageFont.load_default()

        crop_left, crop_upper = crop_box[0], crop_box[1]

        for i, (x1, y1, x2, y2) in enumerate(boxes):
            rect_x1 = max(int(x1)-padding - crop_left, 0)
            rect_y1 = max(int(y1)-padding - crop_upper, 0)
            rect_x2 = min(int(x2)+padding - crop_left, final_image.width-1)
            rect_y2 = min(int(y2)+padding - crop_upper, final_image.height-1)

            if rect_x2 <= rect_x1:
                rect_x2 = rect_x1 + 1
            if rect_y2 <= rect_y1:
                rect_y2 = rect_y1 + 1

            # วาดกรอบสีแดง
            draw_final.rectangle([rect_x1, rect_y1, rect_x2, rect_y2], outline="red", width=3)

            # วาด label พร้อม confidence
            label_text = f"{class_names[int(labels[i])]} {confs[i]:.2f}"
            bbox = font.getbbox(label_text)
            text_width = bbox[2] - bbox[0]
            text_height = bbox[3] - bbox[1]

            text_bg = [rect_x1, max(rect_y1 - text_height, 0), rect_x1 + text_width, rect_y1]
            draw_final.rectangle(text_bg, fill="red")
            draw_final.text((rect_x1, max(rect_y1 - text_height, 0)), label_text, fill="white", font=font)

        # แปลง boxed image เป็น bytes
        boxed_io = io.BytesIO()
        final_image.convert("RGB").save(boxed_io, format="PNG")
        boxed_image_bytes = boxed_io.getvalue()
    else:
        cropped_image_bytes = image_bytes
        boxed_image_bytes = image_bytes
        confs = []  # ไม่มีวัตถุ

    # สร้าง item schema
    item_in = schemas.ItemCreate(title=title, type=type, category=category)
    item = crud.create_item(
        db=db,
        item=item_in,
        image_bytes=cropped_image_bytes,
        image_filename=image.filename,
        image_content_type=image.content_type,
        user_id=user_id,
        boxed_image_data=boxed_image_bytes,
        image_emb=utils.get_image_embedding(cropped_image_bytes).tolist()
    )

    # ส่ง response กลับพร้อม confidence
    return schemas.ItemOut(
        id=item.id,
        title=item.title,
        type=item.type,
        category=item.category,
        image_data=encode_image(item.image_data, item.image_content_type),
        boxed_image_data=encode_image(item.boxed_image_data, "image/png"),
        image_filename=item.image_filename,
        user_id=item.user_id,
        username=item.user.username if item.user else None,
        confidence_list=confs.tolist()  # เพิ่มค่า confidence
    )



@router.get("/lost-items", response_model=list[schemas.ItemOut])
def get_lost_items(db: Session = Depends(get_db)):
    items = crud.get_items(db, type_filter="lost")
    return [
        schemas.ItemOut(
            id=i.id, title=i.title, type=i.type, category=i.category,
            image_data=encode_image(i.image_data, i.image_content_type),
            boxed_image_data=encode_image(i.boxed_image_data, i.image_content_type),
            image_filename=i.image_filename,
            user_id=i.user_id,
            username=i.user.username if i.user else None
        ) for i in items
    ]


@router.get("/found-items", response_model=list[schemas.ItemOut])
def get_found_items(db: Session = Depends(get_db)):
    items = crud.get_items(db, type_filter="found")
    return [
        schemas.ItemOut(
            id=i.id, title=i.title, type=i.type, category=i.category,
            image_data=encode_image(i.image_data, i.image_content_type),
            boxed_image_data=encode_image(i.boxed_image_data, i.image_content_type),
            image_filename=i.image_filename,
            user_id=i.user_id,
            username=i.user.username if i.user else None
        ) for i in items
    ]
