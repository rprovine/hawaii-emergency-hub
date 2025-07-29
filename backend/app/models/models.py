from sqlalchemy import Column, String, Integer, Float, DateTime, Boolean, JSON, Text, ForeignKey, Enum as SQLEnum
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from datetime import datetime
import enum
import uuid

Base = declarative_base()

class AlertSeverity(str, enum.Enum):
    MINOR = "minor"
    MODERATE = "moderate"
    SEVERE = "severe"
    EXTREME = "extreme"

class AlertCategory(str, enum.Enum):
    WEATHER = "weather"
    EARTHQUAKE = "earthquake"
    TSUNAMI = "tsunami"
    VOLCANO = "volcano"
    WILDFIRE = "wildfire"
    FLOOD = "flood"
    HURRICANE = "hurricane"
    CIVIL = "civil"
    HEALTH = "health"
    OTHER = "other"

class UserRole(str, enum.Enum):
    USER = "user"
    ADMIN = "admin"
    GOVERNMENT = "government"
    EMERGENCY_MANAGER = "emergency_manager"

class SubscriptionTier(str, enum.Enum):
    FREE = "free"
    ESSENTIAL = "essential"
    PREMIUM = "premium"
    BUSINESS = "business"
    ENTERPRISE = "enterprise"

class PaymentStatus(str, enum.Enum):
    PENDING = "pending"
    ACTIVE = "active"
    PAST_DUE = "past_due"
    CANCELLED = "cancelled"
    EXPIRED = "expired"

class Alert(Base):
    __tablename__ = "alerts"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    external_id = Column(String, unique=True, index=True)  # ID from source system
    
    # Core alert information
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    severity = Column(SQLEnum(AlertSeverity), nullable=False)
    category = Column(SQLEnum(AlertCategory), nullable=False)
    
    # Location data
    location_name = Column(String)
    latitude = Column(Float)
    longitude = Column(Float)
    radius_miles = Column(Float)
    affected_counties = Column(JSON)  # List of affected counties
    polygon = Column(JSON)  # GeoJSON polygon for precise areas
    
    # Time data
    effective_time = Column(DateTime(timezone=True), nullable=False)
    expires_time = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Source information
    source = Column(String, nullable=False)
    source_url = Column(String)
    
    # Multi-language support
    translations = Column(JSON)  # {"haw": {"title": "", "description": ""}, ...}
    
    # Additional metadata
    alert_metadata = Column(JSON)  # Additional data from source
    images = Column(JSON)  # List of image URLs
    
    # Status
    is_active = Column(Boolean, default=True)
    is_test = Column(Boolean, default=False)
    
    # Relationships
    notifications = relationship("Notification", back_populates="alert")
    user_interactions = relationship("UserAlertInteraction", back_populates="alert")

class User(Base):
    __tablename__ = "users"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String, unique=True, index=True)
    phone = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    
    # Profile
    full_name = Column(String)
    preferred_language = Column(String, default="en")
    role = Column(SQLEnum(UserRole), default=UserRole.USER)
    
    # Location preferences
    home_latitude = Column(Float)
    home_longitude = Column(Float)
    alert_radius_miles = Column(Float, default=25.0)
    subscribed_counties = Column(JSON)  # List of county names
    
    # Notification preferences
    push_enabled = Column(Boolean, default=True)
    email_enabled = Column(Boolean, default=True)
    sms_enabled = Column(Boolean, default=False)
    severity_threshold = Column(SQLEnum(AlertSeverity), default=AlertSeverity.MINOR)
    quiet_hours_start = Column(Integer)  # Hour in HST (0-23)
    quiet_hours_end = Column(Integer)
    
    # Account status
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    last_active = Column(DateTime(timezone=True))
    
    # Device tokens for push notifications
    device_tokens = Column(JSON)  # List of FCM/APNS tokens
    
    # Subscription information
    subscription_tier = Column(SQLEnum(SubscriptionTier), default=SubscriptionTier.FREE)
    subscription_expires = Column(DateTime(timezone=True))
    stripe_customer_id = Column(String, unique=True)
    
    # Premium features
    saved_locations = Column(JSON)  # List of custom locations with geofences
    family_members = Column(JSON)  # List of family member IDs for tracking
    api_key = Column(String, unique=True)  # For API access
    api_calls_today = Column(Integer, default=0)
    api_calls_reset = Column(DateTime(timezone=True))
    
    # Business features
    organization_name = Column(String)
    team_members = Column(JSON)  # List of user IDs
    is_team_owner = Column(Boolean, default=False)
    custom_branding = Column(JSON)  # Logo URL, colors, etc.
    
    # Relationships
    notifications = relationship("Notification", back_populates="user")
    interactions = relationship("UserAlertInteraction", back_populates="user")
    sessions = relationship("UserSession", back_populates="user")
    subscription = relationship("Subscription", back_populates="user", uselist=False)
    alert_zones = relationship("AlertZone", back_populates="user")
    notification_channels = relationship("NotificationChannel", back_populates="user")

class Notification(Base):
    __tablename__ = "notifications"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"))
    alert_id = Column(String, ForeignKey("alerts.id"))
    
    # Delivery information
    channel = Column(String)  # push, email, sms
    sent_at = Column(DateTime(timezone=True))
    delivered_at = Column(DateTime(timezone=True))
    read_at = Column(DateTime(timezone=True))
    
    # Status
    status = Column(String)  # pending, sent, delivered, failed
    error_message = Column(String)
    
    # Relationships
    user = relationship("User", back_populates="notifications")
    alert = relationship("Alert", back_populates="notifications")

