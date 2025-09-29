from fastapi import FastAPI, Depends, UploadFile, File, Form, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from pydantic import BaseModel
from database import SessionLocal, engine, Base, get_db
import crud
import models
import schemas
import base64
from ultralytics import YOLO
from PIL import Image
import io

yolo_model = YOLO("best.pt")  # ใช้โมเดล YOLO
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Lost & Found API")

# ---------------------------
# CORS Middleware
# ---------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --------- Schema สำหรับ base64 ----------
class ImageData(BaseModel):
    image_base64: str

# --------- Endpoint Detect (รองรับ 2 แบบ) ----------
@app.post("/detect-frame")
async def detect_frame(image: UploadFile = File(...)):
    image_bytes = await image.read()
    pil_image = Image.open(io.BytesIO(image_bytes)).convert("RGB")

    results = yolo_model.predict(pil_image)

    detections = []
    for box in results[0].boxes:
        x1, y1, x2, y2 = box.xyxy[0].tolist()  # ตำแหน่งกรอบ
        conf = float(box.conf[0])              # ความมั่นใจ
        cls = int(box.cls[0])                  # class id
        label = results[0].names[cls]          # ชื่อคลาส
        detections.append({
            "x1": x1,
            "y1": y1,
            "x2": x2,
            "y2": y2,
            "confidence": conf,
            "label": label
        })

    return {"detections": detections}


# ---------------------------
# Register User
# ---------------------------
@app.post("/register", response_model=schemas.UserOut)
def register_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    existing_user = crud.get_user_by_username(db, user.username)
    if existing_user:
        raise HTTPException(status_code=400, detail="Username นี้ถูกใช้ไปแล้ว")
    return crud.create_user(db=db, user=user)


# ---------------------------
# Login User
# ---------------------------
@app.post("/login", response_model=schemas.UserOut)
def login_user(username: str = Form(...), password: str = Form(...), db: Session = Depends(get_db)):
    user = crud.authenticate_user(db, username, password)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    return user


# ---------------------------
# Upload Item
# ---------------------------
@app.post("/upload", response_model=schemas.ItemOut)
def upload_item(
    title: str = Form(...),
    type: str = Form(...),
    category: str = Form(...),
    image: UploadFile = File(...),
    user_id: int = Form(...),
    db: Session = Depends(get_db)
):
    image_bytes = image.file.read()
    image.file.seek(0)

    pil_image = Image.open(io.BytesIO(image_bytes)).convert("RGB")

    # ตรวจจับและตีกรอบ
    results = yolo_model.predict(pil_image)
    boxed_image = results[0].plot()
    boxed_image_bytes = io.BytesIO()
    Image.fromarray(boxed_image).save(boxed_image_bytes, format="JPEG")
    boxed_image_bytes = boxed_image_bytes.getvalue()

    item_in = schemas.ItemCreate(title=title, type=type, category=category)

    item = crud.create_item(
        db=db,
        item=item_in,
        image_file=image,
        user_id=user_id,
        boxed_image_data=boxed_image_bytes
    )

    return schemas.ItemOut(
        id=item.id,
        title=item.title,
        type=item.type,
        category=item.category,
        image_data=f"data:{item.image_content_type};base64,{base64.b64encode(item.image_data).decode()}",
        boxed_image_data=f"data:{item.image_content_type};base64,{base64.b64encode(item.boxed_image_data).decode()}" if item.boxed_image_data else None,
        image_filename=item.image_filename,
        user_id=item.user_id,
        username=item.user.username if item.user else None
    )


# ---------------------------
# Get lost/found items
# ---------------------------
@app.get("/api/lost-items", response_model=list[schemas.ItemOut])
def get_lost_items(db: Session = Depends(get_db)):
    items = crud.get_items(db, type_filter="lost")
    return [
        schemas.ItemOut(
            id=i.id,
            title=i.title,
            type=i.type,
            category=i.category,
            image_data=f"data:{i.image_content_type};base64,{base64.b64encode(i.image_data).decode()}",
            boxed_image_data=f"data:{i.image_content_type};base64,{base64.b64encode(i.boxed_image_data).decode()}" if i.boxed_image_data else None,
            image_filename=i.image_filename,
            user_id=i.user_id,
            username=i.user.username if i.user else None
        ) for i in items
    ]


@app.get("/api/found-items", response_model=list[schemas.ItemOut])
def get_found_items(db: Session = Depends(get_db)):
    items = crud.get_items(db, type_filter="found")
    return [
        schemas.ItemOut(
            id=i.id,
            title=i.title,
            type=i.type,
            category=i.category,
            image_data=f"data:{i.image_content_type};base64,{base64.b64encode(i.image_data).decode()}",
            boxed_image_data=f"data:{i.image_content_type};base64,{base64.b64encode(i.boxed_image_data).decode()}" if i.boxed_image_data else None,
            image_filename=i.image_filename,
            user_id=i.user_id
        ) for i in items
    ]
