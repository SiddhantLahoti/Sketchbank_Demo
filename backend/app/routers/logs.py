# backend/app/routers/logs.py
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc, func
from typing import Optional
from datetime import datetime, timezone, time

from ..database.database import get_db
from ..database import models

router = APIRouter(prefix="/api/logs", tags=["Tab 7: Audit Logs"])

@router.get("")
def get_audit_logs(
    q: Optional[str] = Query(None, description="Search across style number, details, or username"),
    action: Optional[str] = Query(None, description="Filter by discrete action type"),
    username: Optional[str] = Query(None, description="Filter by user"),
    start_date: Optional[str] = Query(None, description="Format YYYY-MM-DD"),
    end_date: Optional[str] = Query(None, description="Format YYYY-MM-DD"),
    page: int = Query(1, ge=1),
    limit: int = Query(25, ge=1, le=100),
    db: Session = Depends(get_db),
):
    query = db.query(models.AuditLog)

    # 1. Free-text search
    if q and q.strip():
        term = f"%{q.strip()}%"
        query = query.filter(
            or_(
                models.AuditLog.style_number.ilike(term),
                models.AuditLog.details.ilike(term),
                models.AuditLog.username.ilike(term),
            )
        )

    # 2. Strict filters
    if action and action.strip():
        query = query.filter(models.AuditLog.action == action.strip())

    if username and username.strip():
        query = query.filter(models.AuditLog.username == username.strip())

    # 3. Date range filter
    if start_date:
        try:
            start_dt = datetime.combine(datetime.fromisoformat(start_date).date(), time.min).replace(tzinfo=timezone.utc)
            query = query.filter(models.AuditLog.created_at >= start_dt)
        except ValueError:
            pass

    if end_date:
        try:
            end_dt = datetime.combine(datetime.fromisoformat(end_date).date(), time.max).replace(tzinfo=timezone.utc)
            query = query.filter(models.AuditLog.created_at <= end_dt)
        except ValueError:
            pass

    # Pagination & Sorting
    total_count = query.count()
    records = (
        query.order_by(desc(models.AuditLog.created_at))
        .offset((page - 1) * limit)
        .limit(limit)
        .all()
    )

    # Fetch distinct actions and users for filter pills
    available_actions = [
        a[0] for a in db.query(models.AuditLog.action).distinct().all() if a[0]
    ]
    available_users = [
        u[0] for u in db.query(models.AuditLog.username).distinct().all() if u[0]
    ]

    return {
        "total": total_count,
        "page": page,
        "limit": limit,
        "available_actions": available_actions,
        "available_users": available_users,
        "logs": [
            {
                "id": log.id,
                "user_id": log.user_id,
                "username": log.username or "system",
                "action": log.action,
                "style_number": log.style_number or "-",
                "details": log.details or "",
                "created_at": log.created_at.isoformat() if log.created_at else None,
            }
            for log in records
        ],
    }