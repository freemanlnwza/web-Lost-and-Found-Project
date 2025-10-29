from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime

# -------------------------
# User models
# -------------------------
class UserCreate(BaseModel):
    username: str
    email: str 
    password: str

    class Config:
        json_schema_extra = {
            "example": {
                "username": "testuser",
                "password": "123456"
            }
        }

class UserOut(BaseModel):
    id: int
    username: str
    email: str     
    role: str
    is_verified: bool = False
    session_token: Optional[str] = None  # สำหรับ login response (เซ็ตใน HttpOnly cookie)

    class Config:
        from_attributes = True

class UserVerifyOTP(BaseModel):
    email: str
    otp: str | None = None  

class ResetRequest(BaseModel):
    username: str
    email: EmailStr

class VerifyOTPRequest(BaseModel):
    email: EmailStr
    otp: str

class UpdatePasswordRequest(BaseModel):
    email: EmailStr
    new_password: str
# -------------------------
# Item models
# -------------------------
class ItemCreate(BaseModel):
    title: str
    type: str
    category: str
    original_image_data: Optional[bytes] = None

class ItemOut(BaseModel):
    id: int
    title: str
    type: str
    category: str
    image_data: Optional[str] = None
    boxed_image_data: Optional[str] = None
    image_filename: Optional[str] = None
    user_id: Optional[int] = None
    username: Optional[str] = None
    original_image_data: Optional[str] = None
    similarity: Optional[float] = None
    query_vector_first2: Optional[List[float]] = None
    item_vector_first2: Optional[List[float]] = None

    class Config:
        from_attributes = True


# -------------------------
# Message models
# -------------------------
class MessageBase(BaseModel):
    message: str

class MessageCreate(MessageBase):
    chat_id: int
    image_data: Optional[bytes] = None
    image_content_type: Optional[str] = None
    image_filename: Optional[str] = None

class MessageOut(MessageBase):
    id: int
    chat_id: int
    sender_id: int 
    created_at: datetime
    username: Optional[str] = None
    image_data: Optional[str] = None
    image_filename: Optional[str] = None

    class Config:
        from_attributes = True


# -------------------------
# Chat models
# -------------------------
class ChatBase(BaseModel):
    user1_id: int
    user2_id: int

class ChatOut(ChatBase):
    id: int
    created_at: datetime
    user1_username: Optional[str] = None
    user2_username: Optional[str] = None
    item_title: Optional[str] = None

    class Config:
        from_attributes = True


# -------------------------
# Chat with messages
# -------------------------
class ChatDetail(ChatOut):
    messages: List[MessageOut] = []


# -------------------------
# Request models
# -------------------------
class ChatCreateRequest(BaseModel):
    
    user2_id: int
    item_id: Optional[int] = None

class MessageSendRequest(BaseModel):
    chat_id: int
    message: str  # sender_id ไม่จำเป็น เพราะ backend ใช้ current_user จาก cookie


class ReportCreate(BaseModel):
    item_id: Optional[int] = None       # ID ของ item ที่จะรายงาน (สามารถเป็น None)
    chat_id: Optional[int] = None       # ID ของ chat ที่จะรายงาน (สามารถเป็น None)
    type: str = "item"                  # default เป็น "item"
    comment: Optional[str] = ""         # comment เพิ่มเติม