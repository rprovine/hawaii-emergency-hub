from fastapi import HTTPException, Request, status
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from datetime import datetime, timezone, timedelta
import redis
import json
import logging
from typing import Optional, Dict

from app.core.config import settings
from app.models.models import SubscriptionTier

logger = logging.getLogger(__name__)

# Rate limits per tier (requests per day)
RATE_LIMITS = {
    SubscriptionTier.FREE: 100,
    SubscriptionTier.ESSENTIAL: 1000,
    SubscriptionTier.PREMIUM: 5000,
    SubscriptionTier.BUSINESS: 10000,
    SubscriptionTier.ENTERPRISE: 50000  # Effectively unlimited
}

# Initialize Redis client
try:
    redis_client = redis.from_url(settings.REDIS_URL, decode_responses=True)
    redis_client.ping()
    logger.info("Redis connection established for rate limiting")
except Exception as e:
    logger.warning(f"Redis not available for rate limiting: {e}")
    redis_client = None


class RateLimitMiddleware(BaseHTTPMiddleware):
    """
    Middleware to implement rate limiting based on subscription tier
    """
    
    async def dispatch(self, request: Request, call_next):
        # Skip rate limiting for certain paths
        exempt_paths = [
            "/",
            "/health",
            "/api/v1/auth/register",
            "/api/v1/auth/login",
            "/api/v1/auth/refresh",
            "/docs",
            "/redoc",
            "/openapi.json"
        ]
        
        if request.url.path in exempt_paths:
            return await call_next(request)
        
        # Try to get user from request state (set by auth middleware)
        user = getattr(request.state, "user", None)
        
        if not user:
            # For unauthenticated requests, use IP-based rate limiting
            identifier = request.client.host
            tier = SubscriptionTier.FREE
            limit = 50  # Lower limit for unauthenticated requests
        else:
            identifier = f"user:{user.id}"
            tier = user.subscription.tier if user.subscription else SubscriptionTier.FREE
            limit = RATE_LIMITS.get(tier, 100)
        
        # Check rate limit
        if redis_client:
            try:
                # Use daily buckets for rate limiting
                today = datetime.now(timezone.utc).date().isoformat()
                key = f"rate_limit:{identifier}:{today}"
                
                # Get current count
                current_count = redis_client.get(key)
                current_count = int(current_count) if current_count else 0
                
                # Check if limit exceeded
                if current_count >= limit:
                    # Calculate reset time (midnight UTC)
                    now = datetime.now(timezone.utc)
                    tomorrow = (now + timedelta(days=1)).replace(hour=0, minute=0, second=0, microsecond=0)
                    reset_timestamp = int(tomorrow.timestamp())
                    
                    return JSONResponse(
                        status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                        content={
                            "detail": "Rate limit exceeded",
                            "limit": limit,
                            "reset": reset_timestamp,
                            "tier": tier
                        },
                        headers={
                            "X-RateLimit-Limit": str(limit),
                            "X-RateLimit-Remaining": "0",
                            "X-RateLimit-Reset": str(reset_timestamp),
                            "Retry-After": str(int((tomorrow - now).total_seconds()))
                        }
                    )
                
                # Increment counter
                redis_client.incr(key)
                if current_count == 0:
                    # Set expiry to next day
                    redis_client.expire(key, 86400)  # 24 hours
                
                # Add rate limit headers to response
                response = await call_next(request)
                response.headers["X-RateLimit-Limit"] = str(limit)
                response.headers["X-RateLimit-Remaining"] = str(max(0, limit - current_count - 1))
                response.headers["X-RateLimit-Reset"] = str(int((datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0) + timedelta(days=1)).timestamp()))
                
                return response
                
            except Exception as e:
                logger.error(f"Rate limiting error: {e}")
                # Continue without rate limiting if Redis fails
                return await call_next(request)
        else:
            # No Redis available, continue without rate limiting
            return await call_next(request)


async def check_rate_limit(identifier: str, tier: SubscriptionTier = SubscriptionTier.FREE) -> Dict:
    """
    Check rate limit for a specific identifier and tier
    Returns current usage stats
    """
    if not redis_client:
        return {
            "limit": RATE_LIMITS.get(tier, 100),
            "remaining": -1,  # Unknown
            "reset": None
        }
    
    try:
        today = datetime.now(timezone.utc).date().isoformat()
        key = f"rate_limit:{identifier}:{today}"
        
        current_count = redis_client.get(key)
        current_count = int(current_count) if current_count else 0
        
        limit = RATE_LIMITS.get(tier, 100)
        
        # Calculate reset time
        now = datetime.now(timezone.utc)
        tomorrow = (now + timedelta(days=1)).replace(hour=0, minute=0, second=0, microsecond=0)
        reset_timestamp = int(tomorrow.timestamp())
        
        return {
            "limit": limit,
            "used": current_count,
            "remaining": max(0, limit - current_count),
            "reset": reset_timestamp
        }
        
    except Exception as e:
        logger.error(f"Error checking rate limit: {e}")
        return {
            "limit": RATE_LIMITS.get(tier, 100),
            "remaining": -1,
            "reset": None
        }


def rate_limit_key_for_api_key(api_key: str) -> str:
    """Generate rate limit key for API key authentication"""
    return f"api_key:{api_key}"