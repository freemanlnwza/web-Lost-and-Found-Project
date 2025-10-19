from fastapi import APIRouter, Depends, Form, HTTPException
from sqlalchemy.orm import Session
import crud, schemas
from database import get_db

router = APIRouter(prefix="/auth", tags=["Auth"])

@router.post("/register", response_model=schemas.UserOut)
def register_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    existing_user = crud.get_user_by_username(db, user.username)
    if existing_user:
        raise HTTPException(status_code=400, detail="Username นี้ถูกใช้ไปแล้ว")
    return crud.create_user(db=db, user=user)

from crud import log_admin_action

@router.post("/login", response_model=schemas.UserOut)
def login_user(username: str = Form(...), password: str = Form(...), db: Session = Depends(get_db)):
    user = crud.authenticate_user(db, username, password)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # ✅ ถ้าเป็น admin บันทึก login log
    if getattr(user, 'role', '') == "admin":
        log_admin_action(db, user.id, user.username, f"Admin {user.username} logged in", action_type="login")
    
    return user

@router.post("/logout")
def logout_user(username: str = Form(...), db: Session = Depends(get_db)):
    user = crud.get_user_by_username(db, username)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # ✅ ถ้าเป็น admin ให้บันทึก log logout
    if getattr(user, 'role', '') == "admin":
        log_admin_action(db, user.id, user.username, f"Admin {user.username} logged out", action_type="logout")

    return {"message": f"{user.username} logged out successfully"}
