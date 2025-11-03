from fastapi import APIRouter, Depends, HTTPException, File, UploadFile, Form
from sqlalchemy.orm import Session
import crud, models, schemas
from crud import encode_image, get_current_user
from database import get_db

router = APIRouter(prefix="/api/chats", tags=["Chats"])

# ---------------------- Chat Create / Get ----------------------
@router.post("/get-or-create")
def get_or_create_chat(
    req: schemas.ChatCreateRequest,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    chat = crud.get_or_create_chat(db, current_user.id, req.user2_id, req.item_id)
    
    if current_user.id not in [chat.user1_id, chat.user2_id]:
        raise HTTPException(status_code=403, detail="You do not have access to this room")
    
    item_image = encode_image(chat.item.image_data, chat.item.image_content_type) if chat.item else None
    return {
        "chat_id": chat.id,
        "user1_id": chat.user1_id,
        "user1_username": chat.user1.username if chat.user1 else None,
        "user2_id": chat.user2_id,
        "user2_username": chat.user2.username if chat.user2 else None,
        "created_at": chat.created_at,
        "item_id": chat.item_id, 
        "item_image": item_image,
        "item_title": chat.item.title if chat.item else None
    }

# ---------------------- Get User Chats ----------------------
@router.get("/me")
def get_user_chats(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    chats = crud.get_chats_for_user(db, user_id=current_user.id)
    return [{
        "chat_id": c.id,
        "user1_id": c.user1_id,
        "user1_username": c.user1.username if c.user1 else None,
        "user2_id": c.user2_id,
        "user2_username": c.user2.username if c.user2 else None,
        "created_at": c.created_at,
        "item_id": c.item_id if c.item else None,
        "item_image": encode_image(c.item.image_data, c.item.image_content_type) if c.item else None,
        "item_title": c.item.title if c.item else None
    } for c in chats]

# ---------------------- Get Chat Messages ----------------------
@router.get("/{chat_id}/messages")
def get_chat_messages(
    chat_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    chat = db.query(models.Chat).filter(models.Chat.id == chat_id).first()
    if not chat:
        raise HTTPException(status_code=404, detail="Chat room not found")
    
    if current_user.id not in [chat.user1_id, chat.user2_id]:
        raise HTTPException(status_code=403, detail="You do not have access to this room")
    
    messages = crud.get_messages_by_chat(db, chat_id)

    return {
        "chat_id": chat.id,
        "user1_id": chat.user1_id,
        "user2_id": chat.user2_id,
        "messages": [
            {
                "id": m.id,
                "chat_id": m.chat_id,
                "sender_id": m.sender_id,
                "message": m.message,
                "created_at": m.created_at,
                "username": m.sender.username,
                "image": encode_image(m.image_data, m.image_content_type) if m.image_data else None,
                "is_sender": m.sender_id == current_user.id  # ✅ ระบุฝั่งผู้ส่ง
            } for m in messages
        ]
    }

# ---------------------- Send Message ----------------------
@router.post("/messages/send", response_model=schemas.MessageOut)
async def send_message(
    chat_id: int = Form(...),
    message: str = Form(""),
    image: UploadFile = File(None),
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    chat = db.query(models.Chat).filter(models.Chat.id == chat_id).first()
    if not chat:
        raise HTTPException(status_code=404, detail="Chat room not found")
    if current_user.id not in [chat.user1_id, chat.user2_id]:
        raise HTTPException(status_code=403, detail="You do not have access to this room")

    image_data = None
    image_content_type = None
    image_filename = None

    if image:
        image_data = await image.read()
        image_content_type = image.content_type
        image_filename = image.filename

    msg = crud.create_message(
        db,
        sender_id=current_user.id,
        chat_id=chat_id,
        message=message,
        image_data=image_data,
        image_content_type=image_content_type,
        image_filename=image_filename
    )

    return schemas.MessageOut(
        id=msg.id,
        chat_id=msg.chat_id,
        sender_id=current_user.id,
        message=msg.message,
        created_at=msg.created_at,
        username=current_user.username,
        image_data=encode_image(msg.image_data, msg.image_content_type) if msg.image_data else None,
        image_filename=msg.image_filename
    )

# ---------------------- Delete Message ----------------------
@router.delete("/messages/{message_id}/delete")
def delete_message(
    message_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    message = db.query(models.Message).filter(models.Message.id == message_id).first()
    if not message:
        raise HTTPException(status_code=404, detail="Message not found")
    if message.sender_id != current_user.id:
        raise HTTPException(status_code=403, detail="You are not allowed to delete this message")

    db.delete(message)
    db.commit()
    return {"message": "Delete successful"}
