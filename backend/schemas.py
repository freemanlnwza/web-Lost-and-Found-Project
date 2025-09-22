from pydantic import BaseModel
from typing import Optional

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
    image_data: Optional[str]            # ภาพต้นฉบับ
    boxed_image_data: Optional[str]      # ภาพที่ตีกรอบ
    image_filename: str
    user_id: int
    username: str 

    class Config:
        from_attributes = True
