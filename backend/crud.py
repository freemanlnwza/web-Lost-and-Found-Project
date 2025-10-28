import base64
from sqlalchemy.orm import Session, joinedload
import models
from models import User, Item, Chat, Message
import schemas
import bcrypt
import io
from fastapi import Depends, HTTPException, Request, UploadFile, Cookie
from typing import Optional, List
from utils import get_text_embedding, get_image_embedding
from datetime import datetime
from database import get_db

# ===========================
# ฟังก์ชันจัดการ User
# ===========================
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

def create_user(db: Session, user: schemas.UserCreate) -> User:
    hashed_pw = bcrypt.hashpw(user.password.encode(), bcrypt.gensalt()).decode()
    db_user = User(username=user.username, password=hashed_pw, role="user")
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


def get_user_by_username(db: Session, username: str) -> Optional[User]:
    return db.query(User).filter(User.username == username).first()


def authenticate_user(db: Session, username: str, password: str) -> Optional[User]:
    user = get_user_by_username(db, username)
    if not user or not bcrypt.checkpw(password.encode(), user.password.encode()):
        return None
    return user


def get_user_by_session_token(db: Session, session_token: str) -> Optional[User]:
    session = db.query(models.Session).filter(models.Session.session_token == session_token).first()
    if session:
        return db.query(User).filter(User.id == session.user_id).first()
    return None


# ===========================
# ฟังก์ชันจัดการ Item
# ===========================

def create_item(
    db: Session,
    item: schemas.ItemCreate,
    image_bytes: bytes,
    image_filename: str,
    image_content_type: str,
    user_id: int,
    boxed_image_data: Optional[bytes] = None,
    image_emb: Optional[list] = None,
    original_image_data: Optional[bytes] = None,
) -> Item:
    text_emb = get_text_embedding(item.title).tolist()
    if image_emb is None:
        image_emb = get_image_embedding(image_bytes).tolist()

    db_item = Item(
        title=item.title,
        type=item.type,
        category=item.category,
        image_data=image_bytes,
        boxed_image_data=boxed_image_data,
        original_image_data=original_image_data,
        image_filename=image_filename,
        image_content_type=image_content_type,
        user_id=user_id,
        text_embedding=text_emb,
        image_embedding=image_emb,
    )
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item


def get_items(db: Session, type_filter: Optional[str] = None) -> List[Item]:
    query = db.query(Item).options(joinedload(Item.user))
    if type_filter:
        query = query.filter(Item.type == type_filter)
    return query.all()


# ===========================
# ฟังก์ชันจัดการ Chat
# ===========================

def get_or_create_chat(db: Session, user1_id: int, user2_id: int, item_id: int = None) -> Chat:
    chat = (
        db.query(Chat)
        .options(joinedload(Chat.item))
        .filter(
            ((Chat.user1_id == user1_id) & (Chat.user2_id == user2_id))
            | ((Chat.user1_id == user2_id) & (Chat.user2_id == user1_id))
        )
        .first()
    )

    if chat:
        if item_id and chat.item_id is None:
            chat.item_id = item_id
            db.commit()
            db.refresh(chat)
        return chat

    chat = Chat(
        user1_id=user1_id,
        user2_id=user2_id,
        item_id=item_id,
        created_at=datetime.utcnow(),
    )
    db.add(chat)
    db.commit()
    db.refresh(chat)
    return chat


def get_chats_for_user(db: Session, user_id: int) -> List[Chat]:
    chats = (
        db.query(Chat)
        .options(joinedload(Chat.user1), joinedload(Chat.user2), joinedload(Chat.item))
        .filter((Chat.user1_id == user_id) | (Chat.user2_id == user_id))
        .order_by(Chat.created_at.desc())
        .all()
    )
    return chats


# ===========================
# ฟังก์ชันจัดการ Message
# ===========================

def create_message(db: Session, chat_id: int, sender_id: int, message: str, image_data: Optional[bytes] = None,
                   image_content_type: Optional[str] = None, image_filename: Optional[str] = None):
    msg = Message(
        chat_id=chat_id,
        sender_id=sender_id,
        message=message,
        image_data=image_data,
        image_content_type=image_content_type,
        image_filename=image_filename
    )
    db.add(msg)
    db.commit()
    db.refresh(msg)
    return msg


def get_messages_by_chat(db: Session, chat_id: int) -> List[Message]:
    return db.query(Message).filter(Message.chat_id == chat_id).order_by(Message.created_at.asc()).all()


# ===========================
# ฟังก์ชันช่วยเหลือ (Helper)
# ===========================

def is_user_in_chat(db: Session, chat_id: int, user_id: int) -> bool:
    chat = db.query(Chat).filter(Chat.id == chat_id).first()
    if not chat:
        return False
    return user_id in [chat.user1_id, chat.user2_id]


def get_user_chats(db: Session, user_id: int):
    chats = db.query(Chat).filter((Chat.user1_id == user_id) | (Chat.user2_id == user_id)).all()
    result = []
    for chat in chats:
        result.append({
            "id": chat.id,
            "user1_id": chat.user1_id,
            "user2_id": chat.user2_id,
            "user1_username": chat.user1.username if chat.user1 else None,
            "user2_username": chat.user2.username if chat.user2 else None,
            "created_at": chat.created_at,
            "item_title": chat.item.title if chat.item else None,
        })
    return result


def encode_image(data, content_type):
    if data:
        return f"data:{content_type};base64,{base64.b64encode(data).decode()}"
    return None


def log_admin_action(db: Session, admin_id: int, admin_username: str, action: str, action_type: str = None):
    try:
        log = models.AdminLog(
            admin_id=admin_id,
            admin_username=admin_username,
            action=action,
            action_type=action_type,
            timestamp=datetime.now(),
        )
        db.add(log)
        db.commit()
    except Exception as e:
        print(f"บันทึกการกระทำของ admin ล้มเหลว: {e}")


# ===========================
# ดึง user จาก session cookie
# ===========================
def get_current_user(session_token: Optional[str] = Cookie(None), db: Session = Depends(get_db)) -> User:
    if not session_token:
        raise HTTPException(status_code=401, detail="ต้อง login ก่อน")
    user = get_user_by_session_token(db, session_token)
    if not user:
        raise HTTPException(status_code=401, detail="Session ไม่ถูกต้อง")
    return user


def get_current_admin(request: Request, db: Session = Depends(get_db)):
    # ดึง session token จาก cookie
    token = request.cookies.get("session_token")
    if not token:
        raise HTTPException(status_code=401, detail="ไม่พบ cookie session")
    
    # หา session ในฐานข้อมูล
    session = db.query(models.Session).filter(models.Session.session_token == token).first()
    if not session:
        raise HTTPException(status_code=401, detail="Session ไม่ถูกต้องหรือหมดอายุ")

    # หา user จาก session
    user = db.query(models.User).filter(models.User.id == session.user_id).first()
    if not user:
        raise HTTPException(status_code=401, detail="User ไม่ถูกต้อง")
    
    # ตรวจสอบว่า user เป็น admin
    if getattr(user, "role", "") != "admin":
        raise HTTPException(status_code=403, detail="ต้องเป็น admin")
    
    return user
