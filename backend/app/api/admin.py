from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime

from app.core.database import get_db
from app.api.deps import get_current_active_user
from app.models.models import User, UserRole, Alert
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

@router.post("/sync/trigger")
async def trigger_sync(
    request: Request,
    admin_user: User = Depends(require_admin)
):
    """Manually trigger sync of all external data sources."""
    try:
        # Get the alert processor from app state
        alert_processor = request.app.state.alert_processor
        
        # Trigger sync
        await alert_processor.force_sync()
        
        return {
            "status": "success",
            "message": "Sync triggered successfully",
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to trigger sync: {str(e)}"
        )

@router.get("/sync/status")
async def get_sync_status(
    request: Request,
    admin_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Get the status of data sync from external sources."""
    try:
        # Get counts by source
        nws_count = db.query(Alert).filter(
            Alert.source == "National Weather Service",
            Alert.is_active == True
        ).count()
        
        usgs_count = db.query(Alert).filter(
            Alert.source == "USGS Earthquake Hazards Program", 
            Alert.is_active == True
        ).count()
        
        volcano_count = db.query(Alert).filter(
            Alert.source == "USGS Hawaiian Volcano Observatory",
            Alert.is_active == True
        ).count()
        
        # Get last sync times
        latest_alert = db.query(Alert).order_by(Alert.created_at.desc()).first()
        
        return {
            "status": "operational",
            "sources": {
                "nws": {
                    "name": "National Weather Service",
                    "active_alerts": nws_count,
                    "status": "active"
                },
                "usgs_earthquake": {
                    "name": "USGS Earthquake",
                    "active_alerts": usgs_count,
                    "status": "active"
                },
                "volcano": {
                    "name": "Hawaii Volcano Observatory",
                    "active_alerts": volcano_count,
                    "status": "active"
                }
            },
            "last_sync": latest_alert.created_at.isoformat() if latest_alert else None,
            "sync_interval_minutes": 5
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get sync status: {str(e)}"
        )