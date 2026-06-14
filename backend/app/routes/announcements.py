# backend/app/routes/announcements.py
import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from ..models import Announcement, AuditLog, User
from ..schemas import AnnouncementCreate, AnnouncementResponse
from ..auth import get_current_active_user, require_hr_or_admin

router = APIRouter(prefix="/api/announcements", tags=["Announcements System"])

@router.get("", response_model=List[AnnouncementResponse])
def list_announcements(db: Session = Depends(get_db)):
    return db.query(Announcement).order_by(Announcement.created_at.desc()).all()

@router.post("", response_model=AnnouncementResponse)
def create_announcement(ann: AnnouncementCreate, current_user: User = Depends(require_hr_or_admin), db: Session = Depends(get_db)):
    new_ann = Announcement(
        title=ann.title,
        content=ann.content,
        type=ann.type,
        metadata_json=ann.metadata_json,
        created_at=datetime.datetime.utcnow()
    )
    db.add(new_ann)
    db.commit()
    db.refresh(new_ann)
    
    # Log audit action
    log = AuditLog(
        action="Announcement Created",
        user_id=current_user.id,
        details=f"Created announcement: '{ann.title}' ({ann.type})"
    )
    db.add(log)
    db.commit()
    
    return new_ann
