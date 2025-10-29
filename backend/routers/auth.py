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
from models import User, EmailOTP
from schemas import ResetRequest, VerifyOTPRequest, UpdatePasswordRequest

router = APIRouter(prefix="/auth", tags=["Auth"])

MAX_OTP_ATTEMPTS = 5
OTP_EXPIRE_MINUTES = 5
OTP_REQUEST_COOLDOWN_SECONDS = 300  # กัน Spam OTP

# ====================== Step 1: Request Reset ======================
@router.post("/reset-password/request")
def request_reset(data: ResetRequest, db: Session = Depends(get_db)):
    username = data.username
    email = data.email

    # ตรวจสอบว่ามี user ตรงกัน
    user = db.query(User).filter(User.username == username, User.email == email).first()
    if not user:
        # ถ้าไม่ตรงให้ raise 404 หรือส่งข้อความ error ไป frontend
        raise HTTPException(status_code=404, detail="Username and email do not match")

    # ตรวจสอบ cooldown
    last_otp = db.query(EmailOTP).filter(EmailOTP.email == email).first()
    if last_otp:
        cooldown_end = last_otp.expires_at - timedelta(minutes=OTP_EXPIRE_MINUTES) + timedelta(seconds=OTP_REQUEST_COOLDOWN_SECONDS)
        if datetime.utcnow() < cooldown_end:
            raise HTTPException(status_code=429, detail="Hold on a moment before requesting a new OTP")

    # สร้าง OTP แบบปลอดภัย
    otp = f"{secrets.randbelow(900000) + 100000}"  # 6 หลัก
    otp_hashed = hashlib.sha256(otp.encode()).hexdigest()
    expires_at = datetime.utcnow() + timedelta(minutes=OTP_EXPIRE_MINUTES)

    # ลบ OTP เก่าแล้วบันทึก OTP ใหม่
    db.query(EmailOTP).filter(EmailOTP.email == email).delete()
    db.add(EmailOTP(email=email, otp_hash=otp_hashed, expires_at=expires_at, attempts=0))
    db.commit()

    # ส่ง OTP ทางอีเมล
    send_email_smtp(
        to_email=email,
        subject="Reset Password OTP",
        body=f"Your OTP for resetting your password is: {otp}\nThis code is valid for {OTP_EXPIRE_MINUTES} minutes"
    )

    return {"message": "OTP has been sent to your email"}

# ====================== Step 2: Verify OTP ======================
@router.post("/reset-password/verify-otp")
def verify_reset_otp(data: VerifyOTPRequest, db: Session = Depends(get_db)):
    email = data.email
    otp = data.otp

    record = db.query(EmailOTP).filter(EmailOTP.email == email).first()
    if not record:
        raise HTTPException(status_code=400, detail="OTP Incorrect")

    if datetime.utcnow() > record.expires_at:
        db.delete(record)
        db.commit()
        raise HTTPException(status_code=400, detail="OTP Expired")

    if record.attempts >= MAX_OTP_ATTEMPTS:
        db.delete(record)
        db.commit()
        raise HTTPException(status_code=400, detail="Too many OTP attempts")

    otp_hashed_input = hashlib.sha256(otp.encode()).hexdigest()
    if otp_hashed_input != record.otp_hash:
        record.attempts += 1
        db.commit()
        raise HTTPException(status_code=400, detail="OTP Incorrect")

    return {"message": "OTP Correct ✅", "email": email}

# ====================== Step 3: Update Password ======================
@router.put("/reset-password/update")
def update_password(data: UpdatePasswordRequest, db: Session = Depends(get_db)):
    email = data.email
    new_password = data.new_password

    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=400, detail="User not found")

    # ห้ามตั้งรหัสผ่านเดิม
    if crud.verify_password(new_password, user.password):
        raise HTTPException(status_code=400, detail="The new password must not be the same as the previous one")

    if not crud.is_strong_password(new_password):
        raise HTTPException(status_code=400, detail="Password is not strong")

    user.password = crud.hash_password(new_password)
    db.query(EmailOTP).filter(EmailOTP.email == email).delete()
    db.commit()

    return {"message": "Password changed successfully ✅"}

# ====================== SMTP ======================
def send_email_smtp(to_email: str, subject: str, body: str):
    sender_email = os.getenv("EMAIL_SENDER")
    app_password = os.getenv("EMAIL_APP_PASSWORD")
    if not sender_email or not app_password:
        raise HTTPException(status_code=500, detail="Email credentials not set")

    msg = MIMEMultipart()
    msg["From"] = sender_email
    msg["To"] = to_email
    msg["Subject"] = subject
    msg.attach(MIMEText(body, "plain"))

    try:
        with smtplib.SMTP("smtp.gmail.com", 587) as server:
            server.starttls()
            server.login(sender_email, app_password)
            server.send_message(msg)
    except:
        raise HTTPException(status_code=500, detail="Failed to send the email")

# ====================== REGISTER ======================
@router.post("/register")
def register_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    # ตรวจ username / email ซ้ำ
    if crud.get_user_by_username(db, user.username):
        raise HTTPException(status_code=400, detail="Username is already taken")
    if db.query(models.User).filter(models.User.email == user.email).first():
        raise HTTPException(status_code=400, detail="Email is already taken")

    # ตรวจรูปแบบอีเมล
    if not re.fullmatch(r'[\w\.-]+@(gmail\.com|outlook\.com|yahoo\.com|hotmail\.com)', user.email):
        raise HTTPException(status_code=400, detail="Please use a Gmail, Outlook, Yahoo, Hotmail email address")

    # ตรวจรหัสผ่านแข็งแรง
    if not crud.is_strong_password(user.password):
        raise HTTPException(status_code=400, detail="Password is not strong")

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
        subject="Comfirm your email",
        body=f"Your OTP is: {otp}\nThis code is valid for {OTP_EXPIRE_MINUTES} minutes"
    )

    return {"message": "Your OTP has been sent to your email", "email": user.email}

# ====================== VERIFY OTP ======================


@router.post("/verify-otp")
def verify_otp(req: schemas.UserVerifyOTP, db: Session = Depends(get_db)):
    email = req.email
    otp_input = req.otp

    record = db.query(models.EmailOTP).filter(models.EmailOTP.email == email).first()
    if not record:
        raise HTTPException(status_code=400, detail="No OTP found for this email")

    # ตรวจสอบหมดอายุ
    if datetime.utcnow() > record.expires_at:
        db.delete(record)
        db.commit()
        raise HTTPException(status_code=400, detail="OTP Expired")

    # ตรวจสอบจำนวนครั้ง
    if record.attempts >= MAX_OTP_ATTEMPTS:
        db.delete(record)
        db.commit()
        raise HTTPException(status_code=400, detail="Too many OTP attempts")

    # ตรวจสอบ OTP
    otp_hashed_input = hashlib.sha256(otp_input.encode()).hexdigest()
    if otp_hashed_input != record.otp_hash:
        record.attempts += 1
        db.commit()
        raise HTTPException(status_code=400, detail="OTP Incorrect")

    # ดึง TempUser
    temp_user = db.query(models.TempUser).filter(models.TempUser.email == email).first()
    if not temp_user:
        raise HTTPException(status_code=400, detail="Incorrect information")

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
    return {"message": "OTP verification successful! Registration completed ✅"}


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
