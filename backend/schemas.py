from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

# -------------------------
# User
# -------------------------
class UserCreate(BaseModel):
    username: str
    password: str

    class Config:
        json_schema_extra = {  # เปลี่ยนจาก schema_extra → json_schema_extra
            "example": {
                "username": "testuser",
                "password": "123456"
            }
        }

class UserOut(BaseModel):
    id: int
    username: str

    class Config:
        from_attributes = True


# -------------------------
# Item
# -------------------------
class ItemCreate(BaseModel):
    title: str
    type: str
    category: str

class ItemOut(BaseModel):
    id: int
    title: str
    type: str
    category: str
    image_data: Optional[str] = None           # ภาพต้นฉบับ
    boxed_image_data: Optional[str] = None     # ภาพที่ตีกรอบ
    image_filename: Optional[str] = None
    user_id: Optional[int] = None
    username: Optional[str] = None

    # ฟิลด์เสริมสำหรับผลลัพธ์การค้นหา
    similarity: Optional[float] = None
    query_vector_first2: Optional[List[float]] = None
    item_vector_first2: Optional[List[float]] = None

    class Config:
        from_attributes = True


# -------------------------
# Message
# -------------------------
class MessageBase(BaseModel):
    message: str

class MessageCreate(MessageBase):
    sender_id: int
    chat_id: int

class MessageOut(MessageBase):
    id: int
    sender_id: int
    created_at: datetime
    username: Optional[str] = None        # ชื่อผู้ส่ง
    image_data: Optional[str] = None 

    class Config:
        from_attributes = True


# -------------------------
# Chat
# -------------------------
class ChatBase(BaseModel):
    user1_id: int
    user2_id: int

class ChatOut(ChatBase):
    id: int
    created_at: datetime
    user1_name: Optional[str] = None
    user2_name: Optional[str] = None

    class Config:
        from_attributes = True

# -------------------------
# Chat with messages
# -------------------------
class ChatDetail(ChatOut):
    messages: List[MessageOut] = []

# -------------------------
# Request models สำหรับรับ JSON
# -------------------------
class ChatCreateRequest(BaseModel):
    user1_id: int
    user2_id: int
    item_id: Optional[int] = None 

class MessageSendRequest(BaseModel):
    chat_id: int
    sender_id: int
    message: str
