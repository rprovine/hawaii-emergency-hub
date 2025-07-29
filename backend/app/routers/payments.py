from fastapi import APIRouter, Depends, HTTPException, Header, Request
from sqlalchemy.orm import Session
from typing import Optional
import stripe
import logging
from datetime import datetime, timezone

from app.core.database import get_db
from app.models.models import User, Subscription, Payment, SubscriptionTier
from app.core.auth import get_current_user
from app.core.config import settings

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api/v1/payments",
    tags=["payments"]
)

# Initialize Stripe
stripe.api_key = settings.STRIPE_SECRET_KEY

@router.post("/create-checkout-session")
async def create_checkout_session(
    tier: str,
    is_annual: bool = False,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a Stripe checkout session for subscription upgrades"""
    
    # Define price IDs for each tier (these would be created in Stripe Dashboard)
    price_ids = {
        "essential": {
            "monthly": "price_essential_monthly",
            "annual": "price_essential_annual"
        },
        "premium": {
            "monthly": "price_premium_monthly",
            "annual": "price_premium_annual"
        },
        "business": {
            "monthly": "price_business_monthly",
            "annual": "price_business_annual"
        }
    }
    
    if tier not in price_ids:
        raise HTTPException(status_code=400, detail="Invalid tier")
    
    price_id = price_ids[tier]["annual" if is_annual else "monthly"]
    
    try:
        # Create Stripe checkout session
        checkout_session = stripe.checkout.Session.create(
            payment_method_types=['card'],
            mode='subscription',
            customer_email=current_user.email,
            line_items=[{
                'price': price_id,
                'quantity': 1,
            }],
            success_url=f"{settings.FRONTEND_URL}/subscription/success?session_id={{CHECKOUT_SESSION_ID}}",
            cancel_url=f"{settings.FRONTEND_URL}/subscription/cancel",
            metadata={
                'user_id': str(current_user.id),
                'tier': tier,
                'is_annual': str(is_annual)
            }
        )
        
        return {"checkout_url": checkout_session.url}
        
    except stripe.error.StripeError as e:
        logger.error(f"Stripe error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/webhook")
async def stripe_webhook(
    request: Request,
    stripe_signature: str = Header(None),
    db: Session = Depends(get_db)
):
    """Handle Stripe webhook events"""
    
    payload = await request.body()
    
    try:
        event = stripe.Webhook.construct_event(
            payload, stripe_signature, settings.STRIPE_WEBHOOK_SECRET
        )
    except ValueError:
        logger.error("Invalid payload")
        raise HTTPException(status_code=400, detail="Invalid payload")
    except stripe.error.SignatureVerificationError:
        logger.error("Invalid signature")
        raise HTTPException(status_code=400, detail="Invalid signature")
    
    # Handle the checkout.session.completed event
    if event['type'] == 'checkout.session.completed':
        session = event['data']['object']
        
        # Get user from metadata
        user_id = int(session['metadata']['user_id'])
        tier = session['metadata']['tier']
        is_annual = session['metadata']['is_annual'] == 'True'
        
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            logger.error(f"User {user_id} not found")
            return {"status": "error"}
        
        # Update subscription
        subscription = user.subscription
        subscription.tier = SubscriptionTier(tier)
        subscription.is_annual = is_annual
        subscription.stripe_customer_id = session.get('customer')
        subscription.stripe_subscription_id = session.get('subscription')
        subscription.expires_at = datetime.now(timezone.utc).replace(
            month=datetime.now(timezone.utc).month + (12 if is_annual else 1)
        )
        
        # Create payment record
        payment = Payment(
            user_id=user_id,
            amount=session['amount_total'] / 100,  # Convert from cents
            currency=session['currency'],
            status='completed',
            stripe_payment_id=session['payment_intent'],
            subscription_tier=tier,
            is_annual=is_annual
        )
        db.add(payment)
        
        db.commit()
        logger.info(f"Successfully upgraded user {user_id} to {tier}")
    
    # Handle subscription updated
    elif event['type'] == 'customer.subscription.updated':
        subscription_obj = event['data']['object']
        
        # Find subscription by stripe ID
        subscription = db.query(Subscription).filter(
            Subscription.stripe_subscription_id == subscription_obj['id']
        ).first()
        
        if subscription:
            # Update subscription status
            if subscription_obj['status'] == 'active':
                subscription.expires_at = datetime.fromtimestamp(
                    subscription_obj['current_period_end'],
                    tz=timezone.utc
                )
            db.commit()
    
    # Handle subscription cancelled
    elif event['type'] == 'customer.subscription.deleted':
        subscription_obj = event['data']['object']
        
        # Find subscription by stripe ID
        subscription = db.query(Subscription).filter(
            Subscription.stripe_subscription_id == subscription_obj['id']
        ).first()
        
        if subscription:
            # Downgrade to free tier
            subscription.tier = SubscriptionTier.FREE
            subscription.stripe_subscription_id = None
            db.commit()
            logger.info(f"Subscription cancelled for user {subscription.user_id}")
    
    # Handle payment failed
    elif event['type'] == 'invoice.payment_failed':
        invoice = event['data']['object']
        
        # Find subscription by customer ID
        subscription = db.query(Subscription).filter(
            Subscription.stripe_customer_id == invoice['customer']
        ).first()
        
        if subscription:
            # Send notification to user about failed payment
            # This would integrate with the notification service
            logger.warning(f"Payment failed for user {subscription.user_id}")
    
    return {"status": "success"}

@router.get("/subscription-status")
async def get_subscription_status(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get current subscription status including Stripe details"""
    
    subscription = current_user.subscription
    
    # Get Stripe subscription details if available
    stripe_details = None
    if subscription.stripe_subscription_id:
        try:
            stripe_sub = stripe.Subscription.retrieve(
                subscription.stripe_subscription_id
            )
            stripe_details = {
                "status": stripe_sub.status,
                "current_period_end": stripe_sub.current_period_end,
                "cancel_at_period_end": stripe_sub.cancel_at_period_end
            }
        except stripe.error.StripeError as e:
            logger.error(f"Error retrieving Stripe subscription: {str(e)}")
    
    return {
        "tier": subscription.tier,
        "is_annual": subscription.is_annual,
        "expires_at": subscription.expires_at,
        "stripe_details": stripe_details
    }

@router.post("/cancel-subscription")
async def cancel_subscription(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Cancel a Stripe subscription"""
    
    subscription = current_user.subscription
    
    if not subscription.stripe_subscription_id:
        raise HTTPException(status_code=400, detail="No active subscription")
    
    try:
        # Cancel at period end to allow user to keep benefits until expiry
        stripe_sub = stripe.Subscription.modify(
            subscription.stripe_subscription_id,
            cancel_at_period_end=True
        )
        
        return {
            "message": "Subscription will be cancelled at the end of the billing period",
            "cancel_at": stripe_sub.current_period_end
        }
        
    except stripe.error.StripeError as e:
        logger.error(f"Error cancelling subscription: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/payment-history")
async def get_payment_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user's payment history"""
    
    payments = db.query(Payment).filter(
        Payment.user_id == current_user.id
    ).order_by(Payment.created_at.desc()).all()
    
    return [
        {
            "id": payment.id,
            "amount": payment.amount,
            "currency": payment.currency,
            "status": payment.status,
            "tier": payment.subscription_tier,
            "is_annual": payment.is_annual,
            "created_at": payment.created_at
        }
        for payment in payments
    ]