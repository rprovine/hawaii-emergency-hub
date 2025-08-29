from fastapi import APIRouter
from typing import List, Optional
from datetime import datetime, timedelta
import random

router = APIRouter()

# Demo alerts for when database isn't available
DEMO_ALERTS = [
    {
        "id": "demo-1",
        "title": "High Surf Warning",
        "description": "Large breaking waves of 25 to 35 feet along north facing shores of Oahu and Maui.",
        "severity": "moderate",
        "category": "weather",
        "location_name": "North Shore, Oahu",
        "latitude": 21.6795,
        "longitude": -158.0265,
        "radius_miles": 15,
        "affected_counties": ["Honolulu County"],
        "created_at": datetime.utcnow().isoformat(),
        "expires_at": (datetime.utcnow() + timedelta(hours=24)).isoformat(),
        "is_active": True,
        "source": "NWS"
    },
    {
        "id": "demo-2", 
        "title": "Volcanic Activity Advisory",
        "description": "Kilauea volcano showing increased seismic activity. No immediate threat to populated areas.",
        "severity": "minor",
        "category": "volcano",
        "location_name": "Hawaii Volcanoes National Park",
        "latitude": 19.4194,
        "longitude": -155.2885,
        "radius_miles": 20,
        "affected_counties": ["Hawaii County"],
        "created_at": datetime.utcnow().isoformat(),
        "expires_at": (datetime.utcnow() + timedelta(hours=48)).isoformat(),
        "is_active": True,
        "source": "USGS"
    },
    {
        "id": "demo-3",
        "title": "Flash Flood Watch",
        "description": "Heavy rainfall expected over windward and mauka areas. Avoid low-lying areas.",
        "severity": "moderate", 
        "category": "weather",
        "location_name": "Windward Oahu",
        "latitude": 21.4389,
        "longitude": -157.7583,
        "radius_miles": 10,
        "affected_counties": ["Honolulu County"],
        "created_at": datetime.utcnow().isoformat(),
        "expires_at": (datetime.utcnow() + timedelta(hours=12)).isoformat(),
        "is_active": True,
        "source": "NWS"
    },
    {
        "id": "demo-4",
        "title": "Small Craft Advisory",
        "description": "Winds 25 to 35 knots and seas 10 to 15 feet expected in Hawaiian waters.",
        "severity": "minor",
        "category": "marine",
        "location_name": "Hawaiian Waters",
        "latitude": 20.7984,
        "longitude": -156.3319,
        "radius_miles": 50,
        "affected_counties": ["Maui County", "Honolulu County"],
        "created_at": datetime.utcnow().isoformat(),
        "expires_at": (datetime.utcnow() + timedelta(hours=36)).isoformat(),
        "is_active": True,
        "source": "NWS"
    },
    {
        "id": "demo-5",
        "title": "Heat Advisory",
        "description": "Temperatures reaching 90-95°F with high humidity. Stay hydrated and seek shade.",
        "severity": "minor",
        "category": "weather",
        "location_name": "Leeward Oahu",
        "latitude": 21.3099,
        "longitude": -158.0838,
        "radius_miles": 12,
        "affected_counties": ["Honolulu County"],
        "created_at": datetime.utcnow().isoformat(),
        "expires_at": (datetime.utcnow() + timedelta(hours=8)).isoformat(),
        "is_active": True,
        "source": "NWS"
    }
]

@router.get("/demo")
async def get_demo_alerts(
    skip: int = 0,
    limit: int = 20,
    active_only: bool = True
):
    """Get demo alerts for testing when database is unavailable"""
    
    alerts = DEMO_ALERTS if active_only else DEMO_ALERTS
    
    return {
        "alerts": alerts[skip:skip+limit],
        "total": len(alerts),
        "skip": skip,
        "limit": limit
    }

@router.get("/status")
async def get_alerts_status():
    """Check if alerts system is operational"""
    return {
        "status": "operational",
        "demo_mode": True,
        "total_alerts": len(DEMO_ALERTS),
        "last_sync": datetime.utcnow().isoformat(),
        "sources": ["NWS", "USGS", "NOAA"]
    }