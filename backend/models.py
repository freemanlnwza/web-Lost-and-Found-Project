from database import Base
from sqlalchemy import Column, Integer, String, LargeBinary, ForeignKey, DateTime, func, Text
from sqlalchemy.orm import relationship
from pgvector.sqlalchemy import Vector

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, nullable=False)
    password = Column(String, nullable=False)

    items = relationship("Item", back_populates="user")

    # 👇 เพิ่ม
    sent_messages = relationship("Message", back_populates="sender", cascade="all, delete")
    chats_as_user1 = relationship("Chat", foreign_keys="Chat.user1_id", back_populates="user1")
    chats_as_user2 = relationship("Chat", foreign_keys="Chat.user2_id", back_populates="user2")


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


class Chat(Base):
    __tablename__ = "chats"

    id = Column(Integer, primary_key=True, index=True)

    # 👇 เพิ่ม ForeignKey ชี้ไปยัง users.id
    user1_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    user2_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    created_at = Column(DateTime(timezone=False), server_default=func.now())

    # 👇 เพิ่มความสัมพันธ์กับ User
    user1 = relationship("User", foreign_keys=[user1_id], back_populates="chats_as_user1")
    user2 = relationship("User", foreign_keys=[user2_id], back_populates="chats_as_user2")

    messages = relationship("Message", back_populates="chat", cascade="all, delete")


class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)
    chat_id = Column(Integer, ForeignKey("chats.id", ondelete="CASCADE"))
    sender_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    message = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=False), server_default=func.now())

    chat = relationship("Chat", back_populates="messages")
    sender = relationship("User", back_populates="sent_messages")
