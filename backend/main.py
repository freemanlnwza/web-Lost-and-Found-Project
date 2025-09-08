from fastapi import FastAPI, Depends, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from database import SessionLocal, engine, Base, get_db
import crud
import models
import schemas
import base64

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
    # ตรวจสอบว่ามี username นี้แล้วหรือไม่
    existing_user = crud.get_user_by_username(db, user.username)  # <-- เปลี่ยนตรงนี้
    if existing_user:
        raise HTTPException(status_code=400, detail="Username นี้ถูกใช้ไปแล้ว")
    
    return crud.create_user(db=db, user=user)

@app.post("/login", response_model=schemas.UserOut)
def login_user(username: str = Form(...), password: str = Form(...), db: Session = Depends(get_db)):
    username = crud.authenticate_user(db, username, password)
    if not username:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    return username


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
    item_in = schemas.ItemCreate(title=title, type=type, category=category)
    item = crud.create_item(db, item_in, image, user_id)
    item_out = schemas.ItemOut(
        id=item.id,
        title=item.title,
        type=item.type,
        category=item.category,
        image_data=f"data:{item.image_content_type};base64,{base64.b64encode(item.image_data).decode()}",
        image_filename=item.image_filename,
        user_id=item.user_id
    )
    return item_out

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
            image_data=base64.b64encode(i.image_data).decode(),  # ส่ง Base64 ธรรมดา
            image_filename=i.image_filename,
            user=schemas.UserOut.model_validate(i.user)
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
            image_filename=i.image_filename,
            user=schemas.UserOut.model_validate(i.user)  # 👈 ส่ง user object
        ) for i in items
    ]

