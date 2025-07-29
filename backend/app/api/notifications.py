from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Dict
from datetime import datetime, timedelta
import logging

from app.core.database import get_db
from app.core.auth import get_current_user, check_resource_limit, require_feature
from app.models.models import User, NotificationChannel, AlertSeverity
from app.services.notification_service import NotificationService
from pydantic import BaseModel, EmailStr

logger = logging.getLogger(__name__)
router = APIRouter()

class NotificationChannelCreate(BaseModel):
    channel_type: str  # email, sms, voice
    destination: str
    severity_threshold: AlertSeverity = AlertSeverity.MINOR
    categories: List[str] = []

class NotificationChannelUpdate(BaseModel):
    is_active: bool = None
    severity_threshold: AlertSeverity = None
    categories: List[str] = None
    is_primary: bool = None

class VerifyChannelRequest(BaseModel):
    code: str

@router.get("/channels")
async def get_notification_channels(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> List[Dict]:
    """Get user's notification channels"""
    channels = db.query(NotificationChannel).filter(
        NotificationChannel.user_id == current_user.id
    ).all()
    
    return [{
        "id": channel.id,
        "channel_type": channel.channel_type,
        "destination": channel.destination,
        "is_verified": channel.is_verified,
        "is_primary": channel.is_primary,
        "is_active": channel.is_active,
        "severity_threshold": channel.severity_threshold.value if channel.severity_threshold else None,
        "categories": channel.categories or [],
        "last_used": channel.last_used.isoformat() if channel.last_used else None
    } for channel in channels]

@router.post("/channels")
async def create_notification_channel(
    channel_data: NotificationChannelCreate,
    current_user: User = Depends(check_resource_limit("notification_channels")),
    db: Session = Depends(get_db)
) -> Dict:
    """Create a new notification channel"""
    # Validate channel type based on subscription
    if channel_data.channel_type == "sms":
        user = await require_feature("sms_enabled")(current_user)
    elif channel_data.channel_type == "voice":
        user = await require_feature("voice_enabled")(current_user)
    
    # Check if channel already exists
    existing = db.query(NotificationChannel).filter(
        NotificationChannel.user_id == current_user.id,
        NotificationChannel.channel_type == channel_data.channel_type,
        NotificationChannel.destination == channel_data.destination
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=400,
            detail="This notification channel already exists"
        )
    
    # Create channel
    channel = NotificationChannel(
        user_id=current_user.id,
        channel_type=channel_data.channel_type,
        destination=channel_data.destination,
        severity_threshold=channel_data.severity_threshold,
        categories=channel_data.categories,
        is_verified=False,
        is_active=False  # Inactive until verified
    )
    
    # Email channels using user's email are auto-verified
    if channel_data.channel_type == "email" and channel_data.destination == current_user.email:
        channel.is_verified = True
        channel.is_active = True
        channel.verified_at = datetime.utcnow()
    
    db.add(channel)
    db.commit()
    
    # Send verification if needed
    if not channel.is_verified:
        notification_service = NotificationService()
        await notification_service.verify_channel(db, current_user, channel)
    
    return {
        "id": channel.id,
        "channel_type": channel.channel_type,
        "destination": channel.destination,
        "is_verified": channel.is_verified,
        "verification_sent": not channel.is_verified
    }

@router.put("/channels/{channel_id}")
async def update_notification_channel(
    channel_id: str,
    update_data: NotificationChannelUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Dict:
    """Update notification channel settings"""
    channel = db.query(NotificationChannel).filter(
        NotificationChannel.id == channel_id,
        NotificationChannel.user_id == current_user.id
    ).first()
    
    if not channel:
        raise HTTPException(status_code=404, detail="Channel not found")
    
    if not channel.is_verified:
        raise HTTPException(
            status_code=400,
            detail="Channel must be verified before updating"
        )
    
    # Update fields
    if update_data.is_active is not None:
        channel.is_active = update_data.is_active
    if update_data.severity_threshold is not None:
        channel.severity_threshold = update_data.severity_threshold
    if update_data.categories is not None:
        channel.categories = update_data.categories
    if update_data.is_primary is not None:
        # Only one primary channel per type
        if update_data.is_primary:
            db.query(NotificationChannel).filter(
                NotificationChannel.user_id == current_user.id,
                NotificationChannel.channel_type == channel.channel_type,
                NotificationChannel.id != channel_id
            ).update({"is_primary": False})
        channel.is_primary = update_data.is_primary
    
    db.commit()
    
    return {"status": "success", "message": "Channel updated"}

@router.post("/channels/{channel_id}/verify")
async def verify_notification_channel(
    channel_id: str,
    verify_data: VerifyChannelRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Dict:
    """Verify a notification channel with code"""
    channel = db.query(NotificationChannel).filter(
        NotificationChannel.id == channel_id,
        NotificationChannel.user_id == current_user.id
    ).first()
    
    if not channel:
        raise HTTPException(status_code=404, detail="Channel not found")
    
    if channel.is_verified:
        return {"status": "already_verified"}
    
    # Check verification code
    if not channel.verification_code:
        raise HTTPException(
            status_code=400,
            detail="No verification code sent"
        )
    
    # Check expiry (10 minutes)
    if channel.verification_sent_at + timedelta(minutes=10) < datetime.utcnow():
        raise HTTPException(
            status_code=400,
            detail="Verification code expired"
        )
    
    if channel.verification_code != verify_data.code:
        raise HTTPException(
            status_code=400,
            detail="Invalid verification code"
        )
    
    # Mark as verified
    channel.is_verified = True
    channel.is_active = True
    channel.verified_at = datetime.utcnow()
    channel.verification_code = None
    db.commit()
    
    return {"status": "success", "message": "Channel verified successfully"}

@router.post("/channels/{channel_id}/resend-verification")
async def resend_verification(
    channel_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Dict:
    """Resend verification code"""
    channel = db.query(NotificationChannel).filter(
        NotificationChannel.id == channel_id,
        NotificationChannel.user_id == current_user.id
    ).first()
    
    if not channel:
        raise HTTPException(status_code=404, detail="Channel not found")
    
    if channel.is_verified:
        raise HTTPException(
            status_code=400,
            detail="Channel already verified"
        )
    
    # Rate limit: 1 resend per minute
    if channel.verification_sent_at and \
       channel.verification_sent_at + timedelta(minutes=1) > datetime.utcnow():
        raise HTTPException(
            status_code=429,
            detail="Please wait 1 minute before resending"
        )
    
    # Send new verification
    notification_service = NotificationService()
    success = await notification_service.verify_channel(db, current_user, channel)
    
    if not success:
        raise HTTPException(
            status_code=500,
            detail="Failed to send verification"
        )
    
    return {"status": "success", "message": "Verification code sent"}

@router.delete("/channels/{channel_id}")
async def delete_notification_channel(
    channel_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Dict:
    """Delete a notification channel"""
    channel = db.query(NotificationChannel).filter(
        NotificationChannel.id == channel_id,
        NotificationChannel.user_id == current_user.id
    ).first()
    
    if not channel:
        raise HTTPException(status_code=404, detail="Channel not found")
    
    db.delete(channel)
    db.commit()
    
    return {"status": "success", "message": "Channel deleted"}

@router.get("/test")
async def send_test_notification(
    channel_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Dict:
    """Send a test notification to verify channel is working"""
    channel = db.query(NotificationChannel).filter(
        NotificationChannel.id == channel_id,
        NotificationChannel.user_id == current_user.id
    ).first()
    
    if not channel:
        raise HTTPException(status_code=404, detail="Channel not found")
    
    if not channel.is_verified:
        raise HTTPException(
            status_code=400,
            detail="Channel must be verified first"
        )
    
    # Create a test alert
    from app.models.models import Alert, AlertCategory
    test_alert = Alert(
        id="test",
        title="Test Emergency Alert",
        description="This is a test alert to verify your notification settings are working correctly.",
        severity=AlertSeverity.MODERATE,
        category=AlertCategory.OTHER,
        location_name="Hawaii",
        effective_time=datetime.utcnow(),
        source="Hawaii Emergency Network Hub"
    )
    
    # Send notification
    notification_service = NotificationService()
    
    try:
        if channel.channel_type == "email":
            await notification_service._send_email_notification(db, current_user, test_alert, channel)
        elif channel.channel_type == "sms":
            await notification_service._send_sms_notification(db, current_user, test_alert, channel)
        else:
            raise HTTPException(
                status_code=400,
                detail="Test notifications not available for voice channels"
            )
        
        return {"status": "success", "message": f"Test {channel.channel_type} sent to {channel.destination}"}
        
    except Exception as e:
        logger.error(f"Test notification failed: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to send test notification: {str(e)}"
        )