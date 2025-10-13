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
from datetime import datetime

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

    try:
        image_bytes = await image.read()
        if len(image_bytes) == 0:
            raise HTTPException(status_code=400, detail="Empty image file")
        pil_image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Cannot process image: {e}")

    try:
        results = yolo_model.predict(pil_image)
        boxed_image = results[0].plot()
        boxed_io = io.BytesIO()
        Image.fromarray(boxed_image).save(boxed_io, format="JPEG")
        boxed_image_bytes = boxed_io.getvalue()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"YOLO detection failed: {e}")

    image.file.seek(0)

    item_in = schemas.ItemCreate(title=title, type=type, category=category)
    item = crud.create_item(
        db=db,
        item=item_in,
        image_file=image,
        user_id=user_id,
        boxed_image_data=boxed_image_bytes
    )

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
            query_emb = get_text_embedding(text)
            field = models.Item.text_embedding
        else:
            image_bytes = await image.read()
            query_emb = get_image_embedding(image_bytes)
            field = models.Item.image_embedding

        items = (
            db.query(models.Item)
            .order_by(field.l2_distance(query_emb))
            .limit(top_k)
            .all()
        )

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
                "image_data": f"data:{i.image_content_type};base64,{base64.b64encode(i.image_data).decode()}" if i.image_data else None,
                "boxed_image_data": f"data:{i.image_content_type};base64,{base64.b64encode(i.boxed_image_data).decode()}" if i.boxed_image_data else None,
                "image_filename": i.image_filename,
                "user_id": i.user_id,
                "username": i.user.username if i.user else None,
                "similarity": round(sim, 4),
                "query_vector_first2": query_emb[:2] if len(query_emb) >= 2 else query_emb,
                "item_vector_first2": item_emb[:2] if len(item_emb) >= 2 else item_emb,
            })

        return results

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Search failed: {e}")

# ---------------------------
# Chats API (JSON)
# ---------------------------
@app.post("/api/chats/get-or-create")
def get_or_create_chat(req: ChatCreateRequest, db: Session = Depends(get_db)):
    chat = crud.get_or_create_chat(db, user1_id=req.user1_id, user2_id=req.user2_id)
    return {
        "chat_id": chat.id,
        "user1_id": chat.user1_id,
        "user2_id": chat.user2_id,
        "created_at": chat.created_at,
    }

@app.get("/api/chats/{user_id}")
def get_user_chats(user_id: int, db: Session = Depends(get_db)):
    chats = crud.get_chats_for_user(db, user_id=user_id)
    return [
        {
            "chat_id": c.id,
            "user1_id": c.user1_id,
            "user2_id": c.user2_id,
            "created_at": c.created_at,
        } for c in chats
    ]

@app.get("/api/chats/{chat_id}/messages")
def get_chat_messages(chat_id: int, db: Session = Depends(get_db)):
    messages = crud.get_messages_by_chat(db, chat_id)
    return [
        {
            "id": m.id,
            "chat_id": m.chat_id,
            "sender_id": m.sender_id,
            "message": m.message,
            "created_at": m.created_at,
        } for m in messages
    ]

@app.post("/api/messages/send")
def send_message(req: MessageSendRequest, db: Session = Depends(get_db)):
    msg_in = MessageCreate(chat_id=req.chat_id, sender_id=req.sender_id, message=req.message)
    msg = crud.create_message(db, msg_in)
    return {
        "id": msg.id,
        "chat_id": msg.chat_id,
        "sender_id": msg.sender_id,
        "message": msg.message,
        "created_at": msg.created_at,
    }

# ==================== ADMIN ROUTES ====================

from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Optional

security = HTTPBearer(auto_error=False)

def get_admin_user(credentials: Optional[HTTPAuthorizationCredentials], db: Session):
    """Helper to get and verify admin user from Bearer token"""
    if not credentials:
        raise HTTPException(status_code=401, detail="Authorization required")
    try:
        user_id = int(credentials.credentials)
        user = db.query(models.User).filter(models.User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        if not hasattr(user, 'role') or user.role != "admin":
            raise HTTPException(status_code=403, detail="Admin access required")
        return user
    except ValueError:
        raise HTTPException(status_code=401, detail="Invalid token")

def log_admin_action(db: Session, admin_id: int, admin_username: str, action: str):
    """Log admin action"""
    try:
        log = models.AdminLog(
            admin_id=admin_id,
            admin_username=admin_username,
            action=action,
            timestamp=datetime.now()
        )
        db.add(log)
        db.commit()
    except Exception as e:
        print(f"Failed to log admin action: {e}")

@app.get("/admin/users")
def admin_get_users(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security), db: Session = Depends(get_db)):
    """Get all users (admin only)"""
    admin = get_admin_user(credentials, db)
    users = db.query(models.User).all()
    return [{"id": u.id, "username": u.username, "role": getattr(u, 'role', 'user')} for u in users]

