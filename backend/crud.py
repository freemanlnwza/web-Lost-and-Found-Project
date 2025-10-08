from sqlalchemy.orm import Session, joinedload
from models import User, Item
from schemas import UserCreate, ItemCreate
import bcrypt
import io
from fastapi import UploadFile
from typing import Optional, List
from utils import get_text_embedding, get_image_embedding

# ===========================
# User
# ===========================

def create_user(db: Session, user: UserCreate) -> User:
    hashed_pw = bcrypt.hashpw(user.password.encode(), bcrypt.gensalt()).decode()
    db_user = User(username=user.username, password=hashed_pw)
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
    # อ่านไฟล์ภาพต้นฉบับ
    image_bytes = image_file.file.read()
    image_file.file.seek(0)  # reset pointer
    
    # สร้าง embedding
    import numpy as np
    from utils import get_text_embedding, get_image_embedding
    
    text_emb = get_text_embedding(item.title).tolist()
    # ส่ง bytes ให้ฟังก์ชันแทน UploadFile เพื่อไม่ให้เกิดปัญหา
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
    """
    ดึง item ทั้งหมดหรือกรองตาม type
    พร้อม join user เพื่อดึง username
    """
    query = db.query(Item).options(joinedload(Item.user))  # join user
    if type_filter:
        query = query.filter(Item.type == type_filter)
    return query.all()
