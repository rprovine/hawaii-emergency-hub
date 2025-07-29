import logging
from typing import List, Optional, Dict
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_

from app.models.models import (
    User, FamilyGroup, FamilyMember, FamilyCheckIn, 
    Alert, SubscriptionTier
)
from app.services.notification_service import NotificationService
from app.services.subscription_service import SubscriptionService

logger = logging.getLogger(__name__)


class FamilyService:
    """Service for managing family safety features"""
    
    @staticmethod
    def create_family_group(
        db: Session,
        owner: User,
        name: str
    ) -> FamilyGroup:
        """Create a new family group"""
        # Check subscription limits
        subscription = owner.subscription
        if subscription:
            tier_limits = SubscriptionService.TIER_LIMITS.get(subscription.tier, {})
            max_members = tier_limits.get("max_family_members", 0)
            
            if max_members == 0:
                raise ValueError("Family features not available in your subscription tier")
        
        # Create family group
        family_group = FamilyGroup(
            name=name,
            owner_id=owner.id
        )
        db.add(family_group)
        
        # Add owner as first member
        owner_member = FamilyMember(
            family_group_id=family_group.id,
            user_id=owner.id,
            email=owner.email,
            name=owner.full_name or owner.email,
            role="owner",
            status="active",
            joined_at=datetime.now(timezone.utc)
        )
        db.add(owner_member)
        
        db.commit()
        db.refresh(family_group)
        
        logger.info(f"Created family group {family_group.id} for user {owner.id}")
        return family_group
    
    @staticmethod
    def invite_family_member(
        db: Session,
        family_group_id: str,
        inviting_user: User,
        email: str,
        name: str,
        phone: Optional[str] = None,
        emergency_contact: bool = False
    ) -> FamilyMember:
        """Invite a new family member"""
        # Verify user has permission
        family_group = db.query(FamilyGroup).filter_by(id=family_group_id).first()
        if not family_group:
            raise ValueError("Family group not found")
        
        # Check if user is owner or admin
        inviting_member = db.query(FamilyMember).filter(
            and_(
                FamilyMember.family_group_id == family_group_id,
                FamilyMember.user_id == inviting_user.id,
                FamilyMember.role.in_(["owner", "admin"])
            )
        ).first()
        
        if not inviting_member:
            raise ValueError("You don't have permission to invite members")
        
        # Check subscription limits
        current_members = db.query(FamilyMember).filter(
            and_(
                FamilyMember.family_group_id == family_group_id,
                FamilyMember.status == "active"
            )
        ).count()
        
        owner = db.query(User).filter_by(id=family_group.owner_id).first()
        tier_limits = SubscriptionService.TIER_LIMITS.get(owner.subscription.tier, {})
        max_members = tier_limits.get("max_family_members", 5)
        
        if current_members >= max_members:
            raise ValueError(f"Family group limit reached ({max_members} members)")
        
        # Check if already invited
        existing = db.query(FamilyMember).filter(
            and_(
                FamilyMember.family_group_id == family_group_id,
                FamilyMember.email == email
            )
        ).first()
        
        if existing:
            raise ValueError("This person is already in the family group")
        
        # Create member record
        member = FamilyMember(
            family_group_id=family_group_id,
            email=email,
            name=name,
            phone=phone,
            emergency_contact=emergency_contact,
            status="pending"
        )
        db.add(member)
        db.commit()
        db.refresh(member)
        
        # Send invitation email
        # TODO: Implement invitation email with join link
        
        logger.info(f"Invited {email} to family group {family_group_id}")
        return member
    
    @staticmethod
    def update_member_location(
        db: Session,
        member_id: str,
        lat: float,
        lng: float
    ) -> FamilyMember:
        """Update family member's location"""
        member = db.query(FamilyMember).filter_by(id=member_id).first()
        if not member:
            raise ValueError("Family member not found")
        
        if not member.location_sharing_enabled:
            raise ValueError("Location sharing is disabled")
        
        member.last_location_lat = lat
        member.last_location_lng = lng
        member.last_location_update = datetime.now(timezone.utc)
        
        db.commit()
        db.refresh(member)
        
        return member
    
    @staticmethod
    def create_check_in(
        db: Session,
        member_id: str,
        status: str,
        message: Optional[str] = None,
        location: Optional[Dict[str, float]] = None,
        alert_id: Optional[str] = None
    ) -> FamilyCheckIn:
        """Create a check-in from a family member"""
        member = db.query(FamilyMember).filter_by(id=member_id).first()
        if not member:
            raise ValueError("Family member not found")
        
        if status not in ["safe", "needs_help", "no_response"]:
            raise ValueError("Invalid check-in status")
        
        check_in = FamilyCheckIn(
            family_group_id=member.family_group_id,
            member_id=member_id,
            status=status,
            message=message,
            alert_id=alert_id
        )
        
        if location:
            check_in.location_lat = location.get("lat")
            check_in.location_lng = location.get("lng")
        
        db.add(check_in)
        
        # Update member location if provided
        if location and member.location_sharing_enabled:
            member.last_location_lat = location.get("lat")
            member.last_location_lng = location.get("lng")
            member.last_location_update = datetime.now(timezone.utc)
        
        db.commit()
        db.refresh(check_in)
        
        # Notify other family members if needs help
        if status == "needs_help":
            FamilyService._notify_emergency_contacts(db, member, check_in)
        
        logger.info(f"Created check-in for member {member_id} with status {status}")
        return check_in
    
    @staticmethod
    def request_check_ins(
        db: Session,
        family_group_id: str,
        requesting_user: User,
        alert: Optional[Alert] = None
    ) -> int:
        """Request check-ins from all family members"""
        # Verify user has permission
        member = db.query(FamilyMember).filter(
            and_(
                FamilyMember.family_group_id == family_group_id,
                FamilyMember.user_id == requesting_user.id
            )
        ).first()
        
        if not member:
            raise ValueError("You are not part of this family group")
        
        # Get all active members
        members = db.query(FamilyMember).filter(
            and_(
                FamilyMember.family_group_id == family_group_id,
                FamilyMember.status == "active"
            )
        ).all()
        
        notification_service = NotificationService()
        sent_count = 0
        
        for member in members:
            if member.user_id:
                user = db.query(User).filter_by(id=member.user_id).first()
                if user:
                    # Send check-in request notification
                    alert_info = f"Alert: {alert.title}" if alert else ""
                    message = f"Your family is requesting a safety check-in. {alert_info}"
                    
                    # Send through all available channels
                    if member.phone:
                        try:
                            notification_service.send_sms(
                                member.phone,
                                message + " Reply with your status."
                            )
                            sent_count += 1
                        except Exception as e:
                            logger.error(f"Failed to send SMS to {member.phone}: {e}")
                    
                    # Also send push notification if available
                    # TODO: Implement push notifications
        
        logger.info(f"Requested check-ins from {sent_count} family members")
        return sent_count
    
    @staticmethod
    def get_family_status(
        db: Session,
        family_group_id: str,
        user: User
    ) -> Dict:
        """Get current status of all family members"""
        # Verify user has access
        member = db.query(FamilyMember).filter(
            and_(
                FamilyMember.family_group_id == family_group_id,
                FamilyMember.user_id == user.id
            )
        ).first()
        
        if not member:
            raise ValueError("You are not part of this family group")
        
        # Get all members with their latest check-ins
        members = db.query(FamilyMember).filter(
            FamilyMember.family_group_id == family_group_id
        ).all()
        
        member_statuses = []
        for member in members:
            # Get latest check-in
            latest_checkin = db.query(FamilyCheckIn).filter(
                FamilyCheckIn.member_id == member.id
            ).order_by(FamilyCheckIn.created_at.desc()).first()
            
            member_status = {
                "id": member.id,
                "name": member.name,
                "email": member.email,
                "phone": member.phone,
                "role": member.role,
                "status": member.status,
                "emergency_contact": member.emergency_contact,
                "location_sharing_enabled": member.location_sharing_enabled,
                "last_location": None,
                "latest_checkin": None
            }
            
            # Add location if available and sharing is enabled
            if member.location_sharing_enabled and member.last_location_lat:
                member_status["last_location"] = {
                    "lat": member.last_location_lat,
                    "lng": member.last_location_lng,
                    "updated_at": member.last_location_update.isoformat() if member.last_location_update else None
                }
            
            # Add check-in info
            if latest_checkin:
                member_status["latest_checkin"] = {
                    "status": latest_checkin.status,
                    "message": latest_checkin.message,
                    "created_at": latest_checkin.created_at.isoformat()
                }
            
            member_statuses.append(member_status)
        
        return {
            "family_group_id": family_group_id,
            "members": member_statuses
        }
    
    @staticmethod
    def _notify_emergency_contacts(
        db: Session,
        member: FamilyMember,
        check_in: FamilyCheckIn
    ):
        """Notify emergency contacts when someone needs help"""
        # Get all emergency contacts in the family
        emergency_contacts = db.query(FamilyMember).filter(
            and_(
                FamilyMember.family_group_id == member.family_group_id,
                FamilyMember.emergency_contact == True,
                FamilyMember.status == "active"
            )
        ).all()
        
        notification_service = NotificationService()
        
        for contact in emergency_contacts:
            message = f"EMERGENCY: {member.name} needs help! "
            if check_in.message:
                message += f"Message: {check_in.message}. "
            if check_in.location_lat and check_in.location_lng:
                message += f"Location: https://maps.google.com/?q={check_in.location_lat},{check_in.location_lng}"
            
            # Send SMS if available
            if contact.phone:
                try:
                    notification_service.send_sms(contact.phone, message)
                except Exception as e:
                    logger.error(f"Failed to notify emergency contact {contact.id}: {e}")
            
            # Send email if user is registered
            if contact.user_id:
                user = db.query(User).filter_by(id=contact.user_id).first()
                if user:
                    try:
                        notification_service.send_email(
                            user.email,
                            "Emergency: Family Member Needs Help",
                            message
                        )
                    except Exception as e:
                        logger.error(f"Failed to email emergency contact {contact.id}: {e}")