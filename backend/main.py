from fastapi import FastAPI, Depends, UploadFile, File, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from database import SessionLocal, engine, Base, get_db
import crud
import models
import schemas
import base64
import numpy as np
from ultralytics import YOLO
from PIL import Image
import io
from utils import get_text_embedding, get_image_embedding
from schemas import MessageCreate, ChatCreateRequest, MessageSendRequest

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
# Helper
# ---------------------------
def encode_image(data, content_type):
    if data:
        return f"data:{content_type};base64,{base64.b64encode(data).decode()}"
    return None

# ---------------------------
# Register/Login
# ---------------------------
@app.post("/register", response_model=schemas.UserOut)
def register_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    existing_user = crud.get_user_by_username(db, user.username)
    if existing_user:
        raise HTTPException(status_code=400, detail="Username นี้ถูกใช้ไปแล้ว")
    return crud.create_user(db=db, user=user)

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
    if not image.filename.lower().endswith((".jpg", ".jpeg", ".png")):
        raise HTTPException(status_code=400, detail="File must be an image (jpg, jpeg, png)")
    image_bytes = await image.read()
    if len(image_bytes) == 0:
        raise HTTPException(status_code=400, detail="Empty image file")

    pil_image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    results = yolo_model.predict(pil_image)
    boxed_image = results[0].plot()
    boxed_io = io.BytesIO()
    Image.fromarray(boxed_image).save(boxed_io, format="JPEG")
    boxed_image_bytes = boxed_io.getvalue()
    image.file.seek(0)

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
        image_data=encode_image(item.image_data, item.image_content_type),
        boxed_image_data=encode_image(item.boxed_image_data, item.image_content_type),
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
            id=i.id,
            title=i.title,
            type=i.type,
            category=i.category,
            image_data=encode_image(i.image_data, i.image_content_type),
            boxed_image_data=encode_image(i.boxed_image_data, i.image_content_type),
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
            image_data=encode_image(i.image_data, i.image_content_type),
            boxed_image_data=encode_image(i.boxed_image_data, i.image_content_type),
            image_filename=i.image_filename,
            user_id=i.user_id,
            username=i.user.username if i.user else None
        ) for i in items
    ]

# ---------------------------
# Search Items
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

    if text:
        query_emb = get_text_embedding(text)
        field = models.Item.text_embedding
    else:
        image_bytes = await image.read()
        query_emb = get_image_embedding(image_bytes)
        field = models.Item.image_embedding

    items = db.query(models.Item).order_by(field.l2_distance(query_emb)).limit(top_k).all()

    def cosine_similarity(a, b):
        a, b = np.array(a), np.array(b)
        denom = (np.linalg.norm(a) * np.linalg.norm(b))
        return float(np.dot(a, b) / denom) if denom != 0 else 0.0

    results = []
    for i in items:
        item_emb = i.text_embedding if text else i.image_embedding
        sim = cosine_similarity(query_emb, item_emb)
        results.append({
            "id": i.id,
            "title": i.title,
            "type": i.type,
            "category": i.category,
            "image_data": encode_image(i.image_data, i.image_content_type),
            "boxed_image_data": encode_image(i.boxed_image_data, i.image_content_type),
            "image_filename": i.image_filename,
            "user_id": i.user_id,
            "username": i.user.username if i.user else None,
            "similarity": round(sim, 4)
        })
    return results

# ---------------------------
# Chats API
# ---------------------------
@app.post("/api/chats/get-or-create")
def get_or_create_chat(req: schemas.ChatCreateRequest, db: Session = Depends(get_db)):
    chat = crud.get_or_create_chat(db, req.user1_id, req.user2_id, getattr(req, "item_id", None))
    
    item_image = encode_image(chat.item.image_data, chat.item.image_content_type) if chat.item else None
    
    return {
        "chat_id": chat.id,
        "user1_id": chat.user1_id,
        "user1_username": chat.user1.username if chat.user1 else None,
        "user2_id": chat.user2_id,
        "user2_username": chat.user2.username if chat.user2 else None,
        "created_at": chat.created_at,
        "item_image": item_image,
        "item_title": chat.item.title if chat.item else None
    }


@app.get("/api/chats/{user_id}")
def get_user_chats(user_id: int, db: Session = Depends(get_db)):
    chats = crud.get_chats_for_user(db, user_id=user_id)
    result = []
    for c in chats:
        result.append({
            "chat_id": c.id,
            "user1_id": c.user1_id,
            "user1_username": c.user1.username if c.user1 else None,
            "user2_id": c.user2_id,
            "user2_username": c.user2.username if c.user2 else None,
            "created_at": c.created_at,
            "item_image": encode_image(c.item.image_data, c.item.image_content_type) if c.item else None,
            "item_title": c.item.title if c.item else None
        })
    return result


# ---------------------------
# Messages API (ไม่มี username และ image)
# ---------------------------
@app.get("/api/chats/{chat_id}/messages")
def get_chat_messages(chat_id: int, user_id: int, db: Session = Depends(get_db)):
    """
    เพิ่มพารามิเตอร์ user_id ใน query string เพื่อใช้ตรวจสอบว่า user นี้อยู่ในห้องหรือไม่
    ตัวอย่าง: /api/chats/4/messages?user_id=2
    """
    chat = db.query(models.Chat).filter(models.Chat.id == chat_id).first()
    if not chat:
        raise HTTPException(status_code=404, detail="ไม่พบห้องแชทนี้")

    # ตรวจสอบว่า user_id อยู่ในห้องไหม
    if user_id not in [chat.user1_id, chat.user2_id]:
        raise HTTPException(status_code=403, detail="คุณไม่มีสิทธิ์เข้าถึงห้องนี้")

    messages = crud.get_messages_by_chat(db, chat_id)
    return [
        {
            "id": m.id,
            "chat_id": m.chat_id,
            "sender_id": m.sender_id,
            "message": m.message,
            "created_at": m.created_at,
            "username": m.sender.username
        }
        for m in messages
    ]


@app.post("/api/messages/send")
def send_message(req: MessageSendRequest, db: Session = Depends(get_db)):
    chat = db.query(models.Chat).filter(models.Chat.id == req.chat_id).first()
    if not chat:
        raise HTTPException(status_code=404, detail="ไม่พบห้องแชทนี้")

    if not crud.is_user_in_chat(db, req.chat_id, req.sender_id):
        raise HTTPException(status_code=403, detail="คุณไม่มีสิทธิ์ในห้องนี้")

    msg_in = MessageCreate(chat_id=req.chat_id, sender_id=req.sender_id, message=req.message)
    msg = crud.create_message(db, msg_in)

    return {
        "id": msg.id,
        "chat_id": msg.chat_id,
        "sender_id": msg.sender_id,
        "message": msg.message,
        "created_at": msg.created_at
    }