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
        from_attributes = True  # <-- ต้องมี

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
    image_data: Optional[str]
    image_filename: str
    user: Optional[UserOut] = None  # <-- เปลี่ยนจาก user_id

    class Config:
        from_attributes = True
