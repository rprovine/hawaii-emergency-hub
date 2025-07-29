from datetime import datetime, timedelta, timezone
from typing import Optional, Union, List
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session, joinedload
from app.core.config import settings
from app.core.database import get_db
from app.models.models import User, UserRole, SubscriptionTier
from app.services.subscription_service import SubscriptionService
import secrets
import string

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/token")

class AuthService:
    @staticmethod
    def verify_password(plain_password: str, hashed_password: str) -> bool:
        return pwd_context.verify(plain_password, hashed_password)
    
    @staticmethod
    def get_password_hash(password: str) -> str:
        return pwd_context.hash(password)
    
    @staticmethod
    def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
        to_encode = data.copy()
        if expires_delta:
            expire = datetime.utcnow() + expires_delta
        else:
            expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        to_encode.update({"exp": expire})
        encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
        return encoded_jwt
    
    @staticmethod
    def generate_api_key() -> str:
        """Generate a secure API key"""
        alphabet = string.ascii_letters + string.digits
        return ''.join(secrets.choice(alphabet) for _ in range(32))

async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user = db.query(User).options(joinedload(User.subscription)).filter(User.id == user_id).first()
    if user is None:
        raise credentials_exception
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return user

async def get_current_user_optional(
    token: Optional[str] = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> Optional[User]:
    """Get current user if authenticated, otherwise return None"""
    if not token:
        return None
    try:
        return await get_current_user(token, db)
    except HTTPException:
        return None

def require_subscription_tier(allowed_tiers: List[SubscriptionTier]):
    """Dependency to require specific subscription tiers"""
    async def subscription_checker(
        current_user: User = Depends(get_current_user),
        db: Session = Depends(get_db)
    ) -> User:
        # Get user's subscription tier from relationship or column
        user_tier = None
        if current_user.subscription and current_user.subscription.tier:
            user_tier = current_user.subscription.tier
        elif current_user.subscription_tier:
            user_tier = current_user.subscription_tier
        else:
            user_tier = SubscriptionTier.FREE
            
        if user_tier not in allowed_tiers:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"This feature requires {', '.join([t.value for t in allowed_tiers])} subscription"
            )
        
        # Check if subscription is still active
        if current_user.subscription:
            if current_user.subscription.current_period_end and current_user.subscription.current_period_end < datetime.now(timezone.utc):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Your subscription has expired"
                )
        elif current_user.subscription_expires and current_user.subscription_expires < datetime.utcnow():
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Your subscription has expired"
            )
        
        return current_user
    return subscription_checker

def require_feature(feature_name: str):
    """Dependency to require specific feature access"""
    async def feature_checker(
        current_user: User = Depends(get_current_user)
    ) -> User:
        if not SubscriptionService.can_user_access_feature(current_user, feature_name):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Your subscription does not include {feature_name}"
            )
        return current_user
    return feature_checker

def check_resource_limit(resource_name: str):
    """Dependency to check resource limits"""
    async def limit_checker(
        request: Request,
        current_user: User = Depends(get_current_user),
        db: Session = Depends(get_db)
    ) -> User:
        # Get current count based on resource type
        current_count = 0
        
        if resource_name == "saved_locations":
            current_count = len(current_user.saved_locations or [])
        elif resource_name == "family_members":
            current_count = len(current_user.family_members or [])
        elif resource_name == "team_members":
            current_count = len(current_user.team_members or [])
        elif resource_name == "alert_zones":
            from app.models.models import AlertZone
            current_count = db.query(AlertZone).filter(AlertZone.user_id == current_user.id).count()
        elif resource_name == "notification_channels":
            from app.models.models import NotificationChannel
            current_count = db.query(NotificationChannel).filter(NotificationChannel.user_id == current_user.id).count()
        
        if not SubscriptionService.check_user_limit(current_user, f"max_{resource_name}", current_count):
            limits = SubscriptionService.get_user_limits(current_user)
            max_allowed = limits.get(f"max_{resource_name}", 0)
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"You have reached your limit of {max_allowed} {resource_name.replace('_', ' ')}"
            )
        
        return current_user
    return limit_checker

async def check_api_rate_limit(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> User:
    """Check API rate limits based on subscription tier"""
    if not await SubscriptionService.check_api_usage(db, current_user):
        limits = SubscriptionService.get_user_limits(current_user)
        max_calls = limits.get("max_api_calls_per_day", 100)
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"API rate limit exceeded. Your plan allows {max_calls} calls per day."
        )
    
    # Increment usage counter
    SubscriptionService.increment_api_usage(db, current_user)
    
    # Log API usage
    from app.models.models import ApiUsage
    api_usage = ApiUsage(
        user_id=current_user.id,
        endpoint=str(request.url.path),
        method=request.method,
        api_key_used=current_user.api_key if hasattr(request.state, "api_key_auth") else None,
        ip_address=request.client.host
    )
    db.add(api_usage)
    db.commit()
    
    return current_user

def require_admin(current_user: User = Depends(get_current_user)) -> User:
    """Require admin role"""
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return current_user

def require_roles(allowed_roles: List[UserRole]):
    """Dependency to require specific user roles"""
    async def role_checker(
        current_user: User = Depends(get_current_user)
    ) -> User:
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"This endpoint requires one of these roles: {', '.join([r.value for r in allowed_roles])}"
            )
        return current_user
    return role_checker

# API Key authentication for premium users
oauth2_api_key = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/token", auto_error=False)

async def get_current_user_by_api_key(
    api_key: Optional[str] = Depends(oauth2_api_key),
    db: Session = Depends(get_db)
) -> Optional[User]:
    """Authenticate user by API key"""
    if not api_key:
        return None
    
    user = db.query(User).filter(User.api_key == api_key).first()
    if user and user.is_active:
        return user
    return None

async def get_authenticated_user(
    request: Request,
    token_user: Optional[User] = Depends(get_current_user_optional),
    api_key_user: Optional[User] = Depends(get_current_user_by_api_key)
) -> User:
    """Get authenticated user from either JWT token or API key"""
    user = token_user or api_key_user
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required"
        )
    
    # Mark if authenticated via API key for rate limiting
    if api_key_user:
        request.state.api_key_auth = True
    
    return user