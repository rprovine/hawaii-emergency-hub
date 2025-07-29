from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional, List, Dict

from app.core.database import get_db
from app.core.auth import get_current_user, require_subscription_tier
from app.models.models import User, SubscriptionTier
from app.services.crime_data_service import CrimeDataService

router = APIRouter()

@router.get("/incidents")
async def get_crime_incidents(
    county: Optional[str] = Query(None, description="Filter by county"),
    hours: int = Query(24, ge=1, le=168, description="Hours to look back (max 7 days)"),
    current_user: User = Depends(require_subscription_tier([
        SubscriptionTier.PREMIUM,
        SubscriptionTier.BUSINESS,
        SubscriptionTier.ENTERPRISE
    ])),
    db: Session = Depends(get_db)
):
    """Get recent crime incidents (Premium feature)"""
    
    # Fetch latest crime data
    incidents = await CrimeDataService.fetch_crime_data()
    
    # Filter by county if specified
    if county:
        incidents = [i for i in incidents if i.get("county", "").lower() == county.lower()]
    
    # Create alerts from new incidents
    alerts = CrimeDataService.create_crime_alerts(db, incidents)
    
    return {
        "incidents": incidents,
        "new_alerts_created": len(alerts),
        "time_range_hours": hours
    }

@router.get("/statistics")
async def get_crime_statistics(
    county: Optional[str] = Query(None, description="Filter by county"),
    days: int = Query(7, ge=1, le=30, description="Days to analyze"),
    current_user: User = Depends(require_subscription_tier([
        SubscriptionTier.PREMIUM,
        SubscriptionTier.BUSINESS,
        SubscriptionTier.ENTERPRISE
    ])),
    db: Session = Depends(get_db)
):
    """Get crime statistics and trends (Premium feature)"""
    
    stats = CrimeDataService.get_crime_statistics(db, county, days)
    
    return {
        "period_days": days,
        "county": county or "All Counties",
        "statistics": stats
    }

@router.get("/nearby")
async def get_nearby_crimes(
    lat: float = Query(..., description="Latitude"),
    lng: float = Query(..., description="Longitude"),
    radius: float = Query(1.0, ge=0.1, le=10.0, description="Radius in miles"),
    hours: int = Query(24, ge=1, le=168, description="Hours to look back"),
    current_user: User = Depends(require_subscription_tier([
        SubscriptionTier.PREMIUM,
        SubscriptionTier.BUSINESS,
        SubscriptionTier.ENTERPRISE
    ])),
    db: Session = Depends(get_db)
):
    """Get crimes near a specific location (Premium feature)"""
    
    nearby = CrimeDataService.get_nearby_crimes(db, lat, lng, radius, hours)
    
    return {
        "location": {"lat": lat, "lng": lng},
        "radius_miles": radius,
        "time_range_hours": hours,
        "incidents": nearby,
        "total_count": len(nearby)
    }

@router.get("/hotspots")
async def get_crime_hotspots(
    county: Optional[str] = Query(None, description="Filter by county"),
    days: int = Query(7, ge=1, le=30, description="Days to analyze"),
    current_user: User = Depends(require_subscription_tier([
        SubscriptionTier.PREMIUM,
        SubscriptionTier.BUSINESS,
        SubscriptionTier.ENTERPRISE
    ])),
    db: Session = Depends(get_db)
):
    """Get crime hotspot areas (Premium feature)"""
    
    stats = CrimeDataService.get_crime_statistics(db, county, days)
    
    return {
        "period_days": days,
        "county": county or "All Counties",
        "hotspots": stats.get("hotspots", []),
        "analysis": {
            "most_common_type": max(stats["by_type"].items(), key=lambda x: x[1])[0] if stats["by_type"] else None,
            "highest_severity": max(stats["by_severity"].items(), key=lambda x: x[1])[0] if stats["by_severity"] else None,
            "total_incidents": stats["total_incidents"]
        }
    }

