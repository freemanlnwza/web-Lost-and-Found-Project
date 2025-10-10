from pydantic import BaseModel
from typing import Optional, List

# -------- User --------
class UserCreate(BaseModel):
    username: str
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

    class Config:
        from_attributes = True


# -------- Item --------
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

    # ✅ เพิ่มฟิลด์ใหม่เพื่อแสดงใน ResultPage.jsx
    similarity: Optional[float] = None
    query_vector_first2: Optional[List[float]] = None
    item_vector_first2: Optional[List[float]] = None

    class Config:
        from_attributes = True
