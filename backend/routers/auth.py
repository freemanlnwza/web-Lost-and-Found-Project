import hashlib
import secrets, random, re
from fastapi import APIRouter, Depends, Form, Response, HTTPException
from sqlalchemy.orm import Session
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import smtplib
from datetime import datetime, timedelta
import os
import crud, schemas, models
from database import get_db


router = APIRouter(prefix="/auth", tags=["Auth"])


# ====================== ฟังก์ชันตรวจรหัสผ่าน ======================
def is_strong_password(password: str) -> bool:
    """ตรวจสอบความแข็งแรงของรหัสผ่าน"""
    return bool(re.match(
        r'^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$',
        password
    ))

# ====================== ฟังก์ชันส่งอีเมลด้วย SMTP ======================
def send_email_smtp(to_email: str, subject: str, body: str):
    sender_email = os.getenv("EMAIL_SENDER")
    app_password = os.getenv("EMAIL_APP_PASSWORD")
    if not sender_email or not app_password:
        raise HTTPException(status_code=500, detail="Email credentials not set")

    msg = MIMEMultipart()
    msg['From'] = sender_email
    msg['To'] = to_email
    msg['Subject'] = subject
    msg.attach(MIMEText(body, 'plain'))

    try:
        with smtplib.SMTP("smtp.gmail.com", 587) as server:
            server.starttls()
            server.login(sender_email, app_password)
            server.send_message(msg)
            print(f"ส่งอีเมลไปยัง {to_email} สำเร็จ ✅")
    except smtplib.SMTPAuthenticationError:
        raise HTTPException(status_code=500, detail="SMTP Authentication failed.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"ส่งอีเมลไม่สำเร็จ")

# ====================== REGISTER ======================
@router.post("/register")
def register_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    # ตรวจ username / email ซ้ำ
    if crud.get_user_by_username(db, user.username):
        raise HTTPException(status_code=400, detail="Username นี้ถูกใช้ไปแล้ว")
    if db.query(models.User).filter(models.User.email == user.email).first():
        raise HTTPException(status_code=400, detail="Email นี้ถูกใช้ไปแล้ว")

    # ตรวจรูปแบบอีเมล
    if not re.fullmatch(r'[\w\.-]+@(gmail\.com|outlook\.com|yahoo\.com|hotmail\.com)', user.email):
        raise HTTPException(status_code=400, detail="ต้องใช้อีเมล Gmail, Outlook, Yahoo, หรือ Hotmail เท่านั้น")

    # ตรวจรหัสผ่านแข็งแรง
    if not is_strong_password(user.password):
        raise HTTPException(status_code=400, detail="รหัสผ่านไม่แข็งแรงพอ")

    # สร้าง OTP
    otp = f"{random.randint(100000, 999999)}"
    otp_hashed = hashlib.sha256(otp.encode()).hexdigest()
    otp_expire = datetime.utcnow() + timedelta(minutes=5)

    # Hash password
    hashed_password = crud.hash_password(user.password)

    try:
        # ใช้ transaction เดียว
        db.query(models.EmailOTP).filter(models.EmailOTP.email == user.email).delete()
        db.query(models.TempUser).filter(models.TempUser.email == user.email).delete()

        db.add(models.EmailOTP(
            email=user.email,
            otp_hash=otp_hashed,
            expires_at=otp_expire,
            attempts=0
        ))

        temp_user = models.TempUser(
            username=user.username,
            email=user.email,
            password=hashed_password
        )
        db.add(temp_user)

        db.commit()  # commit ครั้งเดียวหลังทั้งหมด
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

    # ส่ง OTP ทางอีเมล (ไม่ต้องใช้ transaction)
    send_email_smtp(
        to_email=user.email,
        subject="ยืนยันอีเมลของคุณ",
        body=f"รหัส OTP ของคุณคือ: {otp}\nรหัสนี้ใช้ได้ 5 นาที"
    )

    return {"message": "ส่ง OTP ไปยังอีเมลแล้ว", "email": user.email}

# ====================== VERIFY OTP ======================
MAX_OTP_ATTEMPTS = 5

@router.post("/verify-otp")
def verify_otp(req: schemas.UserVerifyOTP, db: Session = Depends(get_db)):
    email = req.email
    otp_input = req.otp

    record = db.query(models.EmailOTP).filter(models.EmailOTP.email == email).first()
    if not record:
        raise HTTPException(status_code=400, detail="ไม่พบ OTP สำหรับอีเมลนี้")

    # ตรวจสอบหมดอายุ
    if datetime.utcnow() > record.expires_at:
        db.delete(record)
        db.commit()
        raise HTTPException(status_code=400, detail="OTP หมดอายุ")

    # ตรวจสอบจำนวนครั้ง
    if record.attempts >= MAX_OTP_ATTEMPTS:
        db.delete(record)
        db.commit()
        raise HTTPException(status_code=400, detail="พยายาม OTP เกินจำนวนครั้ง")

    # ตรวจสอบ OTP
    otp_hashed_input = hashlib.sha256(otp_input.encode()).hexdigest()
    if otp_hashed_input != record.otp_hash:
        record.attempts += 1
        db.commit()
        raise HTTPException(status_code=400, detail="OTP ไม่ถูกต้อง")

    # ดึง TempUser
    temp_user = db.query(models.TempUser).filter(models.TempUser.email == email).first()
    if not temp_user:
        raise HTTPException(status_code=400, detail="ไม่พบข้อมูลผู้ใช้ชั่วคราว")

    # สร้าง User จริง
    new_user = models.User(
        username=temp_user.username,
        email=temp_user.email,
        password=temp_user.password,
        is_verified=True
    )
    
    db.add(new_user)
    db.delete(record)
    db.delete(temp_user)
    db.commit()   # ✅ ต้องมี commit
    return {"message": "ยืนยัน OTP สำเร็จ! ลงทะเบียนเรียบร้อย ✅"}


# ====================== Login ======================
@router.post("/login", response_model=schemas.UserOut)
def login_user(
    response: Response,
    username: str = Form(...),
    password: str = Form(...),
    db: Session = Depends(get_db)
):
    user = crud.authenticate_user(db, username, password)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # สร้าง session token
    token = secrets.token_hex(32)
    db_session = models.Session(user_id=user.id, session_token=token)
    db.add(db_session)
    db.commit()
    
    # ตั้ง HttpOnly cookie
    response.set_cookie(
        key="session_token",
        value=token,
        httponly=True,
        secure=False,  # ใช้ HTTPS ใน production
        samesite="lax",
        path="/",
        max_age=60*60*24*7  # 7 วัน
    )
    
    # บันทึก log ถ้าเป็น admin
    if getattr(user, "role", "") == "admin":
        crud.log_admin_action(db, user.id, user.username, "Admin logged in", action_type="login")

    return user

# ====================== Logout ======================
@router.post("/logout")
def logout_user(
    response: Response,
    current_user: models.User = Depends(crud.get_current_user),  # ใช้ get_current_user จาก crud.py
    db: Session = Depends(get_db)
):
    # ลบ session ของ user ใน DB
    db.query(models.Session).filter(models.Session.user_id == current_user.id).delete()
    db.commit()
    
    # ลบ cookie
    response.delete_cookie(
        key="session_token",
        httponly=True,
        secure=False,
        path="/",  # ใช้ HTTPS ใน production
        samesite="lax",)
    
    # บันทึก log ถ้าเป็น admin
    if getattr(current_user, "role", "") == "admin":
        crud.log_admin_action(db, current_user.id, current_user.username, "Admin logged out", action_type="logout")
    
    return {"message": f"{current_user.username} logged out successfully"}
