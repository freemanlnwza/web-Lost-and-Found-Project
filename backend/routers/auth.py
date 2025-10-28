import secrets, random, re
from fastapi import APIRouter, Depends, Form, Response, HTTPException
from sqlalchemy.orm import Session
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import smtplib
from datetime import datetime, timedelta

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
    sender_email = "nrathron1@gmail.com"
    app_password = "ilfutfqqgngddkvt"

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
        raise HTTPException(status_code=500, detail=f"ส่งอีเมลไม่สำเร็จ: {str(e)}")

# ====================== 1️⃣ สร้าง OTP + เก็บข้อมูลชั่วคราว ======================
@router.post("/register")
def register_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    # ตรวจ username / email ซ้ำ
    if crud.get_user_by_username(db, user.username):
        raise HTTPException(status_code=400, detail="Username นี้ถูกใช้ไปแล้ว")
    if db.query(models.User).filter(models.User.email == user.email).first():
        raise HTTPException(status_code=400, detail="Email นี้ถูกใช้ไปแล้ว")

    # ตรวจรูปแบบ Gmail
    if not re.match(r'^[\w\.-]+@gmail\.com$', user.email):
        raise HTTPException(status_code=400, detail="ต้องใช้อีเมล Gmail เท่านั้น")

    # ตรวจรหัสผ่านแข็งแรง
    if not is_strong_password(user.password):
        raise HTTPException(status_code=400, detail="รหัสผ่านไม่แข็งแรงพอ")

    # สร้าง OTP
    otp = str(random.randint(100000, 999999))

    # ลบ OTP เดิมและ TempUser เดิม
    db.query(models.EmailOTP).filter(models.EmailOTP.email == user.email).delete()
    db.query(models.TempUser).filter(models.TempUser.email == user.email).delete()
    db.commit()

    # เก็บ OTP ใหม่ 5 นาที
    otp_expire = datetime.utcnow() + timedelta(minutes=5)
    db.add(models.EmailOTP(email=user.email, otp=otp, expires_at=otp_expire))
    db.commit()

    # Hash password
    password_bytes = user.password.encode("utf-8")
    truncated_password = password_bytes[:72].decode("utf-8", "ignore")
    hashed_password = crud.hash_password(truncated_password)

    # สร้าง TempUser
    temp_user = models.TempUser(
        username=user.username,
        email=user.email,
        password=hashed_password
    )
    db.add(temp_user)
    db.commit()

    # ส่ง OTP ทางอีเมล
    send_email_smtp(
        to_email=user.email,
        subject="ยืนยันอีเมลของคุณ",
        body=f"รหัส OTP ของคุณคือ: {otp}\nรหัสนี้ใช้ได้ 5 นาที"
    )

    return {"message": "ส่ง OTP ไปยังอีเมลแล้ว", "email": user.email}



@router.post("/verify-otp")
def verify_otp(req: schemas.UserVerifyOTP, db: Session = Depends(get_db)):
    email = req.email
    otp = req.otp

    record = db.query(models.EmailOTP).filter(models.EmailOTP.email == email).first()
    if not record:
        raise HTTPException(status_code=400, detail="ไม่พบ OTP สำหรับอีเมลนี้")

    # ตรวจสอบหมดอายุ
    if datetime.utcnow() > record.expires_at:
        db.delete(record)
        db.commit()
        raise HTTPException(status_code=400, detail="OTP หมดอายุ")

    # ตรวจสอบ OTP
    if record.otp != otp:
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

    # ลบ OTP และ TempUser
    db.delete(record)
    db.delete(temp_user)
    db.commit()

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
