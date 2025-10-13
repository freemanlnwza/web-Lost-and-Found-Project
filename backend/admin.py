# ==================== ADMIN ROUTES ====================

from http.client import HTTPException
from fastapi.params import Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from polars import datetime
from requests import Session

from backend import models
from backend.database import get_db

security = HTTPBearer()

def get_admin_user(credentials: HTTPAuthorizationCredentials, db: Session):
    """Helper to get and verify admin user from Bearer token"""
    try:
        user_id = int(credentials.credentials)
        user = db.query(models.User).filter(models.User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        if not hasattr(user, 'role') or user.role != "admin":
            raise HTTPException(status_code=403, detail="Admin access required")
        return user
    except ValueError:
        raise HTTPException(status_code=401, detail="Invalid token")

def log_admin_action(db: Session, admin_id: int, admin_username: str, action: str):
    """Log admin action"""
    try:
        log = models.AdminLog(
            admin_id=admin_id,
            admin_username=admin_username,
            action=action,
            timestamp=datetime.now()
        )
        db.add(log)
        db.commit()
    except Exception as e:
        print(f"Failed to log admin action: {e}")

@app.get("/admin/users") # type: ignore
def admin_get_users(credentials: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(get_db)):
    """Get all users (admin only)"""
    admin = get_admin_user(credentials, db)
    users = db.query(models.User).all()
    return [{"id": u.id, "username": u.username, "role": u.role if hasattr(u, 'role') else 'user'} for u in users]

@app.get("/admin/items") # type: ignore
def admin_get_items(credentials: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(get_db)):
    """Get all items (admin only)"""
    admin = get_admin_user(credentials, db)
    items = db.query(models.Item).all()
    return [{"id": i.id, "title": i.title, "category": i.category, "user_id": i.user_id} for i in items]

@app.get("/admin/messages") # type: ignore
def admin_get_messages(credentials: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(get_db)):
    """Get all messages (admin only)"""
    admin = get_admin_user(credentials, db)
    messages = db.query(models.Message).all()
    return [{"id": m.id, "chat_id": m.chat_id, "sender_id": m.sender_id, "message": m.message} for m in messages]

@app.get("/admin/logs") # type: ignore
def admin_get_logs(credentials: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(get_db)):
    """Get admin logs (admin only)"""
    admin = get_admin_user(credentials, db)
    logs = db.query(models.AdminLog).order_by(models.AdminLog.timestamp.desc()).limit(50).all()
    return [{"id": l.id, "admin_username": l.admin_username, "action": l.action, "timestamp": l.timestamp} for l in logs]

@app.delete("/admin/users/{target_user_id}") # type: ignore
def admin_delete_user(target_user_id: int, credentials: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(get_db)):
    """Delete user (admin only)"""
    admin = get_admin_user(credentials, db)
    user = db.query(models.User).filter(models.User.id == target_user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if hasattr(user, 'role') and user.role == "admin":
        raise HTTPException(status_code=403, detail="Cannot delete admin users")
    
    username = user.username
    db.delete(user)
    db.commit()
    log_admin_action(db, admin.id, admin.username, f"Deleted user {username} (ID: {target_user_id})")
    return {"message": "User deleted"}

@app.delete("/admin/items/{item_id}") # type: ignore
def admin_delete_item(item_id: int, credentials: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(get_db)):
    """Delete item (admin only)"""
    admin = get_admin_user(credentials, db)
    item = db.query(models.Item).filter(models.Item.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    title = item.title
    db.delete(item)
    db.commit()
    log_admin_action(db, admin.id, admin.username, f"Deleted item '{title}' (ID: {item_id})")
    return {"message": "Item deleted"}

@app.delete("/admin/messages/{message_id}") # type: ignore
def admin_delete_message(message_id: int, credentials: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(get_db)):
    """Delete message (admin only)"""
    admin = get_admin_user(credentials, db)
    message = db.query(models.Message).filter(models.Message.id == message_id).first()
    if not message:
        raise HTTPException(status_code=404, detail="Message not found")
    
    db.delete(message)
    db.commit()
    log_admin_action(db, admin.id, admin.username, f"Deleted message (ID: {message_id})")
    return {"message": "Message deleted"}

@app.patch("/admin/users/{target_user_id}/make-admin") # type: ignore
def admin_make_admin(target_user_id: int, credentials: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(get_db)):
    """Promote user to admin (admin only)"""
    admin = get_admin_user(credentials, db)
    user = db.query(models.User).filter(models.User.id == target_user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user.role = "admin"
    db.commit()
    log_admin_action(db, admin.id, admin.username, f"Promoted {user.username} to admin")
    return {"message": f"{user.username} is now admin"}

@app.patch("/admin/users/{target_user_id}/remove-admin") # type: ignore
def admin_remove_admin(target_user_id: int, credentials: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(get_db)):
    """Remove admin role (admin only)"""
    admin = get_admin_user(credentials, db)
    if target_user_id == admin.id:
        raise HTTPException(status_code=403, detail="Cannot remove your own admin role")
    
    user = db.query(models.User).filter(models.User.id == target_user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user.role = "user"
    db.commit()
    log_admin_action(db, admin.id, admin.username, f"Removed admin role from {user.username}")
    return {"message": f"{user.username} is now a regular user"}