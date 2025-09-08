from sqlalchemy.orm import Session
from models import User, Item
from schemas import UserCreate, ItemCreate
import bcrypt

# ===========================
# User
# ===========================

def create_user(db: Session, user: UserCreate):
    hashed_pw = bcrypt.hashpw(user.password.encode(), bcrypt.gensalt()).decode()
    db_user = User(username=user.username, password=hashed_pw)  # ลบ email ออก
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def get_user_by_username(db: Session, username: str):
    return db.query(User).filter(User.username == username).first()

def authenticate_user(db: Session, username: str, password: str):
    user = get_user_by_username(db, username)
    if not user:
        return None
    if not bcrypt.checkpw(password.encode(), user.password.encode()):
        return None
    return user

# ===========================
# Item
# ===========================

def create_item(db: Session, item: ItemCreate, image_file, user_id: int):
    image_bytes = image_file.file.read()
    db_item = Item(
        title=item.title,
        type=item.type,
        category=item.category,
        image_data=image_bytes,
        image_filename=image_file.filename,
        image_content_type=image_file.content_type,
        user_id=user_id
    )
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item

def get_items(db: Session, type_filter: str = None):
    query = db.query(Item)
    if type_filter:
        query = query.filter(Item.type == type_filter)
    return query.all()
