from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv

# โหลด .env
load_dotenv()

# ดึงค่า environment
POSTGRES_USER = os.getenv('DB_USER')
POSTGRES_PASSWORD = os.getenv('DB_PASS')
POSTGRES_HOST = os.getenv('DB_HOST')
POSTGRES_PORT = os.getenv('DB_PORT')
POSTGRES_DB = os.getenv('DB_NAME')

# ตรวจสอบค่า port ก่อนแปลง
if POSTGRES_PORT is None:
    POSTGRES_PORT = 5432  # ค่า default
else:
    POSTGRES_PORT = int(POSTGRES_PORT)

# สร้าง DATABASE_URL แบบใช้ค่าที่ถูกต้อง
DATABASE_URL = f"postgresql://{POSTGRES_USER}:{POSTGRES_PASSWORD}@{POSTGRES_HOST}:{POSTGRES_PORT}/{POSTGRES_DB}"

# สร้าง engine และ session
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# สำหรับ FastAPI dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()