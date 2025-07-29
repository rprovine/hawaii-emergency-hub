#!/usr/bin/env python3
"""Initialize the database with tables and test data."""

import os
import sys
from sqlalchemy import create_engine
from datetime import datetime, timezone

# Add the parent directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.models.models import Base, User, SubscriptionTier
from app.core.database import SessionLocal, engine
from app.services.auth_service import AuthService

def init_db():
    """Create all tables and add test data."""
    # Drop all tables and recreate
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    
    print("✅ Database tables created!")
    
    # Create test user
    db = SessionLocal()
    try:
        auth_service = AuthService(db)
        
        # Create a test user
        from app.schemas.auth_schemas import UserCreate
        test_user = UserCreate(
            email="test@example.com",
            password="password123",
            full_name="Test User"
        )
        
        user = auth_service.create_user(test_user)
        print(f"✅ Created test user: {user.email}")
        
        # Create subscription if it doesn't exist
        from app.models.models import Subscription
        if not user.subscription:
            subscription = Subscription(
                user_id=user.id,
                tier=SubscriptionTier.PREMIUM,
                status="active",
                is_annual=False
            )
            db.add(subscription)
            db.commit()
            db.refresh(user)
        else:
            # Upgrade to premium for testing
            user.subscription.tier = SubscriptionTier.PREMIUM
            db.commit()
        
        print("✅ Upgraded test user to PREMIUM tier")
        
    finally:
        db.close()
    
    print("\n🎉 Database initialized successfully!")
    print("\nTest credentials:")
    print("Email: test@example.com")
    print("Password: password123")
    print("Tier: PREMIUM")

if __name__ == "__main__":
    init_db()