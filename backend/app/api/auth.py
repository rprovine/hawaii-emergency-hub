from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict

from app.core.database import get_db
from app.core.config import settings
from app.core.auth import get_current_user, AuthService, require_subscription_tier
from app.models.models import User, SubscriptionTier
from app.schemas.auth_schemas import Token, UserCreate, UserResponse
from app.services.auth_service import AuthService as AuthServiceOld
from app.services.subscription_service import SubscriptionService
from app.core.rate_limit import check_rate_limit

router = APIRouter()

@router.post("/register", response_model=UserResponse)
async def register(
    user_data: UserCreate,
    db: Session = Depends(get_db)
):
    """Register a new user."""
    auth_service = AuthServiceOld(db)
    
    # Check if user already exists
    if auth_service.get_user_by_email(user_data.email):
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )
    
    user = auth_service.create_user(user_data)
    return user

@router.post("/login", response_model=Token)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    """Login user and return access token."""
    auth_service = AuthServiceOld(db)
    
    user = auth_service.authenticate_user(form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token = auth_service.create_access_token(
        data={"sub": user.id}
    )
    
    # Update last active
    user.last_active = datetime.utcnow()
    db.commit()
    
    # Get subscription tier from relationship or column
    if user.subscription and user.subscription.tier:
        tier = user.subscription.tier.value
    elif user.subscription_tier:
        tier = user.subscription_tier.value
    else:
        tier = "free"
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "subscription_tier": tier
    }

@router.get("/me")
async def get_current_user_info(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Dict:
    """Get current user info with subscription details"""
    limits = SubscriptionService.get_user_limits(current_user)
    
    return {
        "id": current_user.id,
        "email": current_user.email,
        "full_name": current_user.full_name,
        "role": current_user.role.value,
        "subscription": {
            "tier": current_user.subscription_tier.value if current_user.subscription_tier else "free",
            "expires": current_user.subscription_expires.isoformat() if current_user.subscription_expires else None,
            "limits": limits,
            "api_calls_remaining": limits["max_api_calls_per_day"] - (current_user.api_calls_today or 0) if limits["max_api_calls_per_day"] != -1 else "unlimited"
        },
        "features": {
            "sms_enabled": limits.get("sms_enabled", False),
            "voice_enabled": limits.get("voice_enabled", False),
            "custom_branding": limits.get("custom_branding", False),
            "saved_locations": len(current_user.saved_locations or []),
            "max_saved_locations": limits["max_saved_locations"]
        }
    }

@router.post("/subscribe")
async def create_subscription(
    tier: SubscriptionTier,
    payment_method_id: Optional[str] = None,
    is_annual: bool = False,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create or upgrade subscription"""
    try:
        subscription = await SubscriptionService.create_subscription(
            db, current_user, tier, payment_method_id, is_annual
        )
        return {
            "status": "success",
            "subscription_id": subscription.id,
            "tier": subscription.tier.value,
            "trial_end": subscription.trial_end.isoformat() if subscription.trial_end else None
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/cancel-subscription")
async def cancel_subscription(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Cancel current subscription"""
    success = await SubscriptionService.cancel_subscription(db, current_user)
    if not success:
        raise HTTPException(status_code=400, detail="No active subscription found")
    
    return {"status": "success", "message": "Subscription will be cancelled at end of billing period"}

@router.post("/generate-api-key")
async def generate_api_key(
    current_user: User = Depends(require_subscription_tier([
        SubscriptionTier.ESSENTIAL,
        SubscriptionTier.PREMIUM,
        SubscriptionTier.BUSINESS,
        SubscriptionTier.ENTERPRISE
    ])),
    db: Session = Depends(get_db)
):
    """Generate API key for premium users"""
    if current_user.api_key:
        raise HTTPException(status_code=400, detail="API key already exists. Revoke it first.")
    
    api_key = AuthService.generate_api_key()
    current_user.api_key = api_key
    db.commit()
    
    return {
        "api_key": api_key,
        "message": "Store this key securely. It won't be shown again."
    }

@router.delete("/revoke-api-key")
async def revoke_api_key(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Revoke current API key"""
    if not current_user.api_key:
        raise HTTPException(status_code=400, detail="No API key found")
    
    current_user.api_key = None
    db.commit()
    
    return {"status": "success", "message": "API key revoked"}

@router.get("/rate-limit-status")
async def get_rate_limit_status(
    current_user: User = Depends(get_current_user)
):
    """Get current rate limit status for the user"""
    identifier = f"user:{current_user.id}"
    tier = current_user.subscription.tier if current_user.subscription else SubscriptionTier.FREE
    
    status = await check_rate_limit(identifier, tier)
    
    return {
        "tier": tier,
        "limit": status["limit"],
        "used": status.get("used", 0),
        "remaining": status["remaining"],
        "reset": status["reset"],
        "reset_time": datetime.fromtimestamp(status["reset"]).isoformat() if status["reset"] else None
    }