@app.get("/admin/items")
def admin_get_items(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security), db: Session = Depends(get_db)):
    """Get all items (admin only)"""
    admin = get_admin_user(credentials, db)
    items = db.query(models.Item).all()
    return [{"id": i.id, "title": i.title, "category": i.category, "user_id": i.user_id} for i in items]

@app.get("/admin/messages")
def admin_get_messages(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security), db: Session = Depends(get_db)):
    """Get all messages (admin only)"""
    admin = get_admin_user(credentials, db)
    messages = db.query(models.Message).all()
    return [{"id": m.id, "chat_id": m.chat_id, "sender_id": m.sender_id, "message": m.message} for m in messages]

@app.get("/admin/logs")
def admin_get_logs(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security), db: Session = Depends(get_db)):
    """Get admin logs (admin only)"""
    admin = get_admin_user(credentials, db)
    logs = db.query(models.AdminLog).order_by(models.AdminLog.timestamp.desc()).limit(50).all()
    return [{"id": l.id, "admin_username": l.admin_username, "action": l.action, "timestamp": l.timestamp} for l in logs]

@app.delete("/admin/users/{target_user_id}")
def admin_delete_user(target_user_id: int, credentials: Optional[HTTPAuthorizationCredentials] = Depends(security), db: Session = Depends(get_db)):
    """Delete user (admin only)"""
    admin = get_admin_user(credentials, db)
    user = db.query(models.User).filter(models.User.id == target_user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if getattr(user, 'role', None) == "admin":
        raise HTTPException(status_code=403, detail="Cannot delete admin users")
    
    username = user.username
    db.delete(user)
    db.commit()
    log_admin_action(db, admin.id, admin.username, f"Deleted user {username} (ID: {target_user_id})")
    return {"message": "User deleted"}

@app.delete("/admin/items/{item_id}")
def admin_delete_item(item_id: int, credentials: Optional[HTTPAuthorizationCredentials] = Depends(security), db: Session = Depends(get_db)):
    """Delete item (admin only)"""
    admin = get_admin_user(credentials, db)
    item = db.query(models.Item).filter(models.Item.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    title = item.title
    db.delete(item)
    db.commit()
    log_admin_action(db, admin.id, admin.username, f"Deleted item '{title}' (ID: {item_id})")
    return {"message": "Item deleted"}

@app.delete("/admin/messages/{message_id}")
def admin_delete_message(message_id: int, credentials: Optional[HTTPAuthorizationCredentials] = Depends(security), db: Session = Depends(get_db)):
    """Delete message (admin only)"""
    admin = get_admin_user(credentials, db)
    message = db.query(models.Message).filter(models.Message.id == message_id).first()
    if not message:
        raise HTTPException(status_code=404, detail="Message not found")
    
    db.delete(message)
    db.commit()
    log_admin_action(db, admin.id, admin.username, f"Deleted message (ID: {message_id})")
    return {"message": "Message deleted"}

@app.patch("/admin/users/{target_user_id}/make-admin")
def admin_make_admin(target_user_id: int, credentials: Optional[HTTPAuthorizationCredentials] = Depends(security), db: Session = Depends(get_db)):
    """Promote user to admin (admin only)"""
    admin = get_admin_user(credentials, db)
    user = db.query(models.User).filter(models.User.id == target_user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user.role = "admin"
    db.commit()
    log_admin_action(db, admin.id, admin.username, f"Promoted {user.username} to admin")
    return {"message": f"{user.username} is now admin"}

@app.patch("/admin/users/{target_user_id}/remove-admin")
def admin_remove_admin(target_user_id: int, credentials: Optional[HTTPAuthorizationCredentials] = Depends(security), db: Session = Depends(get_db)):
    """Remove admin role (admin only)"""
    admin = get_admin_user(credentials, db)
    if target_user_id == admin.id:
        raise HTTPException(status_code=403, detail="Cannot remove your own admin role")
    
    user = db.query(models.User).filter(models.User.id == target_user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user.role = "user"
    db.commit()
    log_admin_action(db, admin.id, admin.username, f"Removed admin role from {user.username}")
    return {"message": f"{user.username} is now a regular user"}