from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from sqlalchemy.orm import Session
import io
from PIL import Image
from ultralytics import YOLO
import crud, schemas, models, utils
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
    if not image.filename.lower().endswith((".jpg", ".jpeg", ".png")):
        raise HTTPException(status_code=400, detail="File must be an image (jpg, jpeg, png)")

    # อ่านไฟล์และสร้าง bytes
    image_bytes = await image.read()

    # สร้าง embedding จาก utils
    image_emb = utils.get_image_embedding(image_bytes).tolist()

    # สร้าง PIL image สำหรับ YOLO
    pil_image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    results = yolo_model.predict(pil_image)
    boxed_image = results[0].plot()
    boxed_io = io.BytesIO()
    Image.fromarray(boxed_image).save(boxed_io, format="JPEG")
    boxed_image_bytes = boxed_io.getvalue()

    # สร้าง item schema
    item_in = schemas.ItemCreate(title=title, type=type, category=category)

    # ส่ง bytes + filename + content_type ไป crud แทน UploadFile
    item = crud.create_item(
        db=db,
        item=item_in,
        image_bytes=image_bytes,
        image_filename=image.filename,
        image_content_type=image.content_type,
        user_id=user_id,
        boxed_image_data=boxed_image_bytes,
        image_emb=image_emb
    )

    # ส่ง response กลับ
    return schemas.ItemOut(
        id=item.id,
        title=item.title,
        type=item.type,
        category=item.category,
        image_data=encode_image(item.image_data, item.image_content_type),
        boxed_image_data=encode_image(item.boxed_image_data, item.image_content_type),
        image_filename=item.image_filename,
        user_id=item.user_id,
        username=item.user.username if item.user else None
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
