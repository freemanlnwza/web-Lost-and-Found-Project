from database import Base
from sqlalchemy import Column, Integer, String, LargeBinary, ForeignKey, DateTime, func, Text, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from pgvector.sqlalchemy import Vector

class Session(Base):
    __tablename__ = "sessions"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    session_token = Column(String, unique=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
# ======================
# User Model
# ======================
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, nullable=False)
    password = Column(String, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    role = Column(String(20), default="user")
    is_verified = Column(Boolean, default=True)  # 1=verified, 0=unverified (ใช้สำหรับ safety)

    items = relationship("Item", back_populates="user", cascade="all, delete")
    sent_messages = relationship("Message", back_populates="sender", cascade="all, delete")
    chats_as_user1 = relationship("Chat", foreign_keys="Chat.user1_id", back_populates="user1", cascade="all, delete")
    chats_as_user2 = relationship("Chat", foreign_keys="Chat.user2_id", back_populates="user2", cascade="all, delete")
    admin_logs = relationship("AdminLog", back_populates="admin")

# ======================
# TempUser Model (ใหม่)
# ======================
class TempUser(Base):
    __tablename__ = "temp_users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    password = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

# ======================
# Email OTP Model
# ======================
class EmailOTP(Base):
    __tablename__ = "email_otps"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, nullable=False)
    otp_hash = Column(String, nullable=False)   # เพิ่มคอลัมน์นี้
    expires_at = Column(DateTime, nullable=False)
    attempts = Column(Integer, default=0)


# ======================
# Item Model
# ======================
class Item(Base):
    __tablename__ = "items"

    id = Column(Integer, primary_key=True, index=True)  # ID ของไอเท็ม
    title = Column(String, nullable=False)  # ชื่อไอเท็ม
    type = Column(String, nullable=False)  # lost หรือ found
    category = Column(String, nullable=False)  # หมวดหมู่

    image_data = Column(LargeBinary, nullable=False)  # ไฟล์รูปไบต์ของไอเท็ม
    image_filename = Column(String, nullable=False)  # ชื่อไฟล์
    image_content_type = Column(String, nullable=False)  # ประเภทไฟล์ (MIME)
    boxed_image_data = Column(LargeBinary, nullable=True)  # รูปพร้อมกรอบ (optional)

    text_embedding = Column(Vector(512), nullable=True)  # embedding ของข้อความ
    image_embedding = Column(Vector(512), nullable=True)  # embedding ของภาพ
    original_image_data = Column(LargeBinary, nullable=True)

    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)  # ID ผู้โพสต์
    user = relationship("User", back_populates="items")  # ความสัมพันธ์ไปยังผู้ใช้

    
# ======================
# Chat Model
# ======================
class Chat(Base):
    __tablename__ = "chats"
    
    id = Column(Integer, primary_key=True, index=True)  # ID ห้องแชท
    user1_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)  # ID ผู้ใช้คนที่ 1
    user2_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)  # ID ผู้ใช้คนที่ 2
    item_id = Column(Integer, ForeignKey("items.id"), nullable=True)  # ID ไอเท็มที่เกี่ยวข้อง (optional)
    created_at = Column(DateTime(timezone=False), server_default=func.now())  # เวลาสร้าง chat

    user1 = relationship("User", foreign_keys=[user1_id], back_populates="chats_as_user1")  # ความสัมพันธ์กับ user1
    user2 = relationship("User", foreign_keys=[user2_id], back_populates="chats_as_user2")  # ความสัมพันธ์กับ user2
    item = relationship("Item")  # ความสัมพันธ์กับไอเท็ม
    messages = relationship("Message", back_populates="chat", cascade="all, delete")  # ข้อความใน chat


# ======================
# Message Model
# ======================
class Message(Base):
    __tablename__ = "messages"
    
    id = Column(Integer, primary_key=True, index=True)  # ID ข้อความ
    chat_id = Column(Integer, ForeignKey("chats.id", ondelete="CASCADE"))  # ID ห้องแชท
    sender_id = Column(Integer, ForeignKey("users.id"), nullable=False)  # ID ผู้ส่ง
    message = Column(Text, nullable=False)  # ข้อความ
    image_data = Column(LargeBinary, nullable=True)
    image_content_type = Column(String(100), nullable=True)
    image_filename = Column(String(255), nullable=True)

    created_at = Column(DateTime(timezone=False), server_default=func.now())  # เวลาสร้าง

    chat = relationship("Chat", back_populates="messages")  # ความสัมพันธ์ไปยัง chat
    sender = relationship("User", back_populates="sent_messages")  # ความสัมพันธ์ไปยังผู้ส่ง


# ======================
# AdminLog Model
# ======================
class AdminLog(Base):
    __tablename__ = "admin_logs"
    
    id = Column(Integer, primary_key=True, index=True)  # ID log
    admin_id = Column(Integer, ForeignKey("users.id"), nullable=False)  # ID admin ที่ทำ action
    admin_username = Column(String(100), nullable=False)  # username ของ admin
    action = Column(Text, nullable=False)  # รายละเอียด action
    action_type = Column(String(50), nullable=True)  # ✅ เพิ่ม field ใหม่
    timestamp = Column(DateTime(timezone=False), server_default=func.now())  # เวลาที่ทำ action
    
    admin = relationship("User", back_populates="admin_logs")  # ความสัมพันธ์ไปยังผู้ดูแล

# ======================
# Report Model
# ======================
class Report(Base):
    __tablename__ = "reports"

    id = Column(Integer, primary_key=True, index=True)
    reporter_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    reported_user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    item_id = Column(Integer, ForeignKey("items.id", ondelete="CASCADE"), nullable=True)
    type = Column(String(20), nullable=False, default="item")  # item / chat / user
    comment = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=False), server_default=func.now())

    reporter = relationship("User", foreign_keys=[reporter_id])
    reported_user = relationship("User", foreign_keys=[reported_user_id])
    item = relationship("Item")