class UserAlertInteraction(Base):
    __tablename__ = "user_alert_interactions"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"))
    alert_id = Column(String, ForeignKey("alerts.id"))
    
    # Interaction data
    viewed_at = Column(DateTime(timezone=True))
    dismissed_at = Column(DateTime(timezone=True))
    shared_at = Column(DateTime(timezone=True))
    feedback = Column(String)  # useful, not_useful, false_alarm
    
    # Relationships
    user = relationship("User", back_populates="interactions")
    alert = relationship("Alert", back_populates="user_interactions")

class UserSession(Base):
    __tablename__ = "user_sessions"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"))
    
    # Session data
    token = Column(String, unique=True, index=True)
    refresh_token = Column(String, unique=True, index=True)
    device_info = Column(JSON)
    ip_address = Column(String)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    expires_at = Column(DateTime(timezone=True))
    last_active = Column(DateTime(timezone=True))
    
    # Relationships
    user = relationship("User", back_populates="sessions")

class AdminAction(Base):
    __tablename__ = "admin_actions"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    admin_id = Column(String, ForeignKey("users.id"))
    
    # Action details
    action_type = Column(String)  # create_alert, update_alert, delete_alert, etc.
    target_type = Column(String)  # alert, user, etc.
    target_id = Column(String)
    
    # Audit trail
    changes = Column(JSON)  # Before/after values
    reason = Column(Text)
    ip_address = Column(String)
    
    # Timestamp
    performed_at = Column(DateTime(timezone=True), server_default=func.now())

class Subscription(Base):
    __tablename__ = "subscriptions"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"), unique=True)
    
    # Subscription details
    tier = Column(SQLEnum(SubscriptionTier), nullable=False)
    status = Column(SQLEnum(PaymentStatus), nullable=False)
    
    # Pricing
    monthly_price = Column(Float)
    annual_price = Column(Float)
    is_annual = Column(Boolean, default=False)
    
    # Stripe information
    stripe_subscription_id = Column(String, unique=True)
    stripe_price_id = Column(String)
    stripe_payment_method = Column(String)
    
    # Billing
    current_period_start = Column(DateTime(timezone=True))
    current_period_end = Column(DateTime(timezone=True))
    trial_end = Column(DateTime(timezone=True))
    cancel_at_period_end = Column(Boolean, default=False)
    
    # Limits
    max_saved_locations = Column(Integer)
    max_family_members = Column(Integer)
    max_api_calls_per_day = Column(Integer)
    max_team_members = Column(Integer)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    cancelled_at = Column(DateTime(timezone=True))
    
    # Relationships
    user = relationship("User", back_populates="subscription")
    payments = relationship("Payment", back_populates="subscription")

class Payment(Base):
    __tablename__ = "payments"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    subscription_id = Column(String, ForeignKey("subscriptions.id"))
    
    # Payment details
    amount = Column(Float, nullable=False)
    currency = Column(String, default="USD")
    status = Column(String)  # succeeded, failed, pending, refunded
    
    # Stripe information
    stripe_payment_intent_id = Column(String, unique=True)
    stripe_invoice_id = Column(String)
    
    # Metadata
    description = Column(String)
    failure_reason = Column(String)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    paid_at = Column(DateTime(timezone=True))
    
    # Relationships
    subscription = relationship("Subscription", back_populates="payments")

class AlertZone(Base):
    __tablename__ = "alert_zones"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"))
    
    # Zone information
    name = Column(String, nullable=False)
    description = Column(Text)
    
    # Geofence data
    center_latitude = Column(Float)
    center_longitude = Column(Float)
    radius_miles = Column(Float)
    polygon = Column(JSON)  # GeoJSON polygon for custom shapes
    
    # Settings
    is_active = Column(Boolean, default=True)
    severity_threshold = Column(SQLEnum(AlertSeverity), default=AlertSeverity.MINOR)
    categories = Column(JSON)  # List of AlertCategory values to monitor
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    user = relationship("User", back_populates="alert_zones")

class NotificationChannel(Base):
    __tablename__ = "notification_channels"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"))
    
    # Channel information
    channel_type = Column(String)  # sms, email, voice, whatsapp, telegram
    destination = Column(String)  # phone number, email, etc.
    is_verified = Column(Boolean, default=False)
    is_primary = Column(Boolean, default=False)
    
    # Settings
    is_active = Column(Boolean, default=True)
    severity_threshold = Column(SQLEnum(AlertSeverity))
    categories = Column(JSON)  # List of AlertCategory values
    
    # Verification
    verification_code = Column(String)
    verification_sent_at = Column(DateTime(timezone=True))
    verified_at = Column(DateTime(timezone=True))
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    last_used = Column(DateTime(timezone=True))
    
    # Relationships
    user = relationship("User", back_populates="notification_channels")

class ApiUsage(Base):
    __tablename__ = "api_usage"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"))
    
    # Usage tracking
    endpoint = Column(String)
    method = Column(String)
    status_code = Column(Integer)
    response_time_ms = Column(Integer)
    
    # Rate limiting
    api_key_used = Column(String)
    ip_address = Column(String)
    
    # Timestamp
    requested_at = Column(DateTime(timezone=True), server_default=func.now())