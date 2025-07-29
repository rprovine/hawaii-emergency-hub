#!/usr/bin/env python3
"""Seed the database with sample emergency alerts for testing."""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from datetime import datetime, timedelta
import random
import uuid
from sqlalchemy.orm import Session

from app.core.database import SessionLocal, create_tables
from app.models.models import Alert, AlertSeverity, AlertCategory, User, UserRole
from app.services.auth_service import pwd_context

# Sample alert templates
ALERT_TEMPLATES = [
    {
        "title": "Flash Flood Warning - Immediate Action Required",
        "description": "Heavy rainfall has caused flash flooding in low-lying areas. Water levels rising rapidly. Move to higher ground immediately. Avoid driving through flooded roads.",
        "severity": AlertSeverity.SEVERE,
        "category": AlertCategory.FLOOD,
        "location_name": "Honolulu County - Manoa Valley",
        "latitude": 21.3099,
        "longitude": -157.8581,
        "radius_miles": 10,
        "affected_counties": ["Honolulu County"],
        "images": ["https://example.com/flood-warning.jpg"],
        "translations": {
            "haw": {
                "title": "Pōpilikia Wai Kīkē - Hana Koke",
                "description": "Ua hoʻopiha ka ua nui i nā wahi haʻahaʻa. E neʻe i ka ʻāina kiʻekiʻe."
            },
            "ja": {
                "title": "鉄砲水警報 - 即座の行動が必要",
                "description": "豪雨により鉄砲水が発生。低地から高地へ避難してください。"
            }
        }
    },
    {
        "title": "Earthquake Alert - Magnitude 5.2",
        "description": "A moderate earthquake has been detected. No tsunami threat at this time. Check for damage and be prepared for aftershocks. Stay away from windows and heavy objects.",
        "severity": AlertSeverity.MODERATE,
        "category": AlertCategory.EARTHQUAKE,
        "location_name": "Hawaii County - Near Volcano",
        "latitude": 19.4194,
        "longitude": -155.2885,
        "radius_miles": 50,
        "affected_counties": ["Hawaii County"],
        "alert_metadata": {
            "magnitude": 5.2,
            "depth_km": 10,
            "usgs_id": "hv73456789"
        }
    },
    {
        "title": "High Surf Warning - North Shores",
        "description": "Dangerous surf conditions expected along north-facing shores. Waves 25-35 feet. Stay away from the shoreline. Beach closures in effect.",
        "severity": AlertSeverity.MODERATE,
        "category": AlertCategory.WEATHER,
        "location_name": "Oahu - North Shore",
        "latitude": 21.6795,
        "longitude": -158.0438,
        "radius_miles": 20,
        "affected_counties": ["Honolulu County"],
        "images": ["https://example.com/high-surf.jpg"],
        "alert_metadata": {
            "wave_height_feet": "25-35",
            "wind_speed_mph": "20-30"
        }
    },
    {
        "title": "Wildfire Evacuation Order - Maui",
        "description": "Fast-moving wildfire threatening residential areas. Mandatory evacuation in effect. Leave immediately via Highway 30. Emergency shelters open at War Memorial Gym.",
        "severity": AlertSeverity.EXTREME,
        "category": AlertCategory.WILDFIRE,
        "location_name": "Maui County - Lahaina",
        "latitude": 20.8783,
        "longitude": -156.6825,
        "radius_miles": 15,
        "affected_counties": ["Maui County"],
        "alert_metadata": {
            "evacuation_zones": ["Zone A", "Zone B"],
            "shelter_locations": ["War Memorial Gym", "Lahaina Civic Center"]
        }
    },
    {
        "title": "Tsunami Advisory - Pacific-wide Event",
        "description": "A tsunami advisory is in effect following a 7.5 earthquake in the Pacific. Minor sea level fluctuations possible. Stay away from beaches and harbors.",
        "severity": AlertSeverity.MODERATE,
        "category": AlertCategory.TSUNAMI,
        "location_name": "All Hawaiian Islands",
        "latitude": 20.5,
        "longitude": -157.0,
        "radius_miles": 200,
        "affected_counties": ["Hawaii County", "Maui County", "Honolulu County", "Kauai County"],
        "alert_metadata": {
            "estimated_arrival": "14:30 HST",
            "max_wave_height_m": 0.5
        }
    },
    {
        "title": "Hurricane Watch - Hurricane Kilo",
        "description": "Hurricane Kilo approaching from the southeast. Potential landfall in 48 hours. Begin preparations now. Stock emergency supplies and secure property.",
        "severity": AlertSeverity.SEVERE,
        "category": AlertCategory.HURRICANE,
        "location_name": "Big Island - East Side",
        "latitude": 19.5429,
        "longitude": -155.6659,
        "radius_miles": 100,
        "affected_counties": ["Hawaii County", "Maui County"],
        "images": ["https://example.com/hurricane-track.jpg"],
        "alert_metadata": {
            "wind_speed_mph": 110,
            "category": 2,
            "movement": "NW at 15 mph"
        }
    },
    {
        "title": "Volcanic Ash Advisory",
        "description": "Kilauea volcano emitting ash plume. Ash fall expected in downwind areas. Close windows and limit outdoor activities. Use N95 masks if going outside.",
        "severity": AlertSeverity.MINOR,
        "category": AlertCategory.VOLCANO,
        "location_name": "Hawaii County - Puna District",
        "latitude": 19.4069,
        "longitude": -155.2834,
        "radius_miles": 30,
        "affected_counties": ["Hawaii County"],
        "alert_metadata": {
            "plume_height_ft": 8000,
            "so2_levels_ppm": 2.5
        }
    },
    {
        "title": "Tropical Storm Warning",
        "description": "Tropical Storm Ela bringing heavy rain and strong winds. 4-8 inches of rain expected. Flooding possible in low areas. Secure loose objects.",
        "severity": AlertSeverity.MODERATE,
        "category": AlertCategory.WEATHER,
        "location_name": "Kauai County",
        "latitude": 22.0964,
        "longitude": -159.5261,
        "radius_miles": 60,
        "affected_counties": ["Kauai County"],
        "alert_metadata": {
            "max_winds_mph": 65,
            "rainfall_inches": "4-8"
        }
    },
    {
        "title": "Brown Water Advisory",
        "description": "Heavy rains have caused runoff. Avoid swimming or fishing in affected coastal areas due to possible contamination. Advisory in effect for 72 hours.",
        "severity": AlertSeverity.MINOR,
        "category": AlertCategory.HEALTH,
        "location_name": "Oahu - Windward Coast",
        "latitude": 21.4022,
        "longitude": -157.7394,
        "radius_miles": 25,
        "affected_counties": ["Honolulu County"],
        "alert_metadata": {
            "bacteria_levels": "elevated",
            "affected_beaches": ["Kailua Beach", "Lanikai Beach", "Waimanalo Beach"]
        }
    },
    {
        "title": "Civil Emergency - Missing Child Alert",
        "description": "AMBER Alert: 8-year-old child missing from Waikiki area. Last seen wearing blue shirt and shorts. If seen, call 911 immediately.",
        "severity": AlertSeverity.SEVERE,
        "category": AlertCategory.CIVIL,
        "location_name": "Honolulu County - Waikiki",
        "latitude": 21.2769,
        "longitude": -157.8237,
        "radius_miles": 50,
        "affected_counties": ["Honolulu County"],
        "alert_metadata": {
            "case_number": "HPD-2024-12345",
            "contact": "911"
        }
    }
]

