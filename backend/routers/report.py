from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import Chat, Report, User, Item
from crud import get_current_user
import schemas

router = APIRouter(prefix="/api", tags=["report"])


# ============================
# ✅ สร้างรายงาน (Report)
# ============================
@router.post("/report")
def create_report(
    report: schemas.ReportCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    item = None
    chat = None
    reported_user_id = None

    # ---------- รายงาน item ----------
    if report.item_id is not None:
        item = db.query(Item).filter(Item.id == report.item_id).first()
        if not item:
            raise HTTPException(status_code=404, detail="Reported item not found")
        reported_user_id = item.user_id

        if reported_user_id == current_user.id:
            raise HTTPException(status_code=400, detail="You cannot report yourself")

    # ---------- รายงาน chat ----------
    elif report.chat_id is not None:
        chat = db.query(Chat).filter(Chat.id == report.chat_id).first()
        if not chat:
            raise HTTPException(status_code=404, detail="Reported chat not found")
        
        # เลือกผู้ถูก report เป็นอีกฝ่าย ไม่สนว่า item เป็นของ current_user หรือไม่
        if current_user.id == chat.user1_id:
            reported_user_id = chat.user2_id
        elif current_user.id == chat.user2_id:
            reported_user_id = chat.user1_id
        else:
            raise HTTPException(status_code=400, detail="You cannot report a chat you are not part of")
    else:
        raise HTTPException(status_code=400, detail="Please provide an item_id or chat_id")

    # ---------- ตรวจสอบรายงานซ้ำ ----------
    query = db.query(Report).filter(
        Report.reporter_id == current_user.id,
        Report.reported_user_id == reported_user_id,
        Report.type == report.type
    )

    if report.item_id is not None:
        query = query.filter(Report.item_id == report.item_id)
    if report.chat_id is not None:
        query = query.filter(Report.chat_id == report.chat_id)

    existing_report = query.first()
    if existing_report:
        raise HTTPException(status_code=400, detail="You have already reported this content")

    # ---------- สร้าง snapshot ----------
    new_report = Report(
        reporter_id=current_user.id,
        reported_user_id=reported_user_id,
        item_id=report.item_id,
        chat_id=report.chat_id,
        type=report.type,
        comment=report.comment or "",
        reported_username=db.query(User.username).filter(User.id == reported_user_id).scalar(),
        reported_item_title=item.title if item else None,
        reported_item_image=None,
        reported_chat_preview=(
        chat.messages[-1].message[:100] if chat and chat.messages else None
    )
    )

    db.add(new_report)
    db.commit()
    db.refresh(new_report)

    return {
        "message": "Report successful",
        "report_id": new_report.id,
        "reported_user": reported_user_id,
        "type": report.type,
    }
