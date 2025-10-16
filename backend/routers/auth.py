from fastapi import APIRouter, Depends, Form, HTTPException
from fastapi import security
from fastapi.security import HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
import crud, schemas
from database import get_db
from crud import get_admin_user, log_admin_action

router = APIRouter(prefix="/auth", tags=["Auth"])
security = security.HTTPBearer()
@router.post("/register", response_model=schemas.UserOut)
def register_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    existing_user = crud.get_user_by_username(db, user.username)
    if existing_user:
        raise HTTPException(status_code=400, detail="Username นี้ถูกใช้ไปแล้ว")
    return crud.create_user(db=db, user=user)

@router.post("/login", response_model=schemas.UserOut)
def login_user(username: str = Form(...), password: str = Form(...), db: Session = Depends(get_db)):
    user = crud.authenticate_user(db, username, password)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    if user.role == "admin":
        log_admin_action(db, admin_id=user.id, admin_username=user.username, action="Login")
    return user

@router.post("/logout")
def logout_user(username: str = Form(...), db: Session = Depends(get_db)):
    admin = db.query(crud.models.User).filter_by(username=username, role="admin").first()
    if admin:
        crud.log_admin_action(db, admin.id, admin.username, "Logout")
    return {"message": "Logged out successfully"}