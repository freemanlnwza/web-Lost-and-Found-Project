from database import Base
from sqlalchemy import Column, Integer, String, LargeBinary, ForeignKey, DateTime, func, Text
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime
from pgvector.sqlalchemy import Vector


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, nullable=False)
    password = Column(String, nullable=False)
    role = Column(String(20), default="user")

    items = relationship("Item", back_populates="user")

    # 👇 เพิ่ม
    sent_messages = relationship("Message", back_populates="sender", cascade="all, delete")
    chats_as_user1 = relationship("Chat", foreign_keys="Chat.user1_id", back_populates="user1")
    chats_as_user2 = relationship("Chat", foreign_keys="Chat.user2_id", back_populates="user2")
    admin_logs = relationship("AdminLog", back_populates="admin")


class Item(Base):
    __tablename__ = "items"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    type = Column(String, nullable=False)
    category = Column(String, nullable=False)

    image_data = Column(LargeBinary, nullable=False)
    image_filename = Column(String, nullable=False)
    image_content_type = Column(String, nullable=False)
    boxed_image_data = Column(LargeBinary, nullable=True)

    text_embedding = Column(Vector(512), nullable=True)
    image_embedding = Column(Vector(512), nullable=True)

    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    user = relationship("User", back_populates="items")

# Chat Model
class Chat(Base):
    __tablename__ = "chats"
    
    id = Column(Integer, primary_key=True, index=True)
    user1_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    user2_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    item_id = Column(Integer, ForeignKey("items.id"), nullable=True)  # เพิ่ม optional
    created_at = Column(DateTime(timezone=False), server_default=func.now())

    user1 = relationship("User", foreign_keys=[user1_id], back_populates="chats_as_user1")
    user2 = relationship("User", foreign_keys=[user2_id], back_populates="chats_as_user2")
    item = relationship("Item")  # เพื่อดึงรูปภาพถ้า chat เกี่ยวข้อง
    messages = relationship("Message", back_populates="chat", cascade="all, delete")

# Message Model
class Message(Base):
    __tablename__ = "messages"
    
    id = Column(Integer, primary_key=True, index=True)
    chat_id = Column(Integer, ForeignKey("chats.id", ondelete="CASCADE"))
    sender_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    message = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=False), server_default=func.now())

    chat = relationship("Chat", back_populates="messages")
    sender = relationship("User", back_populates="sent_messages")

# AdminLog Model
class AdminLog(Base):
    __tablename__ = "admin_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    admin_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    admin_username = Column(String(100), nullable=False)
    action = Column(Text, nullable=False)
    timestamp = Column(DateTime(timezone=False), server_default=func.now())
    
    admin = relationship("User", back_populates="admin_logs")