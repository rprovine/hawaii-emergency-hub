from typing import Dict, Optional, List
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.models.models import User, Subscription, SubscriptionTier, PaymentStatus
from app.core.config import settings
import stripe
import logging

logger = logging.getLogger(__name__)

# Initialize Stripe
stripe.api_key = settings.STRIPE_SECRET_KEY

class SubscriptionService:
    """Handle subscription management and feature access"""
    
    # Tier configurations
    TIER_LIMITS = {
        SubscriptionTier.FREE: {
            "max_saved_locations": 1,
            "max_family_members": 0,
            "max_api_calls_per_day": 100,
            "max_team_members": 0,
            "sms_enabled": False,
            "voice_enabled": False,
            "historical_days": 1,
            "alert_zones": 1,
            "notification_channels": 1
        },
        SubscriptionTier.ESSENTIAL: {
            "max_saved_locations": 5,
            "max_family_members": 0,
            "max_api_calls_per_day": 1000,
            "max_team_members": 0,
            "sms_enabled": True,
            "voice_enabled": False,
            "historical_days": 30,
            "alert_zones": 5,
            "notification_channels": 3,
            "monthly_price": 9.99
        },
        SubscriptionTier.PREMIUM: {
            "max_saved_locations": 10,
            "max_family_members": 5,
            "max_api_calls_per_day": 5000,
            "max_team_members": 0,
            "sms_enabled": True,
            "voice_enabled": True,
            "historical_days": 365,
            "alert_zones": 10,
            "notification_channels": 5,
            "monthly_price": 19.99
        },
        SubscriptionTier.BUSINESS: {
            "max_saved_locations": 50,
            "max_family_members": 0,
            "max_api_calls_per_day": 10000,
            "max_team_members": 25,
            "sms_enabled": True,
            "voice_enabled": True,
            "historical_days": 730,
            "alert_zones": 50,
            "notification_channels": 10,
            "monthly_price": 99.99,
            "custom_branding": True
        },
        SubscriptionTier.ENTERPRISE: {
            "max_saved_locations": -1,  # Unlimited
            "max_family_members": -1,
            "max_api_calls_per_day": -1,
            "max_team_members": -1,
            "sms_enabled": True,
            "voice_enabled": True,
            "historical_days": -1,
            "alert_zones": -1,
            "notification_channels": -1,
            "custom_branding": True,
            "sla": True,
            "dedicated_support": True
        }
    }
    
    @classmethod
    def get_user_limits(cls, user: User) -> Dict:
        """Get feature limits for a user based on their subscription"""
        tier = user.subscription_tier or SubscriptionTier.FREE
        return cls.TIER_LIMITS.get(tier, cls.TIER_LIMITS[SubscriptionTier.FREE])
    
    @classmethod
    def can_user_access_feature(cls, user: User, feature: str) -> bool:
        """Check if user can access a specific feature"""
        limits = cls.get_user_limits(user)
        return limits.get(feature, False)
    
    @classmethod
    def check_user_limit(cls, user: User, limit_name: str, current_count: int) -> bool:
        """Check if user has reached a specific limit"""
        limits = cls.get_user_limits(user)
        max_limit = limits.get(limit_name, 0)
        
        # -1 means unlimited
        if max_limit == -1:
            return True
            
        return current_count < max_limit
    
    @classmethod
    async def create_subscription(
        cls,
        db: Session,
        user: User,
        tier: SubscriptionTier,
        payment_method_id: Optional[str] = None,
        is_annual: bool = False
    ) -> Subscription:
        """Create a new subscription for a user"""
        try:
            # Create or get Stripe customer
            if not user.stripe_customer_id:
                customer = stripe.Customer.create(
                    email=user.email,
                    name=user.full_name,
                    metadata={"user_id": user.id}
                )
                user.stripe_customer_id = customer.id
                db.commit()
            
            # Skip payment for free tier
            if tier == SubscriptionTier.FREE:
                subscription = Subscription(
                    user_id=user.id,
                    tier=tier,
                    status=PaymentStatus.ACTIVE,
                    monthly_price=0,
                    annual_price=0,
                    is_annual=False,
                    max_saved_locations=cls.TIER_LIMITS[tier]["max_saved_locations"],
                    max_family_members=cls.TIER_LIMITS[tier]["max_family_members"],
                    max_api_calls_per_day=cls.TIER_LIMITS[tier]["max_api_calls_per_day"],
                    max_team_members=cls.TIER_LIMITS[tier]["max_team_members"]
                )
                db.add(subscription)
                user.subscription_tier = tier
                db.commit()
                return subscription
            
            # Get price ID from Stripe products
            price_id = cls._get_stripe_price_id(tier, is_annual)
            
            # Attach payment method if provided
            if payment_method_id:
                stripe.PaymentMethod.attach(
                    payment_method_id,
                    customer=user.stripe_customer_id
                )
                stripe.Customer.modify(
                    user.stripe_customer_id,
                    invoice_settings={"default_payment_method": payment_method_id}
                )
            
            # Create Stripe subscription
            stripe_subscription = stripe.Subscription.create(
                customer=user.stripe_customer_id,
                items=[{"price": price_id}],
                trial_period_days=7,  # 7-day free trial
                metadata={"user_id": user.id, "tier": tier.value}
            )
            
            # Create local subscription record
            subscription = Subscription(
                user_id=user.id,
                tier=tier,
                status=PaymentStatus.ACTIVE,
                stripe_subscription_id=stripe_subscription.id,
                stripe_price_id=price_id,
                monthly_price=cls.TIER_LIMITS[tier].get("monthly_price", 0),
                annual_price=cls.TIER_LIMITS[tier].get("monthly_price", 0) * 10 if is_annual else None,
                is_annual=is_annual,
                current_period_start=datetime.fromtimestamp(stripe_subscription.current_period_start),
                current_period_end=datetime.fromtimestamp(stripe_subscription.current_period_end),
                trial_end=datetime.fromtimestamp(stripe_subscription.trial_end) if stripe_subscription.trial_end else None,
                max_saved_locations=cls.TIER_LIMITS[tier]["max_saved_locations"],
                max_family_members=cls.TIER_LIMITS[tier]["max_family_members"],
                max_api_calls_per_day=cls.TIER_LIMITS[tier]["max_api_calls_per_day"],
                max_team_members=cls.TIER_LIMITS[tier]["max_team_members"]
            )
            
            db.add(subscription)
            user.subscription_tier = tier
            user.subscription_expires = subscription.current_period_end
            db.commit()
            
            return subscription
            
        except stripe.error.StripeError as e:
            logger.error(f"Stripe error creating subscription: {e}")
            raise
        except Exception as e:
            logger.error(f"Error creating subscription: {e}")
            db.rollback()
            raise
    
    @classmethod
    async def cancel_subscription(cls, db: Session, user: User) -> bool:
        """Cancel a user's subscription"""
        try:
            subscription = db.query(Subscription).filter(
                Subscription.user_id == user.id,
                Subscription.status == PaymentStatus.ACTIVE
            ).first()
            
            if not subscription:
                return False
            
            if subscription.stripe_subscription_id:
                # Cancel at period end to give user access until end of billing period
                stripe.Subscription.modify(
                    subscription.stripe_subscription_id,
                    cancel_at_period_end=True
                )
                subscription.cancel_at_period_end = True
            else:
                # For non-Stripe subscriptions, cancel immediately
                subscription.status = PaymentStatus.CANCELLED
                subscription.cancelled_at = datetime.utcnow()
                user.subscription_tier = SubscriptionTier.FREE
            
            db.commit()
            return True
            
        except Exception as e:
            logger.error(f"Error cancelling subscription: {e}")
            db.rollback()
            return False
    
    @classmethod
    async def upgrade_subscription(
        cls,
        db: Session,
        user: User,
        new_tier: SubscriptionTier,
        payment_method_id: Optional[str] = None
    ) -> Subscription:
        """Upgrade a user's subscription to a higher tier"""
        try:
            # Cancel existing subscription
            if user.subscription_tier != SubscriptionTier.FREE:
                await cls.cancel_subscription(db, user)
            
            # Create new subscription
            return await cls.create_subscription(db, user, new_tier, payment_method_id)
            
        except Exception as e:
            logger.error(f"Error upgrading subscription: {e}")
            raise
    
    @classmethod
    def _get_stripe_price_id(cls, tier: SubscriptionTier, is_annual: bool) -> str:
        """Get Stripe price ID for a subscription tier"""
        # These would be configured in Stripe Dashboard
        price_ids = {
            (SubscriptionTier.ESSENTIAL, False): settings.STRIPE_ESSENTIAL_MONTHLY_PRICE_ID,
            (SubscriptionTier.ESSENTIAL, True): settings.STRIPE_ESSENTIAL_ANNUAL_PRICE_ID,
            (SubscriptionTier.PREMIUM, False): settings.STRIPE_PREMIUM_MONTHLY_PRICE_ID,
            (SubscriptionTier.PREMIUM, True): settings.STRIPE_PREMIUM_ANNUAL_PRICE_ID,
            (SubscriptionTier.BUSINESS, False): settings.STRIPE_BUSINESS_MONTHLY_PRICE_ID,
            (SubscriptionTier.BUSINESS, True): settings.STRIPE_BUSINESS_ANNUAL_PRICE_ID,
        }
        return price_ids.get((tier, is_annual))
    
    @classmethod
    async def check_api_usage(cls, db: Session, user: User) -> bool:
        """Check if user has exceeded their API limit"""
        limits = cls.get_user_limits(user)
        max_calls = limits.get("max_api_calls_per_day", 100)
        
        # Unlimited API calls
        if max_calls == -1:
            return True
        
        # Reset counter if needed
        if not user.api_calls_reset or user.api_calls_reset < datetime.utcnow():
            user.api_calls_today = 0
            user.api_calls_reset = datetime.utcnow() + timedelta(days=1)
            db.commit()
        
        return user.api_calls_today < max_calls
    
    @classmethod
    def increment_api_usage(cls, db: Session, user: User):
        """Increment API usage counter"""
        if user.api_calls_today is None:
            user.api_calls_today = 0
        user.api_calls_today += 1
        db.commit()