import base64
from sqlalchemy.orm import Session, joinedload
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import models
from models import User, Item, Chat, Message
from schemas import UserCreate, ItemCreate, MessageCreate
import bcrypt
import io
from fastapi import Depends, HTTPException, UploadFile
from typing import Optional, List
from utils import get_text_embedding, get_image_embedding
from datetime import datetime
from database import get_db
security = HTTPBearer()
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
    query = db.query(Item).options(joinedload(Item.user))
    if type_filter:
        query = query.filter(Item.type == type_filter)
    return query.all()

# ===========================
# Chat
# ===========================
def get_or_create_chat(db: Session, user1_id: int, user2_id: int, item_id: int = None) -> Chat:
    """ดึง chat ระหว่าง user1 กับ user2 ถ้าไม่มีสร้างใหม่ ถ้ามีแล้วแต่ item_id ยังว่างให้อัปเดต"""
    chat = (
        db.query(Chat)
        .options(joinedload(Chat.item))
        .filter(
            ((Chat.user1_id == user1_id) & (Chat.user2_id == user2_id)) |
            ((Chat.user1_id == user2_id) & (Chat.user2_id == user1_id))
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
        created_at=datetime.utcnow()
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
# Message
# ===========================
def create_message(db: Session, msg: MessageCreate) -> Message:
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
    messages = (
        db.query(Message)
        .filter(Message.chat_id == chat_id)
        .order_by(Message.created_at.asc())
        .all()
    )
    return messages

# ===========================
# Helper
# ===========================
# ลบ encode_image ออกเพราะไม่ใช้แล้ว
def is_user_in_chat(db: Session, chat_id: int, user_id: int) -> bool:
    chat = db.query(Chat).filter(Chat.id == chat_id).first()
    if not chat:
        return False
    return user_id in [chat.user1_id, chat.user2_id]

def get_user_chats(db: Session, user_id: int):
    chats = db.query(models.Chat).filter(
        (models.Chat.user1_id == user_id) | (models.Chat.user2_id == user_id)
    ).all()

    result = []
    for chat in chats:
        result.append({
            "id": chat.id,
            "user1_id": chat.user1_id,
            "user2_id": chat.user2_id,
            "user1_username": chat.user1.username if chat.user1 else None,
            "user2_username": chat.user2.username if chat.user2 else None,
            "created_at": chat.created_at,
            "item_title": chat.item.title if chat.item else None
        })
    return result



def encode_image(data, content_type):
    if data:
        return f"data:{content_type};base64,{base64.b64encode(data).decode()}"
    return None

def get_admin_user(credentials: Optional[HTTPAuthorizationCredentials], db: Session):
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

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    """Get current user from token"""
    try:
        user_id = int(credentials.credentials)
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except ValueError:
        raise HTTPException(status_code=401, detail="Invalid token")