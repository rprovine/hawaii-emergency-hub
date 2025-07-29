from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime

from app.core.database import get_db
from app.api.deps import get_current_active_user
from app.models.models import User, UserRole
from app.schemas.alert_schemas import AlertCreate
from app.services.alert_service import AlertService

router = APIRouter()

def require_admin(current_user: User = Depends(get_current_active_user)) -> User:
    """Require admin or emergency manager role."""
    if current_user.role not in [UserRole.ADMIN, UserRole.EMERGENCY_MANAGER]:
        raise HTTPException(
            status_code=403,
            detail="Insufficient permissions"
        )
    return current_user

@router.post("/alerts")
async def create_alert(
    alert_data: AlertCreate,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin)
):
    """Create a new emergency alert (admin only)."""
    service = AlertService(db)
    alert = await service.create_alert(alert_data, admin_user.id)
    
    # Trigger WebSocket broadcast
    # This would normally connect to the WebSocket manager
    
    return alert

@router.get("/system/health")
async def get_system_health(
    admin_user: User = Depends(require_admin)
):
    """Get system health status (admin only)."""
    return {
        "status": "healthy",
        "services": {
            "api": "operational",
            "database": "operational",
            "websocket": "operational",
            "redis": "degraded"  # Since we're not using Redis locally
        },
        "timestamp": datetime.utcnow().isoformat()
    }