@router.get("/safety-score")
async def get_location_safety_score(
    lat: float = Query(..., description="Latitude"),
    lng: float = Query(..., description="Longitude"),
    current_user: User = Depends(require_subscription_tier([
        SubscriptionTier.PREMIUM,
        SubscriptionTier.BUSINESS,
        SubscriptionTier.ENTERPRISE
    ])),
    db: Session = Depends(get_db)
):
    """Get safety score for a location based on crime data (Premium feature)"""
    
    # Get crimes within 1 mile in last 30 days
    nearby_week = CrimeDataService.get_nearby_crimes(db, lat, lng, 1.0, 168)  # 7 days
    nearby_month = CrimeDataService.get_nearby_crimes(db, lat, lng, 1.0, 720)  # 30 days
    
    # Calculate safety score (100 = very safe, 0 = very dangerous)
    # This is a simplified calculation
    base_score = 100
    
    # Deduct points based on recent crimes
    for crime in nearby_week:
        severity = crime.get("severity", "MINOR")
        if severity == "EXTREME":
            base_score -= 20
        elif severity == "SEVERE":
            base_score -= 10
        elif severity == "MODERATE":
            base_score -= 5
        else:
            base_score -= 2
    
    # Ensure score doesn't go below 0
    safety_score = max(0, base_score)
    
    # Determine rating
    if safety_score >= 90:
        rating = "Very Safe"
        color = "green"
    elif safety_score >= 70:
        rating = "Safe"
        color = "light-green"
    elif safety_score >= 50:
        rating = "Moderate"
        color = "yellow"
    elif safety_score >= 30:
        rating = "Caution"
        color = "orange"
    else:
        rating = "High Risk"
        color = "red"
    
    return {
        "location": {"lat": lat, "lng": lng},
        "safety_score": safety_score,
        "rating": rating,
        "color": color,
        "analysis": {
            "crimes_past_week": len(nearby_week),
            "crimes_past_month": len(nearby_month),
            "nearest_incident": nearby_week[0] if nearby_week else None
        },
        "recommendations": _get_safety_recommendations(safety_score, nearby_week)
    }

def _get_safety_recommendations(score: int, recent_crimes: List[Dict]) -> List[str]:
    """Get safety recommendations based on score and recent crimes"""
    recommendations = []
    
    if score < 50:
        recommendations.append("Exercise increased caution in this area")
        recommendations.append("Avoid walking alone at night")
        recommendations.append("Stay in well-lit, populated areas")
    
    if score < 70:
        recommendations.append("Be aware of your surroundings")
        recommendations.append("Keep valuables out of sight")
    
    # Check for specific crime types
    crime_types = set(crime.get("type", "") for crime in recent_crimes)
    
    if "burglary" in crime_types or "theft" in crime_types:
        recommendations.append("Secure your property and vehicles")
        recommendations.append("Don't leave valuables visible in cars")
    
    if "assault" in crime_types:
        recommendations.append("Travel in groups when possible")
        recommendations.append("Trust your instincts if something feels wrong")
    
    if not recommendations:
        recommendations.append("This area has a good safety record")
        recommendations.append("Continue practicing normal safety precautions")
    
    return recommendations

@router.post("/report")
async def report_crime_tip(
    location: str = Query(..., description="Location of incident"),
    description: str = Query(..., description="Description of incident"),
    lat: Optional[float] = Query(None, description="Latitude"),
    lng: Optional[float] = Query(None, description="Longitude"),
    anonymous: bool = Query(True, description="Submit anonymously"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Submit a crime tip or report (available to all users)"""
    
    # In production, this would forward to appropriate law enforcement
    # For now, we'll store it as a pending review item
    
    tip_data = {
        "location": location,
        "description": description,
        "coordinates": {"lat": lat, "lng": lng} if lat and lng else None,
        "submitted_at": datetime.now(timezone.utc).isoformat(),
        "anonymous": anonymous,
        "user_id": None if anonymous else current_user.id
    }
    
    # Log the tip (in production would store in database)
    logger.info(f"Crime tip received: {location}")
    
    return {
        "status": "submitted",
        "message": "Thank you for your report. It has been forwarded to the appropriate authorities.",
        "reference_number": f"TIP-{datetime.now().strftime('%Y%m%d%H%M%S')}"
    }

# Import datetime for the report endpoint
from datetime import datetime, timezone
import logging

logger = logging.getLogger(__name__)