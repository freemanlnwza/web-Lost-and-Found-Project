from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session
import models, crud
from crud import get_admin_user, log_admin_action
from database import get_db

router = APIRouter(prefix="/admin", tags=["Admin"])
security = HTTPBearer()

# Users
@router.get("/users")
def admin_get_users(credentials: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(get_db)):
    admin = get_admin_user(credentials, db)
    users = db.query(models.User).all()
    return [{"id": u.id, "username": u.username, "role": getattr(u, 'role', 'user')} for u in users]

@router.delete("/users/{user_id}")
def admin_delete_user(user_id: int, credentials: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(get_db)):
    admin = get_admin_user(credentials, db)
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if getattr(user, 'role', '') == "admin":
        raise HTTPException(status_code=403, detail="Cannot delete admin users")
    db.delete(user)
    db.commit()
    log_admin_action(db, admin.id, admin.username, f"Deleted user ID: {user_id}")
    return {"message": "User deleted"}

@router.patch("/users/{target_user_id}/make-admin")
def admin_make_admin(target_user_id: int, credentials: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(get_db)):
    admin = get_admin_user(credentials, db)
    user = db.query(models.User).filter(models.User.id == target_user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.role = "admin"
    db.commit()
    log_admin_action(db, admin.id, admin.username, f"Promoted {user.username} to admin")
    return {"message": f"{user.username} is now admin"}

# Items
@router.get("/items")
def admin_get_items(credentials: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(get_db)):
    admin = get_admin_user(credentials, db)
    items = db.query(models.Item).all()
    return [{"id": i.id, "title": i.title, "category": i.category, "user_id": i.user_id} for i in items]

@router.delete("/items/{item_id}")
def admin_delete_item(item_id: int, credentials: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(get_db)):
    admin = get_admin_user(credentials, db)
    item = db.query(models.Item).filter(models.Item.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    title = item.title
    db.delete(item)
    db.commit()
    log_admin_action(db, admin.id, admin.username, f"Deleted item '{title}' (ID: {item_id})")
    return {"message": "Item deleted"}

# Messages
@router.get("/messages")
def admin_get_messages(credentials: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(get_db)):
    admin = get_admin_user(credentials, db)
    messages = db.query(models.Message).all()
    return [{"id": m.id, "chat_id": m.chat_id, "sender_id": m.sender_id, "message": m.message} for m in messages]

@router.delete("/messages/{message_id}")
def admin_delete_message(message_id: int, credentials: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(get_db)):
    admin = get_admin_user(credentials, db)
    message = db.query(models.Message).filter(models.Message.id == message_id).first()
    if not message:
        raise HTTPException(status_code=404, detail="Message not found")
    db.delete(message)
    db.commit()
    log_admin_action(db, admin.id, admin.username, f"Deleted message (ID: {message_id})")
    return {"message": "Message deleted"}

# Logs
@router.get("/logs")
def admin_get_logs(credentials: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(get_db)):
    admin = get_admin_user(credentials, db)
    logs = db.query(models.AdminLog).order_by(models.AdminLog.timestamp.desc()).limit(50).all()
    return [
        {
            "id": l.id,
            "admin_username": l.admin_username,
            "action": l.action,
            "timestamp": l.timestamp,
            "action_type": l.action_type,   # ✅ เพิ่มบรรทัดนี้
        } for l in logs
    ]
