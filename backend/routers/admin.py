import base64
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
import models
from crud import get_current_admin
from database import get_db
import crud
router = APIRouter(prefix="/admin", tags=["Admin"])

# Helper function ดึง admin จาก cookie


# ================= Users =================
@router.get("/users")
def admin_get_users(admin: models.User = Depends(get_current_admin), db: Session = Depends(get_db)):
    users = db.query(models.User).all()
    return [{"id": u.id, "username": u.username, "role": getattr(u, 'role', 'user')} for u in users]


@router.delete("/users/{user_id}")
def admin_delete_user(
    user_id: int, 
    admin: models.User = Depends(get_current_admin), 
    db: Session = Depends(get_db)
):
    # ดึง user ก่อน
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # ป้องกันการลบ admin คนอื่นโดยไม่ได้ตั้งใจ
    if getattr(user, "role", "") == "admin":
        raise HTTPException(status_code=403, detail="Cannot delete admin users")

    # ✅ ลบ session ที่อ้างอิงถึง user นี้ก่อน
    db.query(models.Session).filter(models.Session.user_id == user_id).delete()

    # ✅ ลบ user
    db.delete(user)
    db.commit()

    # ✅ Log action
    crud.log_admin_action(
        db,
        admin.id,
        admin.username,
        f"Deleted username: {user.username}",
        action_type="delete_user"
    )

    return {"message": "User deleted ✅"}



@router.patch("/users/{target_user_id}/make-admin")
def admin_make_admin(target_user_id: int, admin: models.User = Depends(get_current_admin), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.id == target_user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.role = "admin"
    db.commit()
    crud.log_admin_action(db, admin.id, admin.username, f"Promoted {user.username} to admin")
    return {"message": f"{user.username} is now admin"}


# ================= Items =================
@router.get("/items")
def admin_get_items(admin: models.User = Depends(get_current_admin), db: Session = Depends(get_db)):
    items = db.query(models.Item).all()
    return [
        {
            "id": i.id,
            "title": i.title,
            "category": i.category,
            "image": base64.b64encode(i.original_image_data).decode("utf-8") if i.original_image_data else None,
            "user_id": i.user_id
        } for i in items
    ]


@router.delete("/items/{item_id}")
def admin_delete_item(item_id: int, admin: models.User = Depends(get_current_admin), db: Session = Depends(get_db)):
    item = db.query(models.Item).filter(models.Item.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    title = item.title
    db.delete(item)
    db.commit()
    crud.log_admin_action(db, admin.id, admin.username, f"Deleted item '{title}' (ID: {item_id})", action_type="delete_post")
    return {"message": "Item deleted"}


# ================= Messages =================
@router.get("/messages")
def admin_get_messages(admin: models.User = Depends(get_current_admin), db: Session = Depends(get_db)):
    messages = db.query(models.Message).all()
    return [{"id": m.id, "chat_id": m.chat_id, "sender_id": m.sender_id, "message": m.message} for m in messages]


@router.delete("/messages/{message_id}")
def admin_delete_message(message_id: int, admin: models.User = Depends(get_current_admin), db: Session = Depends(get_db)):
    message = db.query(models.Message).filter(models.Message.id == message_id).first()
    if not message:
        raise HTTPException(status_code=404, detail="Message not found")
    db.delete(message)
    db.commit()
    crud.log_admin_action(db, admin.id, admin.username, f"Deleted message (ID: {message_id})")
    return {"message": "Message deleted"}


# ================= Logs =================
@router.get("/logs")
def admin_get_logs(admin: models.User = Depends(get_current_admin), db: Session = Depends(get_db)):
    logs = db.query(models.AdminLog).order_by(models.AdminLog.timestamp.desc()).limit(50).all()
    return [
        {
            "id": l.id,
            "admin_username": l.admin_username,
            "action": l.action,
            "timestamp": l.timestamp,
            "action_type": l.action_type,
        } for l in logs
    ]


@router.get("/logs/count")
def admin_logs_count(admin: models.User = Depends(get_current_admin), db: Session = Depends(get_db)):
    total = db.query(models.AdminLog).count()
    return {"total_logs": total}
