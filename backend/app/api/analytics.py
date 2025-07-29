from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import datetime, timedelta

from app.core.database import get_db
from app.services.analytics_service import AnalyticsService

router = APIRouter()

@router.get("/dashboard")
async def get_dashboard_metrics(
    db: Session = Depends(get_db)
):
    """Get real-time dashboard metrics."""
    service = AnalyticsService(db)
    
    return {
        "active_alerts": service.get_active_alert_count(),
        "total_users": service.get_total_user_count(),
        "alerts_last_24h": service.get_alerts_last_24h(),
        "response_metrics": service.get_response_metrics(),
        "alerts_by_severity": service.get_alerts_by_severity(),
        "alerts_by_county": service.get_alerts_by_county(),
        "timestamp": datetime.utcnow().isoformat()
    }

@router.get("/trends")
async def get_alert_trends(
    days: int = 7,
    db: Session = Depends(get_db)
):
    """Get alert trends over time."""
    service = AnalyticsService(db)
    return service.get_alert_trends(days)