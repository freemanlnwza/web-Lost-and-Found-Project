from sqlalchemy.orm import Session, joinedload
from models import User, Item, Chat, Message
from schemas import UserCreate, ItemCreate, MessageCreate
import bcrypt
import io
from fastapi import UploadFile
from typing import Optional, List
from utils import get_text_embedding, get_image_embedding
from datetime import datetime

# ===========================
# User
# ===========================
def create_user(db: Session, user: UserCreate) -> User:
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
    if not user:
        return None
    if not bcrypt.checkpw(password.encode(), user.password.encode()):
        return None
    return user


# ===========================
# Item
# ===========================
def create_item(
    db: Session,
    item: ItemCreate,
    image_file: UploadFile,
    user_id: int,
    boxed_image_data: Optional[bytes] = None
) -> Item:
    image_bytes = image_file.file.read()
    image_file.file.seek(0)
    
    text_emb = get_text_embedding(item.title).tolist()
    image_emb = get_image_embedding(io.BytesIO(image_bytes)).tolist()

    db_item = Item(
        title=item.title,
        type=item.type,
        category=item.category,
        image_data=image_bytes,
        boxed_image_data=boxed_image_data,
        image_filename=image_file.filename,
        image_content_type=image_file.content_type,
        user_id=user_id,
        text_embedding=text_emb,
        image_embedding=image_emb
    )
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item


def get_items(db: Session, type_filter: Optional[str] = None) -> List[Item]:
    """ดึง item ทั้งหมดหรือกรองตาม type พร้อม join user เพื่อดึง username"""
    query = db.query(Item).options(joinedload(Item.user))
    if type_filter:
        query = query.filter(Item.type == type_filter)
    return query.all()


# ===========================
# Chat
# ===========================
def get_or_create_chat(db: Session, user1_id: int, user2_id: int) -> Chat:
    """ดึงห้องแชทระหว่าง user1 กับ user2 ถ้าไม่มีให้สร้างใหม่"""
    chat = (
        db.query(Chat)
        .filter(
            ((Chat.user1_id == user1_id) & (Chat.user2_id == user2_id)) |
            ((Chat.user1_id == user2_id) & (Chat.user2_id == user1_id))
        )
        .first()
    )

    if chat:
        return chat

    chat = Chat(user1_id=user1_id, user2_id=user2_id, created_at=datetime.utcnow())
    db.add(chat)
    db.commit()
    db.refresh(chat)
    return chat


def get_chats_for_user(db: Session, user_id: int) -> List[Chat]:
    """ดึงห้องแชททั้งหมดที่ user มีส่วนร่วม"""
    chats = (
        db.query(Chat)
        .options(joinedload(Chat.user1), joinedload(Chat.user2))
        .filter((Chat.user1_id == user_id) | (Chat.user2_id == user_id))
        .order_by(Chat.created_at.desc())
        .all()
    )
    return chats


# ===========================
# Message
# ===========================
def create_message(db: Session, msg: MessageCreate) -> Message:
    """สร้างข้อความใหม่"""
    db_msg = Message(
        chat_id=msg.chat_id,
        sender_id=msg.sender_id,
        message=msg.message,
        created_at=datetime.utcnow()
    )
    db.add(db_msg)
    db.commit()
    db.refresh(db_msg)
    return db_msg


def get_messages_by_chat(db: Session, chat_id: int) -> List[Message]:
    """ดึงข้อความทั้งหมดในห้อง"""
    return (
        db.query(Message)
        .filter(Message.chat_id == chat_id)
        .order_by(Message.created_at.asc())
        .all()
    )
