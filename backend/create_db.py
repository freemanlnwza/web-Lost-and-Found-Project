import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT
from dotenv import load_dotenv
import os

# โหลดค่า environment จากไฟล์ .env
load_dotenv()

DB_NAME = os.getenv("DB_NAME")
DB_USER = os.getenv("DB_USER")
DB_PASS = os.getenv("DB_PASS")
DB_HOST = os.getenv("DB_HOST")
DB_PORT = os.getenv("DB_PORT")

try:
    # connect ไปยัง postgres database หลัก
    conn = psycopg2.connect(dbname="postgres", user=DB_USER, password=DB_PASS, host=DB_HOST, port=DB_PORT)
    conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
    cur = conn.cursor()

    # สร้าง database ใหม่ (ถ้าไม่มี)
    cur.execute(f"CREATE DATABASE {DB_NAME};")

    cur.close()
    conn.close()
    print(f"Database {DB_NAME} created successfully!")

except psycopg2.errors.DuplicateDatabase:
    print(f"Database {DB_NAME} already exists, skipping creation.")

except Exception as e:
    print("Error creating database:", e)