# Sample users
SAMPLE_USERS = [
    {
        "email": "admin@hawaii-emergency.gov",
        "password": "admin123",
        "full_name": "System Administrator",
        "role": UserRole.ADMIN,
        "home_latitude": 21.3099,
        "home_longitude": -157.8581,
        "subscribed_counties": ["Honolulu County"]
    },
    {
        "email": "john.doe@example.com",
        "password": "user123",
        "full_name": "John Doe",
        "role": UserRole.USER,
        "home_latitude": 21.2769,
        "home_longitude": -157.8237,
        "alert_radius_miles": 25,
        "subscribed_counties": ["Honolulu County"],
        "preferred_language": "en"
    },
    {
        "email": "keiko.tanaka@example.com",
        "password": "user123",
        "full_name": "Keiko Tanaka",
        "role": UserRole.USER,
        "home_latitude": 20.8783,
        "home_longitude": -156.6825,
        "alert_radius_miles": 30,
        "subscribed_counties": ["Maui County"],
        "preferred_language": "ja"
    },
    {
        "email": "emergency.manager@hawaii.gov",
        "password": "manager123",
        "full_name": "Emergency Manager",
        "role": UserRole.EMERGENCY_MANAGER,
        "subscribed_counties": ["Honolulu County", "Hawaii County", "Maui County", "Kauai County"]
    }
]

