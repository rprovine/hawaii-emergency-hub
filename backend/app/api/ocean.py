from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional, List

from app.core.database import get_db
from app.core.auth import get_current_user
from app.models.models import User
from app.services.ocean_safety_service import OceanSafetyService

router = APIRouter()

@router.get("/conditions")
async def get_ocean_conditions(
    island: Optional[str] = Query(None, description="Filter by island"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get current ocean conditions from all monitoring stations"""
    
    # Fetch latest ocean conditions
    conditions = await OceanSafetyService.fetch_ocean_conditions()
    
    # Filter by island if specified
    if island:
        conditions = [c for c in conditions if c.get("island", "").lower() == island.lower()]
    
    # Check if any conditions warrant alerts
    alerts = OceanSafetyService.create_ocean_safety_alerts(db, conditions)
    
    return {
        "conditions": conditions,
        "alerts_created": len(alerts),
        "last_updated": conditions[0]["timestamp"] if conditions else None
    }

@router.get("/beaches")
async def list_beaches(
    island: Optional[str] = Query(None, description="Filter by island"),
    current_user: User = Depends(get_current_user)
):
    """List monitored beaches"""
    
    beaches = []
    for name, info in OceanSafetyService.POPULAR_BEACHES.items():
        if not island or info["island"].lower() == island.lower():
            beaches.append({
                "name": name,
                "island": info["island"],
                "coordinates": {
                    "lat": info["lat"],
                    "lng": info["lng"]
                }
            })
    
    return {"beaches": beaches}

@router.get("/beaches/{beach_name}")
async def get_beach_conditions(
    beach_name: str,
    current_user: User = Depends(get_current_user)
):
    """Get detailed conditions for a specific beach"""
    
    conditions = OceanSafetyService.get_beach_conditions(beach_name)
    if not conditions:
        raise HTTPException(status_code=404, detail="Beach not found")
    
    return conditions

@router.get("/tides/{location}")
async def get_tide_data(
    location: str,
    current_user: User = Depends(get_current_user)
):
    """Get tide information for a location"""
    
    tide_data = OceanSafetyService.get_tide_data(location)
    return tide_data

@router.get("/safety-tips")
async def get_ocean_safety_tips(
    conditions: Optional[str] = Query(None, description="Current conditions (calm, moderate, rough)"),
    activity: Optional[str] = Query(None, description="Activity (swimming, surfing, snorkeling)"),
    current_user: User = Depends(get_current_user)
):
    """Get ocean safety tips based on conditions and activity"""
    
    tips = {
        "general": [
            "Never turn your back on the ocean",
            "Always swim near a lifeguard when possible",
            "Check conditions before entering the water",
            "Know your limits and stay within them",
            "Watch for warning flags and signs"
        ],
        "rip_currents": [
            "Look for channels of churning, choppy water",
            "If caught, swim parallel to shore until free",
            "Don't panic - rip currents won't pull you under",
            "Wave or call for help if needed"
        ],
        "high_surf": [
            "Stay out of the water during high surf warnings",
            "Even experienced swimmers can be overwhelmed",
            "Watch waves from a safe distance",
            "Be aware of wave sets - they come in groups"
        ],
        "marine_life": [
            "Shuffle your feet when walking in shallow water",
            "Avoid touching coral or unknown marine life",
            "Exit water if sharks or jellyfish are spotted",
            "Seek immediate help for any marine stings or bites"
        ]
    }
    
    # Add activity-specific tips
    activity_tips = {
        "swimming": [
            "Enter water feet first to check depth",
            "Swim with a buddy when possible",
            "Stay hydrated - ocean swimming is tiring"
        ],
        "surfing": [
            "Know the break before paddling out",
            "Respect local surf etiquette",
            "Use appropriate board leash",
            "Check forecast and tide charts"
        ],
        "snorkeling": [
            "Test equipment in shallow water first",
            "Stay aware of currents and your position",
            "Use reef-safe sunscreen",
            "Don't touch or stand on coral"
        ]
    }
    
    response = {"general_safety": tips["general"]}
    
    if conditions == "rough":
        response["condition_tips"] = tips["high_surf"] + tips["rip_currents"]
    elif conditions == "moderate":
        response["condition_tips"] = tips["rip_currents"]
    
    if activity and activity in activity_tips:
        response["activity_tips"] = activity_tips[activity]
    
    response["emergency"] = {
        "number": "911",
        "ocean_safety": "808-723-7873",
        "poison_control": "1-800-222-1222"
    }
    
    return response

@router.get("/surf-report")
async def get_surf_report(
    island: Optional[str] = Query(None, description="Filter by island"),
    spot: Optional[str] = Query(None, description="Specific surf spot"),
    current_user: User = Depends(get_current_user)
):
    """Get current surf report"""
    
    # Simulated surf report data
    # In production, would integrate with Surfline or similar API
    surf_report = {
        "oahu": {
            "north_shore": {
                "height": "6-8ft",
                "conditions": "Clean",
                "wind": "Light offshore",
                "tide": "Incoming",
                "spots": {
                    "pipeline": {"height": "8-10ft", "crowd": "Heavy", "skill": "Expert"},
                    "sunset": {"height": "6-8ft", "crowd": "Moderate", "skill": "Advanced"},
                    "waimea": {"height": "10-12ft", "crowd": "Light", "skill": "Expert"}
                }
            },
            "south_shore": {
                "height": "2-3ft",
                "conditions": "Fair",
                "wind": "Light onshore",
                "tide": "High",
                "spots": {
                    "waikiki": {"height": "2-3ft", "crowd": "Heavy", "skill": "Beginner"},
                    "ala_moana": {"height": "2-4ft", "crowd": "Moderate", "skill": "Intermediate"}
                }
            }
        },
        "maui": {
            "north_shore": {
                "height": "4-6ft",
                "conditions": "Good",
                "wind": "Side offshore",
                "spots": {
                    "hookipa": {"height": "4-6ft", "crowd": "Moderate", "skill": "Advanced"},
                    "honolua": {"height": "3-5ft", "crowd": "Light", "skill": "Intermediate"}
                }
            }
        }
    }
    
    if island:
        island_data = surf_report.get(island.lower())
        if not island_data:
            raise HTTPException(status_code=404, detail="Island not found")
        
        if spot:
            for shore, data in island_data.items():
                if "spots" in data and spot.lower() in data["spots"]:
                    return {
                        "spot": spot,
                        "shore": shore,
                        **data["spots"][spot.lower()],
                        "general_conditions": {
                            "wind": data.get("wind"),
                            "tide": data.get("tide")
                        }
                    }
            raise HTTPException(status_code=404, detail="Surf spot not found")
        
        return {"island": island, "report": island_data}
    
    return {"surf_report": surf_report}

@router.get("/jellyfish-calendar")
async def get_jellyfish_calendar(
    month: Optional[int] = Query(None, ge=1, le=12, description="Month (1-12)"),
    current_user: User = Depends(get_current_user)
):
    """Get box jellyfish arrival predictions"""
    
    from datetime import datetime, timedelta
    
    # Box jellyfish typically arrive 8-10 days after full moon
    # This is simplified - in production would use lunar calendar API
    current_date = datetime.now()
    month = month or current_date.month
    
    # Approximate full moon dates for 2024
    full_moons_2024 = {
        1: 25, 2: 24, 3: 25, 4: 23, 5: 23, 6: 22,
        7: 21, 8: 19, 9: 18, 10: 17, 11: 15, 12: 15
    }
    
    if month in full_moons_2024:
        full_moon_day = full_moons_2024[month]
        arrival_start = full_moon_day + 8
        arrival_end = full_moon_day + 10
        
        # Handle month overflow
        if arrival_start > 28:  # Simplified
            arrival_start = arrival_start - 28
            arrival_end = arrival_end - 28
            warning_month = month + 1 if month < 12 else 1
        else:
            warning_month = month
        
        return {
            "month": month,
            "full_moon_day": full_moon_day,
            "jellyfish_warning_days": list(range(arrival_start, arrival_end + 1)),
            "warning_beaches": [
                "Waikiki Beach",
                "Ala Moana Beach Park",
                "Hanauma Bay",
                "Lanikai Beach",
                "Kailua Beach"
            ],
            "safety_tips": [
                "Avoid ocean 8-10 days after full moon",
                "Look for warning signs posted at beaches",
                "Wear protective clothing if entering water",
                "Have vinegar available for stings",
                "Seek immediate medical attention for severe reactions"
            ]
        }
    
    return {"error": "Jellyfish calendar data not available for this month"}