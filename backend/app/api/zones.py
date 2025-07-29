from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Dict, Optional
from datetime import datetime
import logging

from app.core.database import get_db
from app.core.auth import get_current_user, check_resource_limit
from app.models.models import User, AlertZone, AlertSeverity, AlertCategory
from pydantic import BaseModel
from typing import List, Optional

logger = logging.getLogger(__name__)
router = APIRouter()

class AlertZoneCreate(BaseModel):
    name: str
    description: Optional[str] = None
    center_latitude: Optional[float] = None
    center_longitude: Optional[float] = None
    radius_miles: Optional[float] = None
    polygon: Optional[Dict] = None  # GeoJSON polygon
    severity_threshold: AlertSeverity = AlertSeverity.MINOR
    categories: List[str] = []

class AlertZoneUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    center_latitude: Optional[float] = None
    center_longitude: Optional[float] = None
    radius_miles: Optional[float] = None
    polygon: Optional[Dict] = None
    is_active: Optional[bool] = None
    severity_threshold: Optional[AlertSeverity] = None
    categories: Optional[List[str]] = None

@router.get("/")
async def get_alert_zones(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> List[Dict]:
    """Get user's custom alert zones"""
    zones = db.query(AlertZone).filter(
        AlertZone.user_id == current_user.id
    ).all()
    
    return [{
        "id": zone.id,
        "name": zone.name,
        "description": zone.description,
        "center": {
            "latitude": zone.center_latitude,
            "longitude": zone.center_longitude
        } if zone.center_latitude else None,
        "radius_miles": zone.radius_miles,
        "polygon": zone.polygon,
        "is_active": zone.is_active,
        "severity_threshold": zone.severity_threshold.value if zone.severity_threshold else None,
        "categories": zone.categories or [],
        "created_at": zone.created_at.isoformat() if zone.created_at else None,
        "updated_at": zone.updated_at.isoformat() if zone.updated_at else None
    } for zone in zones]

@router.post("/")
async def create_alert_zone(
    zone_data: AlertZoneCreate,
    current_user: User = Depends(check_resource_limit("alert_zones")),
    db: Session = Depends(get_db)
) -> Dict:
    """Create a custom alert zone"""
    # Validate either circle or polygon is provided
    if zone_data.polygon:
        # Validate GeoJSON polygon
        if not isinstance(zone_data.polygon, dict) or "type" not in zone_data.polygon:
            raise HTTPException(
                status_code=400,
                detail="Invalid GeoJSON polygon format"
            )
    elif zone_data.center_latitude is None or zone_data.center_longitude is None or zone_data.radius_miles is None:
        raise HTTPException(
            status_code=400,
            detail="Either provide a polygon or center coordinates with radius"
        )
    
    # Validate coordinates are within Hawaii bounds
    from app.core.config import settings
    bounds = settings.HAWAII_BOUNDS
    
    if zone_data.center_latitude:
        if not (bounds["south"] <= zone_data.center_latitude <= bounds["north"]):
            raise HTTPException(
                status_code=400,
                detail="Latitude must be within Hawaii bounds"
            )
        if not (bounds["west"] <= zone_data.center_longitude <= bounds["east"]):
            raise HTTPException(
                status_code=400,
                detail="Longitude must be within Hawaii bounds"
            )
    
    # Create zone
    zone = AlertZone(
        user_id=current_user.id,
        name=zone_data.name,
        description=zone_data.description,
        center_latitude=zone_data.center_latitude,
        center_longitude=zone_data.center_longitude,
        radius_miles=zone_data.radius_miles,
        polygon=zone_data.polygon,
        severity_threshold=zone_data.severity_threshold,
        categories=zone_data.categories,
        is_active=True
    )
    
    db.add(zone)
    db.commit()
    db.refresh(zone)
    
    return {
        "id": zone.id,
        "name": zone.name,
        "status": "created"
    }

@router.put("/{zone_id}")
async def update_alert_zone(
    zone_id: str,
    update_data: AlertZoneUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Dict:
    """Update an alert zone"""
    zone = db.query(AlertZone).filter(
        AlertZone.id == zone_id,
        AlertZone.user_id == current_user.id
    ).first()
    
    if not zone:
        raise HTTPException(status_code=404, detail="Zone not found")
    
    # Update fields
    if update_data.name is not None:
        zone.name = update_data.name
    if update_data.description is not None:
        zone.description = update_data.description
    if update_data.center_latitude is not None:
        zone.center_latitude = update_data.center_latitude
    if update_data.center_longitude is not None:
        zone.center_longitude = update_data.center_longitude
    if update_data.radius_miles is not None:
        zone.radius_miles = update_data.radius_miles
    if update_data.polygon is not None:
        zone.polygon = update_data.polygon
    if update_data.is_active is not None:
        zone.is_active = update_data.is_active
    if update_data.severity_threshold is not None:
        zone.severity_threshold = update_data.severity_threshold
    if update_data.categories is not None:
        zone.categories = update_data.categories
    
    zone.updated_at = datetime.utcnow()
    db.commit()
    
    return {"status": "success", "message": "Zone updated"}

@router.delete("/{zone_id}")
async def delete_alert_zone(
    zone_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Dict:
    """Delete an alert zone"""
    zone = db.query(AlertZone).filter(
        AlertZone.id == zone_id,
        AlertZone.user_id == current_user.id
    ).first()
    
    if not zone:
        raise HTTPException(status_code=404, detail="Zone not found")
    
    db.delete(zone)
    db.commit()
    
    return {"status": "success", "message": "Zone deleted"}

@router.get("/{zone_id}/test")
async def test_alert_zone(
    zone_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Dict:
    """Test which current alerts would match this zone"""
    zone = db.query(AlertZone).filter(
        AlertZone.id == zone_id,
        AlertZone.user_id == current_user.id
    ).first()
    
    if not zone:
        raise HTTPException(status_code=404, detail="Zone not found")
    
    # Get current active alerts
    from app.models.models import Alert
    from app.services.geo_service import GeoService
    
    active_alerts = db.query(Alert).filter(
        Alert.is_active == True
    ).all()
    
    matching_alerts = []
    geo_service = GeoService()
    
    for alert in active_alerts:
        # Check severity threshold
        severity_order = {
            AlertSeverity.MINOR: 1,
            AlertSeverity.MODERATE: 2,
            AlertSeverity.SEVERE: 3,
            AlertSeverity.EXTREME: 4
        }
        
        alert_level = severity_order.get(alert.severity, 1)
        zone_threshold = severity_order.get(zone.severity_threshold, 1)
        
        if alert_level < zone_threshold:
            continue
        
        # Check categories
        if zone.categories and alert.category.value not in zone.categories:
            continue
        
        # Check location
        if zone.polygon:
            # Check if alert overlaps with polygon
            if geo_service.alert_intersects_polygon(alert, zone.polygon):
                matching_alerts.append({
                    "id": alert.id,
                    "title": alert.title,
                    "severity": alert.severity.value,
                    "category": alert.category.value,
                    "location": alert.location_name
                })
        else:
            # Check if alert is within radius
            if geo_service.alert_within_radius(
                alert,
                zone.center_latitude,
                zone.center_longitude,
                zone.radius_miles
            ):
                matching_alerts.append({
                    "id": alert.id,
                    "title": alert.title,
                    "severity": alert.severity.value,
                    "category": alert.category.value,
                    "location": alert.location_name
                })
    
    return {
        "zone_id": zone_id,
        "zone_name": zone.name,
        "matching_alerts": len(matching_alerts),
        "alerts": matching_alerts
    }

@router.post("/import-saved-locations")
async def import_saved_locations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Dict:
    """Convert user's saved locations to alert zones"""
    if not current_user.saved_locations:
        raise HTTPException(
            status_code=400,
            detail="No saved locations found"
        )
    
    created_zones = []
    
    for location in current_user.saved_locations:
        # Check if we have room for more zones
        existing_zones = db.query(AlertZone).filter(
            AlertZone.user_id == current_user.id
        ).count()
        
        from app.services.subscription_service import SubscriptionService
        limits = SubscriptionService.get_user_limits(current_user)
        max_zones = limits.get("alert_zones", 1)
        
        if max_zones != -1 and existing_zones >= max_zones:
            break
        
        # Create zone from saved location
        zone = AlertZone(
            user_id=current_user.id,
            name=location.get("name", "Imported Location"),
            description=f"Imported from saved location",
            center_latitude=location.get("latitude"),
            center_longitude=location.get("longitude"),
            radius_miles=location.get("radius", 5.0),
            is_active=True
        )
        
        db.add(zone)
        created_zones.append(zone.name)
    
    db.commit()
    
    return {
        "status": "success",
        "imported": len(created_zones),
        "zones": created_zones
    }