from database import Base
from sqlalchemy import Column, Integer, String, LargeBinary, ForeignKey
from sqlalchemy.orm import relationship
from pgvector.sqlalchemy import Vector

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, nullable=False)
    password = Column(String, nullable=False)

    # ความสัมพันธ์กับ Item
    items = relationship("Item", back_populates="user")


class Item(Base):
    __tablename__ = "items"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    type = Column(String, nullable=False)
    category = Column(String, nullable=False)

    # ภาพต้นฉบับ
    image_data = Column(LargeBinary, nullable=False)
    image_filename = Column(String, nullable=False)
    image_content_type = Column(String, nullable=False)

    # ภาพตีกรอบ
    boxed_image_data = Column(LargeBinary, nullable=True)

    # Embeddings
    text_embedding = Column(Vector(512), nullable=True)    # dimension = 512
    image_embedding = Column(Vector(512), nullable=True)

    # foreign key ไปยัง user
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    # ความสัมพันธ์กับ User
    user = relationship("User", back_populates="items")
