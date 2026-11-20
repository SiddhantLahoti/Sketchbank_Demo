# backend/app/routers/reports.py
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from typing import Optional
from datetime import datetime, timezone, timedelta, time

from ..database.database import get_db
from ..database import models

router = APIRouter(prefix="/api/reports", tags=["Tab 6: Productivity Reports"])

@router.get("/productivity")
def get_productivity_report(
    time_range: Optional[str] = Query("this_month", description="today | this_week | this_month | all_time"),
    start_date: Optional[str] = Query(None, description="Custom start YYYY-MM-DD"),
    end_date: Optional[str] = Query(None, description="Custom end YYYY-MM-DD"),
    db: Session = Depends(get_db),
):
    now = datetime.now(timezone.utc)
    start_dt = None
    end_dt = now

    # Determine date boundaries
    if start_date and end_date:
        try:
            start_dt = datetime.combine(datetime.fromisoformat(start_date).date(), time.min).replace(tzinfo=timezone.utc)
            end_dt = datetime.combine(datetime.fromisoformat(end_date).date(), time.max).replace(tzinfo=timezone.utc)
        except ValueError:
            pass
    elif time_range == "today":
        start_dt = datetime.combine(now.date(), time.min).replace(tzinfo=timezone.utc)
    elif time_range == "this_week":
        start_dt = datetime.combine((now - timedelta(days=now.weekday())).date(), time.min).replace(tzinfo=timezone.utc)
    elif time_range == "this_month":
        start_dt = datetime(now.year, now.month, 1, tzinfo=timezone.utc)
    elif time_range == "all_time":
        start_dt = None

    # Base query for created products in the timeframe
    base_prod = db.query(models.ProductMetadata)
    base_audit = db.query(models.AuditLog)

    if start_dt:
        base_prod = base_prod.filter(models.ProductMetadata.created_at >= start_dt)
        base_audit = base_audit.filter(models.AuditLog.created_at >= start_dt)
    if end_dt:
        base_prod = base_prod.filter(models.ProductMetadata.created_at <= end_dt)
        base_audit = base_audit.filter(models.AuditLog.created_at <= end_dt)

    # 1. High-Level KPI Stat Cards
    total_tagged = base_prod.count()
    pending_queue_count = db.query(models.CroppedProduct).filter(models.CroppedProduct.status == "PENDING").count()
    total_edits = base_audit.filter(models.AuditLog.action == "UPDATE_METADATA").count()

    top_designer_row = (
        base_prod.with_entities(models.ProductMetadata.creative_designer, func.count(models.ProductMetadata.id))
        .filter(models.ProductMetadata.creative_designer.isnot(None))
        .group_by(models.ProductMetadata.creative_designer)
        .order_by(desc(func.count(models.ProductMetadata.id)))
        .first()
    )
    top_designer = top_designer_row[0] if top_designer_row else "N/A"

    # 2. Designer Output Breakdown (Leaderboard)
    designer_rows = (
        base_prod.with_entities(
            models.ProductMetadata.creative_designer,
            func.count(models.ProductMetadata.id).label("count"),
        )
        .filter(models.ProductMetadata.creative_designer.isnot(None))
        .group_by(models.ProductMetadata.creative_designer)
        .order_by(desc("count"))
        .all()
    )
    designer_leaderboard = [
        {"designer": row[0], "count": row[1], "share_pct": round((row[1] / total_tagged * 100), 1) if total_tagged > 0 else 0}
        for row in designer_rows
    ]

    # 3. Category Distribution
    category_rows = (
        base_prod.with_entities(
            models.ProductMetadata.main_category,
            func.count(models.ProductMetadata.id).label("count"),
        )
        .filter(models.ProductMetadata.main_category.isnot(None))
        .group_by(models.ProductMetadata.main_category)
        .order_by(desc("count"))
        .all()
    )
    category_breakdown = [
        {"category": row[0], "count": row[1], "share_pct": round((row[1] / total_tagged * 100), 1) if total_tagged > 0 else 0}
        for row in category_rows
    ]

    # 4. Customer Breakdown
    customer_rows = (
        base_prod.with_entities(
            models.ProductMetadata.customer_name,
            func.count(models.ProductMetadata.id).label("count"),
        )
        .filter(models.ProductMetadata.customer_name.isnot(None))
        .group_by(models.ProductMetadata.customer_name)
        .order_by(desc("count"))
        .all()
    )
    customer_breakdown = [
        {"customer": row[0], "count": row[1]}
        for row in customer_rows
    ]

    # 5. Production Output Timeline (Aggregated by Day)
    timeline_rows = (
        base_prod.with_entities(
            func.date(models.ProductMetadata.created_at).label("day"),
            func.count(models.ProductMetadata.id).label("count"),
        )
        .group_by(func.date(models.ProductMetadata.created_at))
        .order_by("day")
        .all()
    )
    production_timeline = [
        {"date": str(row[0]), "count": row[1]}
        for row in timeline_rows
    ]

    return {
        "time_range": time_range,
        "kpis": {
            "total_tagged": total_tagged,
            "pending_queue": pending_queue_count,
            "total_edits": total_edits,
            "top_designer": top_designer,
        },
        "designer_leaderboard": designer_leaderboard,
        "category_breakdown": category_breakdown,
        "customer_breakdown": customer_breakdown,
        "production_timeline": production_timeline,
    }