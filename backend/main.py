from fastapi import FastAPI, Depends, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from database import SessionLocal, engine, Base, get_db
import crud
import models
import schemas
import base64
from ultralytics import YOLO
from PIL import Image
import io

yolo_model = YOLO("best.pt")  # ใช้รุ่นเล็กเพื่อทดลองเร็ว
# สร้างตารางถ้ายังไม่มี
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Lost & Found API")

# ---------------------------
# CORS Middleware
# ---------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # เปลี่ยนเป็น frontend port ของคุณ
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------
# User endpoints
# ---------------------------
@app.post("/register", response_model=schemas.UserOut)
def register_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    existing_user = crud.get_user_by_username(db, user.username)
    if existing_user:
        raise HTTPException(status_code=400, detail="Username นี้ถูกใช้ไปแล้ว")
    return crud.create_user(db=db, user=user)

@app.post("/login", response_model=schemas.UserOut)
def login_user(username: str = Form(...), password: str = Form(...), db: Session = Depends(get_db)):
    user = crud.authenticate_user(db, username, password)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    return user


# ---------------------------
# Upload item
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
    # อ่านไฟล์ต้นฉบับ
    image_bytes = image.file.read()
    image.file.seek(0)  # rewind pointer ก่อนส่งไป crud

    pil_image = Image.open(io.BytesIO(image_bytes)).convert("RGB")

    # ตรวจจับและวาดกรอบ
    results = yolo_model.predict(pil_image)
    boxed_image = results[0].plot()
    boxed_image_bytes = io.BytesIO()
    Image.fromarray(boxed_image).save(boxed_image_bytes, format="JPEG")
    boxed_image_bytes = boxed_image_bytes.getvalue()

    # สร้าง schema
    item_in = schemas.ItemCreate(title=title, type=type, category=category)

    # บันทึก DB
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
        username=item.user.username if item.user else None   # ✅ ส่ง username
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
