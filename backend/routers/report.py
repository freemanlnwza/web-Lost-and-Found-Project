from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import models, crud
from database import get_db
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

router = APIRouter(prefix="/reports", tags=["Reports"])
security = HTTPBearer()

# ---------------- User submit report ----------------
@router.post("/")
def submit_report(item_id: int, reason: str, description: str = "", credentials: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(get_db)):
    user = crud.get_current_user(credentials, db)
    report = models.Report(item_id=item_id, reporter_id=user.id, reason=reason, description=description)
    db.add(report)
    db.commit()
    db.refresh(report)
    return {"message": "Report submitted", "report_id": report.id}

# ---------------- Admin view all reports ----------------
@router.get("/")
def get_reports(credentials: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(get_db)):
    admin = crud.get_admin_user(credentials, db)
    reports = db.query(models.Report).order_by(models.Report.created_at.desc()).all()
    result = []
    for r in reports:
        item = db.query(models.Item).filter(models.Item.id == r.item_id).first()
        reporter = db.query(models.User).filter(models.User.id == r.reporter_id).first()
        result.append({
            "id": r.id,
            "item_id": r.item_id,
            "item_title": item.title if item else "Deleted",
            "reporter_username": reporter.username if reporter else "Unknown",
            "reason": r.reason,
            "description": r.description,
            "status": r.status,
            "created_at": r.created_at
        })
    return result

# ---------------- Admin update report status ----------------
@router.patch("/{report_id}")
def update_report_status(report_id: int, status: str, credentials: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(get_db)):
    admin = crud.get_admin_user(credentials, db)
    report = db.query(models.Report).filter(models.Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    if status not in ["pending", "reviewed", "dismissed"]:
        raise HTTPException(status_code=400, detail="Invalid status")
    report.status = status
    db.commit()
    return {"message": "Report status updated"}
