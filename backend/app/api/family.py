from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from app.core.database import get_db
from app.core.auth import get_current_user, require_subscription_tier
from app.models.models import User, SubscriptionTier
from app.services.family_service import FamilyService

router = APIRouter()

@router.post("/groups")
async def create_family_group(
    name: str = Query(..., description="Family group name"),
    current_user: User = Depends(require_subscription_tier([
        SubscriptionTier.PREMIUM,
        SubscriptionTier.BUSINESS,
        SubscriptionTier.ENTERPRISE
    ])),
    db: Session = Depends(get_db)
):
    """Create a new family group"""
    try:
        family_group = FamilyService.create_family_group(db, current_user, name)
        return {
            "id": family_group.id,
            "name": family_group.name,
            "created_at": family_group.created_at.isoformat()
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/groups")
async def get_family_groups(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all family groups user belongs to"""
    from app.models.models import FamilyGroup, FamilyMember
    
    # Get groups where user is owner
    owned_groups = db.query(FamilyGroup).filter(
        FamilyGroup.owner_id == current_user.id
    ).all()
    
    # Get groups where user is member
    memberships = db.query(FamilyMember).filter(
        FamilyMember.user_id == current_user.id
    ).all()
    
    groups = []
    for group in owned_groups:
        groups.append({
            "id": group.id,
            "name": group.name,
            "role": "owner",
            "created_at": group.created_at.isoformat()
        })
    
    for membership in memberships:
        if membership.family_group_id not in [g["id"] for g in groups]:
            group = membership.family_group
            groups.append({
                "id": group.id,
                "name": group.name,
                "role": membership.role,
                "joined_at": membership.joined_at.isoformat() if membership.joined_at else None
            })
    
    return {"groups": groups}

@router.post("/groups/{group_id}/invite")
async def invite_family_member(
    group_id: str,
    email: str = Query(..., description="Email of person to invite"),
    name: str = Query(..., description="Name of person"),
    phone: Optional[str] = Query(None, description="Phone number"),
    emergency_contact: bool = Query(False, description="Is emergency contact"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Invite someone to family group"""
    try:
        member = FamilyService.invite_family_member(
            db, group_id, current_user, email, name, phone, emergency_contact
        )
        return {
            "id": member.id,
            "email": member.email,
            "name": member.name,
            "status": member.status
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/groups/{group_id}/status")
async def get_family_status(
    group_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get current status of all family members"""
    try:
        status = FamilyService.get_family_status(db, group_id, current_user)
        return status
    except ValueError as e:
        raise HTTPException(status_code=403, detail=str(e))

@router.post("/members/{member_id}/location")
async def update_location(
    member_id: str,
    lat: float = Query(..., description="Latitude"),
    lng: float = Query(..., description="Longitude"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update family member location"""
    from app.models.models import FamilyMember
    
    # Verify user owns this member record
    member = db.query(FamilyMember).filter(
        FamilyMember.id == member_id,
        FamilyMember.user_id == current_user.id
    ).first()
    
    if not member:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    try:
        updated = FamilyService.update_member_location(db, member_id, lat, lng)
        return {
            "status": "success",
            "location": {
                "lat": updated.last_location_lat,
                "lng": updated.last_location_lng,
                "updated_at": updated.last_location_update.isoformat()
            }
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/members/{member_id}/check-in")
async def create_check_in(
    member_id: str,
    status: str = Query(..., description="Check-in status (safe, needs_help)"),
    message: Optional[str] = Query(None, description="Optional message"),
    lat: Optional[float] = Query(None, description="Current latitude"),
    lng: Optional[float] = Query(None, description="Current longitude"),
    alert_id: Optional[str] = Query(None, description="Related alert ID"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Submit a safety check-in"""
    from app.models.models import FamilyMember
    
    # Verify user owns this member record
    member = db.query(FamilyMember).filter(
        FamilyMember.id == member_id,
        FamilyMember.user_id == current_user.id
    ).first()
    
    if not member:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    location = None
    if lat is not None and lng is not None:
        location = {"lat": lat, "lng": lng}
    
    try:
        check_in = FamilyService.create_check_in(
            db, member_id, status, message, location, alert_id
        )
        return {
            "id": check_in.id,
            "status": check_in.status,
            "message": check_in.message,
            "created_at": check_in.created_at.isoformat()
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/groups/{group_id}/request-checkins")
async def request_check_ins(
    group_id: str,
    alert_id: Optional[str] = Query(None, description="Related alert ID"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Request check-ins from all family members"""
    from app.models.models import Alert
    
    alert = None
    if alert_id:
        alert = db.query(Alert).filter_by(id=alert_id).first()
    
    try:
        sent_count = FamilyService.request_check_ins(
            db, group_id, current_user, alert
        )
        return {
            "status": "success",
            "notifications_sent": sent_count
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/groups/{group_id}/check-ins")
async def get_recent_check_ins(
    group_id: str,
    hours: int = Query(24, description="Hours to look back"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get recent check-ins for family group"""
    from app.models.models import FamilyMember, FamilyCheckIn
    from datetime import datetime, timedelta, timezone
    
    # Verify user has access
    member = db.query(FamilyMember).filter(
        FamilyMember.family_group_id == group_id,
        FamilyMember.user_id == current_user.id
    ).first()
    
    if not member:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Get check-ins from last N hours
    since = datetime.now(timezone.utc) - timedelta(hours=hours)
    check_ins = db.query(FamilyCheckIn).filter(
        FamilyCheckIn.family_group_id == group_id,
        FamilyCheckIn.created_at >= since
    ).order_by(FamilyCheckIn.created_at.desc()).all()
    
    return {
        "check_ins": [
            {
                "id": ci.id,
                "member_id": ci.member_id,
                "member_name": ci.member.name,
                "status": ci.status,
                "message": ci.message,
                "location": {
                    "lat": ci.location_lat,
                    "lng": ci.location_lng
                } if ci.location_lat else None,
                "created_at": ci.created_at.isoformat()
            }
            for ci in check_ins
        ]
    }

@router.put("/members/{member_id}/location-sharing")
async def toggle_location_sharing(
    member_id: str,
    enabled: bool = Query(..., description="Enable or disable location sharing"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Enable or disable location sharing for a family member"""
    from app.models.models import FamilyMember
    
    # Verify user owns this member record
    member = db.query(FamilyMember).filter(
        FamilyMember.id == member_id,
        FamilyMember.user_id == current_user.id
    ).first()
    
    if not member:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    member.location_sharing_enabled = enabled
    db.commit()
    
    return {
        "status": "success",
        "location_sharing_enabled": enabled
    }