def seed_database():
    """Seed the database with sample data."""
    db = SessionLocal()
    
    try:
        # Create tables if they don't exist
        create_tables()
        
        print("🌺 Seeding Hawaii Emergency Network Hub Database...")
        print("=" * 50)
        
        # Clear existing data
        db.query(Alert).delete()
        db.query(User).delete()
        db.commit()
        
        # Create sample users
        print("\n👥 Creating sample users...")
        users = []
        for user_data in SAMPLE_USERS:
            password = user_data.pop("password")
            user = User(
                id=str(uuid.uuid4()),
                hashed_password=pwd_context.hash(password),
                is_active=True,
                is_verified=True,
                **user_data
            )
            users.append(user)
            db.add(user)
            print(f"  ✅ Created user: {user.email} (password: {password})")
        
        db.commit()
        
        # Create sample alerts
        print("\n🚨 Creating sample alerts...")
        alerts_created = 0
        
        for template in ALERT_TEMPLATES:
            # Create some current alerts
            alert_data = template.copy()
            alert = Alert(
                id=str(uuid.uuid4()),
                external_id=f"TEST-{uuid.uuid4().hex[:8]}",
                effective_time=datetime.utcnow() - timedelta(hours=random.randint(0, 12)),
                expires_time=datetime.utcnow() + timedelta(hours=random.randint(2, 24)),
                source="Hawaii Emergency Management Agency",
                source_url="https://dod.hawaii.gov/hiema/",
                is_active=True,
                is_test=False,
                created_at=datetime.utcnow() - timedelta(hours=random.randint(0, 12)),
                **alert_data
            )
            db.add(alert)
            alerts_created += 1
            print(f"  ✅ Created alert: {alert.title}")
            
            # Create some expired alerts for history
            if random.random() > 0.5:
                expired_alert_data = template.copy()
                expired_alert = Alert(
                    id=str(uuid.uuid4()),
                    external_id=f"TEST-{uuid.uuid4().hex[:8]}",
                    effective_time=datetime.utcnow() - timedelta(days=random.randint(1, 7)),
                    expires_time=datetime.utcnow() - timedelta(hours=random.randint(1, 24)),
                    source="Hawaii Emergency Management Agency",
                    source_url="https://dod.hawaii.gov/hiema/",
                    is_active=False,
                    is_test=False,
                    created_at=datetime.utcnow() - timedelta(days=random.randint(1, 7)),
                    **expired_alert_data
                )
                db.add(expired_alert)
                alerts_created += 1
        
        db.commit()
        
        print(f"\n✅ Successfully seeded database!")
        print(f"   - {len(users)} users created")
        print(f"   - {alerts_created} alerts created")
        print("\n📝 Test Credentials:")
        print("   Admin: admin@hawaii-emergency.gov / admin123")
        print("   User: john.doe@example.com / user123")
        print("   Manager: emergency.manager@hawaii.gov / manager123")
        
        # Verify data
        active_alerts = db.query(Alert).filter(Alert.is_active == True).count()
        print(f"\n📊 Current Status:")
        print(f"   - Active alerts: {active_alerts}")
        print(f"   - Total alerts: {db.query(Alert).count()}")
        print(f"   - Total users: {db.query(User).count()}")
        
    except Exception as e:
        print(f"❌ Error seeding database: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()