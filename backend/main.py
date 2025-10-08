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
from utils import get_text_embedding, get_image_embedding

# ---------------------------
# Initialize
# ---------------------------
yolo_model = YOLO("best.pt")
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Lost & Found API")

# ---------------------------
# CORS Middleware
# ---------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------
# Detect frame
# ---------------------------
@app.post("/detect-frame")
async def detect_frame(image: UploadFile = File(...)):
    image_bytes = await image.read()
    pil_image = Image.open(io.BytesIO(image_bytes)).convert("RGB")

    results = yolo_model.predict(pil_image)
    detections = []
    if results and len(results[0].boxes) > 0:
        for box in results[0].boxes:
            x1, y1, x2, y2 = box.xyxy[0].tolist()
            conf = float(box.conf[0])
            cls = int(box.cls[0])
            label = results[0].names[cls]
            detections.append({
                "x1": x1, "y1": y1, "x2": x2, "y2": y2,
                "confidence": conf, "label": label
            })

    return {"detections": detections}

# ---------------------------
# Register
# ---------------------------
@app.post("/register", response_model=schemas.UserOut)
def register_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    existing_user = crud.get_user_by_username(db, user.username)
    if existing_user:
        raise HTTPException(status_code=400, detail="Username นี้ถูกใช้ไปแล้ว")
    return crud.create_user(db=db, user=user)

# ---------------------------
# Login
# ---------------------------
@app.post("/login", response_model=schemas.UserOut)
def login_user(
    username: str = Form(...),
    password: str = Form(...),
    db: Session = Depends(get_db)
):
    user = crud.authenticate_user(db, username, password)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    return user

# ---------------------------
# Upload Item
# ---------------------------
@app.post("/upload", response_model=schemas.ItemOut)
async def upload_item(
    title: str = Form(...),
    type: str = Form(...),
    category: str = Form(...),
    image: UploadFile = File(...),
    user_id: int = Form(...),
    db: Session = Depends(get_db)
):
    print(f"[DEBUG] Upload: {title=} {type=} {category=} {user_id=} filename={image.filename}")

    if not image.filename.lower().endswith((".jpg", ".jpeg", ".png")):
        raise HTTPException(status_code=400, detail="File must be an image (jpg, jpeg, png)")

    # ---------- Load image safely ----------
    try:
        image_bytes = await image.read()
        print(f"[DEBUG] Image size: {len(image_bytes)} bytes")
        if len(image_bytes) == 0:
            raise HTTPException(status_code=400, detail="Empty image file")

        # ใช้ BytesIO เปิดภาพ
        image_stream = io.BytesIO(image_bytes)
        pil_image = Image.open(image_stream)
        pil_image.load()  # โหลดข้อมูลทั้งหมด
        pil_image = pil_image.convert("RGB")  # บังคับเป็น RGB เสมอ

    except Exception as e:
        print("[ERROR] Cannot open image:", e)
        raise HTTPException(status_code=400, detail=f"Cannot process image: {e}")

    # ---------- YOLO Detection ----------
    try:
        results = yolo_model.predict(pil_image)
        boxed_image = results[0].plot()
        boxed_io = io.BytesIO()
        Image.fromarray(boxed_image).save(boxed_io, format="JPEG")
        boxed_image_bytes = boxed_io.getvalue()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"YOLO detection failed: {e}")

    # ---------- Reset pointer before CRUD ----------
    image.file.seek(0)

    # ---------- Save Item ----------
    item_in = schemas.ItemCreate(title=title, type=type, category=category)
    item = crud.create_item(
        db=db,
        item=item_in,
        image_file=image,
        user_id=user_id,
        boxed_image_data=boxed_image_bytes
    )

    # ---------- Encode image for response ----------
    def encode_img(data):
        return f"data:{item.image_content_type};base64,{base64.b64encode(data).decode()}"

    return schemas.ItemOut(
        id=item.id,
        title=item.title,
        type=item.type,
        category=item.category,
        image_data=encode_img(item.image_data),
        boxed_image_data=encode_img(item.boxed_image_data) if item.boxed_image_data else None,
        image_filename=item.image_filename,
        user_id=item.user_id,
        username=item.user.username if item.user else None
    )


# ---------------------------
# Get Items
# ---------------------------
@app.get("/api/lost-items", response_model=list[schemas.ItemOut])
def get_lost_items(db: Session = Depends(get_db)):
    items = crud.get_items(db, type_filter="lost")
    return [
        schemas.ItemOut(
            id=i.id, title=i.title, type=i.type, category=i.category,
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
            id=i.id, title=i.title, type=i.type, category=i.category,
            image_data=f"data:{i.image_content_type};base64,{base64.b64encode(i.image_data).decode()}",
            boxed_image_data=f"data:{i.image_content_type};base64,{base64.b64encode(i.boxed_image_data).decode()}" if i.boxed_image_data else None,
            image_filename=i.image_filename,
            user_id=i.user_id,
            username=i.user.username if i.user else None
        ) for i in items
    ]

# ---------------------------
# Search by text or image
# ---------------------------
@app.post("/search", response_model=list[schemas.ItemOut])
async def search_items(
    text: str = Form(None),
    image: UploadFile = File(None),
    db: Session = Depends(get_db),
    top_k: int = Form(5)
):
    if not text and not image:
        raise HTTPException(status_code=400, detail="Provide text or image for search")

    try:
        if text:
            query_emb = get_text_embedding(text).tolist()
            field = models.Item.text_embedding
        else:
            query_emb = get_image_embedding(image).tolist()
            field = models.Item.image_embedding

        items = db.query(models.Item).order_by(field.l2_distance(query_emb)).limit(top_k).all()

        return [
            schemas.ItemOut(
                id=i.id, title=i.title, type=i.type, category=i.category,
                image_data=f"data:{i.image_content_type};base64,{base64.b64encode(i.image_data).decode()}",
                boxed_image_data=f"data:{i.image_content_type};base64,{base64.b64encode(i.boxed_image_data).decode()}" if i.boxed_image_data else None,
                image_filename=i.image_filename,
                user_id=i.user_id,
                username=i.user.username if i.user else None
            ) for i in items
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Search failed: {e}")
