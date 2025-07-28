from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional
from datetime import datetime, timedelta
from sqlalchemy.orm import Session

from app.models.models import Alert, AlertSeverity, AlertCategory
from app.schemas.alert_schemas import (
    AlertResponse, AlertCreate, AlertUpdate, AlertListResponse,
    AlertFilter, LocationFilter
)
from app.core.database import get_db
from app.services.alert_service import AlertService
from app.api.deps import get_current_user

router = APIRouter()

@router.get("/", response_model=AlertListResponse)
async def get_alerts(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    severity: Optional[AlertSeverity] = None,
    category: Optional[AlertCategory] = None,
    county: Optional[str] = None,
    active_only: bool = True,
    latitude: Optional[float] = None,
    longitude: Optional[float] = None,
    radius_miles: Optional[float] = None,
    db: Session = Depends(get_db)
):
    """
    Get list of emergency alerts with optional filtering.
    
    - **skip**: Number of alerts to skip (pagination)
    - **limit**: Maximum number of alerts to return
    - **severity**: Filter by severity level
    - **category**: Filter by alert category
    - **county**: Filter by Hawaii county name
    - **active_only**: Only show currently active alerts
    - **latitude/longitude/radius_miles**: Filter by location
    """
    service = AlertService(db)
    
    filters = AlertFilter(
        severity=severity,
        category=category,
        county=county,
        active_only=active_only
    )
    
    if latitude and longitude:
        filters.location = LocationFilter(
            latitude=latitude,
            longitude=longitude,
            radius_miles=radius_miles or 25.0
        )
    
    alerts, total = await service.get_alerts(
        filters=filters,
        skip=skip,
        limit=limit
    )
    
    return AlertListResponse(
        alerts=alerts,
        total=total,
        skip=skip,
        limit=limit
    )

@router.get("/{alert_id}", response_model=AlertResponse)
async def get_alert(
    alert_id: str,
    db: Session = Depends(get_db)
):
    """Get detailed information about a specific alert."""
    service = AlertService(db)
    alert = await service.get_alert_by_id(alert_id)
    
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    
    return alert

@router.get("/nearby/me", response_model=AlertListResponse)
async def get_nearby_alerts(
    latitude: float = Query(..., ge=-90, le=90),
    longitude: float = Query(..., ge=-180, le=180),
    radius_miles: float = Query(25.0, ge=1, le=100),
    severity_threshold: Optional[AlertSeverity] = None,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get alerts near a specific location."""
    service = AlertService(db)
    
    # Use user's severity threshold if not specified
    if not severity_threshold and current_user:
        severity_threshold = current_user.severity_threshold
    
    alerts, total = await service.get_nearby_alerts(
        latitude=latitude,
        longitude=longitude,
        radius_miles=radius_miles,
        severity_threshold=severity_threshold
    )
    
    return AlertListResponse(
        alerts=alerts,
        total=total,
        skip=0,
        limit=len(alerts)
    )

@router.get("/counties/{county_name}", response_model=AlertListResponse)
async def get_county_alerts(
    county_name: str,
    active_only: bool = True,
    db: Session = Depends(get_db)
):
    """Get all alerts for a specific Hawaii county."""
    valid_counties = [
        "Hawaii County", "Maui County", "Honolulu County",
        "Kauai County", "Kalawao County"
    ]
    
    if county_name not in valid_counties:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid county. Must be one of: {', '.join(valid_counties)}"
        )
    
    service = AlertService(db)
    alerts, total = await service.get_county_alerts(
        county_name=county_name,
        active_only=active_only
    )
    
    return AlertListResponse(
        alerts=alerts,
        total=total,
        skip=0,
        limit=len(alerts)
    )

@router.post("/{alert_id}/view")
async def mark_alert_viewed(
    alert_id: str,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Mark an alert as viewed by the current user."""
    service = AlertService(db)
    await service.mark_alert_viewed(
        alert_id=alert_id,
        user_id=current_user.id
    )
    
    return {"message": "Alert marked as viewed"}

@router.post("/{alert_id}/dismiss")
async def dismiss_alert(
    alert_id: str,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Dismiss an alert for the current user."""
    service = AlertService(db)
    await service.dismiss_alert(
        alert_id=alert_id,
        user_id=current_user.id
    )
    
    return {"message": "Alert dismissed"}

@router.post("/{alert_id}/share")
async def share_alert(
    alert_id: str,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Generate a shareable link for an alert."""
    service = AlertService(db)
    share_data = await service.generate_share_link(
        alert_id=alert_id,
        user_id=current_user.id
    )
    
    return share_data

@router.get("/stats/summary")
async def get_alert_stats(
    timeframe_hours: int = Query(24, ge=1, le=168),
    db: Session = Depends(get_db)
):
    """Get statistical summary of recent alerts."""
    service = AlertService(db)
    
    since = datetime.utcnow() - timedelta(hours=timeframe_hours)
    stats = await service.get_alert_statistics(since=since)
    
    return stats