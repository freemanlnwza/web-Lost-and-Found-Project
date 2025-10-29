from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session
from datetime import datetime
from database import get_db
from models import Report, User, Item, Session as SessionModel
from crud import get_current_user
import schemas

router = APIRouter(prefix="/api", tags=["report"])


# ============================
# ✅ สร้างรายงาน (Report)
# ============================
@router.post("/report")
def create_report(report: schemas.ReportCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):

    # หา item ที่จะรายงาน
    item = db.query(Item).filter(Item.id == report.item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="ไม่พบ item ที่รายงาน")

    # เจ้าของ item คือผู้ที่ถูกรายงาน
    reported_user_id = item.user_id

    # ป้องกันรายงานตัวเอง
    if reported_user_id == current_user.id:
        raise HTTPException(status_code=400, detail="ไม่สามารถรายงานตัวเองได้")

    # ตรวจสอบรายงานซ้ำ
    existing_report = (
        db.query(Report)
        .filter(
            Report.reporter_id == current_user.id,
            Report.reported_user_id == reported_user_id,
            Report.item_id == report.item_id,
            Report.type == report.type,
        )
        .first()
    )
    if existing_report:
        raise HTTPException(status_code=400, detail="คุณได้รายงานเนื้อหานี้ไปแล้ว")

    # สร้าง report ใหม่
    new_report = Report(
        reporter_id=current_user.id,
        reported_user_id=reported_user_id,
        item_id=report.item_id,
        type=report.type,
        comment=report.comment or "",
    )

    db.add(new_report)
    db.commit()
    db.refresh(new_report)

    return {
        "message": "รายงานสำเร็จ",
        "report_id": new_report.id,
        "reported_user": item.user.username,
        "type": report.type,
    }
