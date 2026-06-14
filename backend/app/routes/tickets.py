# backend/app/routes/tickets.py
import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from ..models import User, Ticket, AuditLog
from ..schemas import TicketCreate, TicketResolve, TicketResponse
from ..auth import get_current_active_user, require_hr_or_admin

router = APIRouter(prefix="/api/tickets", tags=["Ticket System"])

@router.post("", response_model=TicketResponse)
def create_ticket(ticket: TicketCreate, current_user: User = Depends(get_current_active_user), db: Session = Depends(get_db)):
    new_ticket = Ticket(
        employee_id=current_user.id,
        category=ticket.category,
        title=ticket.title,
        description=ticket.description,
        status="Open",
        created_at=datetime.datetime.utcnow(),
        updated_at=datetime.datetime.utcnow()
    )
    db.add(new_ticket)
    db.commit()
    db.refresh(new_ticket)
    
    # Audit Log
    log = AuditLog(
        action="Ticket Opened",
        user_id=current_user.id,
        details=f"Opened ticket ID {new_ticket.id} [{ticket.category}]: {ticket.title}"
    )
    db.add(log)
    db.commit()
    
    return new_ticket

@router.get("/my", response_model=List[TicketResponse])
def get_my_tickets(current_user: User = Depends(get_current_active_user), db: Session = Depends(get_db)):
    return db.query(Ticket).filter(Ticket.employee_id == current_user.id).order_by(Ticket.created_at.desc()).all()

@router.get("/all", response_model=List[TicketResponse])
def get_all_tickets(current_user: User = Depends(require_hr_or_admin), db: Session = Depends(get_db)):
    return db.query(Ticket).order_by(Ticket.status.asc(), Ticket.created_at.desc()).all()

@router.put("/{ticket_id}/resolve", response_model=TicketResponse)
def resolve_ticket(ticket_id: int, resolve_data: TicketResolve, current_user: User = Depends(require_hr_or_admin), db: Session = Depends(get_db)):
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
        
    ticket.response = resolve_data.response
    ticket.status = resolve_data.status
    ticket.updated_at = datetime.datetime.utcnow()
    db.commit()
    db.refresh(ticket)
    
    # Audit Log
    log = AuditLog(
        action="Ticket Resolved",
        user_id=current_user.id,
        details=f"Resolved ticket ID {ticket.id} with status {resolve_data.status}"
    )
    db.add(log)
    db.commit()
    
    return ticket
