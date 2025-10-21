from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

# -------------------------
# User models
# -------------------------
class UserCreate(BaseModel):
    # โมเดลสำหรับสร้างผู้ใช้ใหม่
    username: str  # ชื่อผู้ใช้
    password: str  # รหัสผ่าน

    class Config:
        # ตัวอย่าง JSON สำหรับ Swagger / docs
        json_schema_extra = {
            "example": {
                "username": "testuser",
                "password": "123456"
            }
        }

class UserOut(BaseModel):
    # โมเดลสำหรับแสดงข้อมูลผู้ใช้
    id: int  # ID ผู้ใช้
    username: str  # ชื่อผู้ใช้
    role: str  # สิทธิ์ผู้ใช้ เช่น user, admin

    class Config:
        # เปิดใช้งานการดึงค่าจาก attributes ของ ORM
        from_attributes = True


# -------------------------
# Item models
# -------------------------
class ItemCreate(BaseModel):
    # โมเดลสำหรับสร้าง Item ใหม่
    title: str  # ชื่อไอเท็ม
    type: str  # lost หรือ found
    category: str  # หมวดหมู่ไอเท็ม
    original_image_data: Optional[bytes] = None

class ItemOut(BaseModel):
    # โมเดลสำหรับแสดงข้อมูลไอเท็ม
    id: int
    title: str
    type: str
    category: str
    image_data: Optional[str] = None  # รูปไอเท็มเป็น base64
    boxed_image_data: Optional[str] = None  # รูปที่มี bounding box
    image_filename: Optional[str] = None  # ชื่อไฟล์ภาพ
    user_id: Optional[int] = None  # ID ผู้โพสต์
    username: Optional[str] = None  # ชื่อผู้โพสต์
    original_image_data: Optional[str] = None

    similarity: Optional[float] = None  # คะแนนความคล้าย (ใช้ค้นหา)
    query_vector_first2: Optional[List[float]] = None  # ตัวอย่างเวกเตอร์ที่ใช้ค้นหา
    item_vector_first2: Optional[List[float]] = None  # ตัวอย่างเวกเตอร์ของไอเท็ม
    
    class Config:
        from_attributes = True


# -------------------------
# Message models
# -------------------------
class MessageBase(BaseModel):
    # ข้อมูลข้อความพื้นฐาน
    message: str  # เนื้อหาข้อความ

class MessageCreate(MessageBase):
    sender_id: int
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
    image_data: Optional[str] = None  # Base64 สำหรับ frontend
    image_filename: Optional[str] = None

    class Config:
        from_attributes = True

    class Config:
        from_attributes = True


# -------------------------
# Chat models
# -------------------------
class ChatBase(BaseModel):
    # ข้อมูลพื้นฐานของ chat
    user1_id: int  # ID ของ user1
    user2_id: int  # ID ของ user2

class ChatOut(ChatBase):
    # แสดง chat พร้อมข้อมูลเพิ่มเติม
    id: int  # ID chat
    created_at: datetime  # เวลาสร้าง chat
    user1_username: Optional[str] = None  # username ของ user1
    user2_username: Optional[str] = None  # username ของ user2
    item_title: Optional[str] = None  # ชื่อไอเท็มที่เกี่ยวข้อง (ถ้ามี)

    class Config:
        from_attributes = True


# -------------------------
# Chat with messages
# -------------------------
class ChatDetail(ChatOut):
    # แสดง chat พร้อมรายการข้อความ
    messages: List[MessageOut] = []  # รวม messages พร้อม username ของผู้ส่ง


# -------------------------
# Request models
# -------------------------
class ChatCreateRequest(BaseModel):
    # โมเดลสำหรับสร้าง chat ใหม่
    user1_id: int  # ID ผู้ใช้คนที่ 1
    user2_id: int  # ID ผู้ใช้คนที่ 2
    item_id: Optional[int] = None  # item_id จะส่งก็ได้ ไม่ส่งก็ได้

class MessageSendRequest(BaseModel):
    # โมเดลสำหรับส่งข้อความ
    chat_id: int  # ID ห้องแชท
    sender_id: int  # ID ผู้ส่ง
    message: str  # ข้อความที่จะส่ง