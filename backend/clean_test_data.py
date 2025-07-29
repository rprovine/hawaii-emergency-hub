#!/usr/bin/env python3
"""
Clean test data from database, keeping only live data from external APIs
"""
import sys
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.models.models import Alert
from app.core.config import settings

def clean_test_data():
    """Remove test/seed data from database"""
    # Create database connection
    if "sqlite" in settings.DATABASE_URL:
        engine = create_engine("sqlite:///hawaii_emergency.db")
    else:
        engine = create_engine(settings.DATABASE_URL)
    
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()
    
    try:
        # Count alerts before cleaning
        total_before = db.query(Alert).count()
        print(f"Total alerts before cleaning: {total_before}")
        
        # Remove alerts from Hawaii Emergency Management Agency (our test source)
        test_alerts = db.query(Alert).filter(
            Alert.source == "Hawaii Emergency Management Agency"
        ).all()
        
        print(f"Found {len(test_alerts)} test alerts to remove")
        
        for alert in test_alerts:
            db.delete(alert)
        
        db.commit()
        
        # Count remaining alerts
        total_after = db.query(Alert).count()
        live_alerts = db.query(Alert).filter(Alert.is_active == True).count()
        
        print(f"\nCleaning complete!")
        print(f"Total alerts remaining: {total_after}")
        print(f"Active live alerts: {live_alerts}")
        
        # Show breakdown by source
        print("\nAlerts by source:")
        from sqlalchemy import func
        sources = db.query(Alert.source, func.count(Alert.id)).group_by(Alert.source).all()
        for source, count in sources:
            print(f"  - {source}: {count}")
            
    except Exception as e:
        print(f"Error cleaning database: {e}")
        db.rollback()
        sys.exit(1)
    finally:
        db.close()

if __name__ == "__main__":
    clean_test_data()