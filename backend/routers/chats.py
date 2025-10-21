from fastapi import APIRouter, Depends, HTTPException, File, UploadFile, Form
from sqlalchemy.orm import Session
import crud, models, schemas
from crud import encode_image
from database import get_db
import base64

router = APIRouter(prefix="/api/chats", tags=["Chats"])

@router.post("/get-or-create")
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

@router.get("/{user_id}")
def get_user_chats(user_id: int, db: Session = Depends(get_db)):
    chats = crud.get_chats_for_user(db, user_id=user_id)
    return [{
        "chat_id": c.id,
        "user1_id": c.user1_id,
        "user1_username": c.user1.username if c.user1 else None,
        "user2_id": c.user2_id,
        "user2_username": c.user2.username if c.user2 else None,
        "created_at": c.created_at,
        "item_image": encode_image(c.item.image_data, c.item.image_content_type) if c.item else None,
        "item_title": c.item.title if c.item else None
    } for c in chats]

@router.get("/{chat_id}/messages")
def get_chat_messages(chat_id: int, user_id: int, db: Session = Depends(get_db)):
    chat = db.query(models.Chat).filter(models.Chat.id == chat_id).first()
    if not chat:
        raise HTTPException(status_code=404, detail="ไม่พบห้องแชทนี้")
    if user_id not in [chat.user1_id, chat.user2_id]:
        raise HTTPException(status_code=403, detail="คุณไม่มีสิทธิ์เข้าถึงห้องนี้")
    messages = crud.get_messages_by_chat(db, chat_id)
    return [{
        "id": m.id,
        "chat_id": m.chat_id,
        "sender_id": m.sender_id,
        "message": m.message,
        "created_at": m.created_at,
        "username": m.sender.username,
        "image": encode_image(m.image_data, m.image_content_type) if m.image_data else None
    } for m in messages]


# ✅ แก้ไขส่วนนี้
@router.post("/messages/send")
async def send_message(
    chat_id: int = Form(...),
    sender_id: int = Form(...),
    message: str = Form(""),
    image: UploadFile = File(None),
    db: Session = Depends(get_db)
):
    # ตรวจสอบว่าห้องแชทมีจริงไหม
    chat = db.query(models.Chat).filter(models.Chat.id == chat_id).first()
    if not chat:
        raise HTTPException(status_code=404, detail="ไม่พบห้องแชทนี้")

    # ตรวจสอบสิทธิ์ของผู้ใช้
    if not crud.is_user_in_chat(db, chat_id, sender_id):
        raise HTTPException(status_code=403, detail="คุณไม่มีสิทธิ์ในห้องนี้")

    image_data = None
    image_content_type = None
    image_filename = None

    # ถ้ามีอัปโหลดรูปภาพ
    if image:
        image_data = await image.read()
        image_content_type = image.content_type
        image_filename = image.filename

    # ✅ ใช้ schema ใหม่ที่รองรับรูปภาพ
    msg_in = schemas.MessageCreate(
        chat_id=chat_id,
        sender_id=sender_id,
        message=message,
        image_data=image_data,
        image_content_type=image_content_type,
        image_filename=image_filename
    )

    msg = crud.create_message(db, msg_in)

    return {
        "id": msg.id,
        "chat_id": msg.chat_id,
        "sender_id": msg.sender_id,
        "message": msg.message,
        "created_at": msg.created_at,
        "image": encode_image(msg.image_data, msg.image_content_type) if msg.image_data else None
    }
