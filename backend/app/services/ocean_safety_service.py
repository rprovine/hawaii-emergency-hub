import logging
import httpx
from typing import Dict, List, Optional
from datetime import datetime, timezone
from sqlalchemy.orm import Session

from app.models.models import Alert, AlertCategory, AlertSeverity

logger = logging.getLogger(__name__)


class OceanSafetyService:
    """Service for ocean and beach safety data"""
    
    # Hawaii beach locations with coordinates
    POPULAR_BEACHES = {
        "Waikiki Beach": {"lat": 21.2762, "lng": -157.8267, "island": "Oahu"},
        "Lanikai Beach": {"lat": 21.3933, "lng": -157.7144, "island": "Oahu"},
        "Sunset Beach": {"lat": 21.6794, "lng": -158.0417, "island": "Oahu"},
        "Pipeline": {"lat": 21.6653, "lng": -158.0533, "island": "Oahu"},
        "Hanauma Bay": {"lat": 21.2689, "lng": -157.6938, "island": "Oahu"},
        "Ka'anapali Beach": {"lat": 20.9244, "lng": -156.6946, "island": "Maui"},
        "Wailea Beach": {"lat": 20.6900, "lng": -156.4433, "island": "Maui"},
        "Big Beach": {"lat": 20.6320, "lng": -156.4487, "island": "Maui"},
        "Napili Bay": {"lat": 20.9942, "lng": -156.6678, "island": "Maui"},
        "Poipu Beach": {"lat": 21.8733, "lng": -159.4542, "island": "Kauai"},
        "Hanalei Bay": {"lat": 22.2035, "lng": -159.5043, "island": "Kauai"},
        "Tunnels Beach": {"lat": 22.2236, "lng": -159.5763, "island": "Kauai"},
        "Hapuna Beach": {"lat": 20.0044, "lng": -155.8242, "island": "Big Island"},
        "Punalu'u Black Sand": {"lat": 19.1359, "lng": -155.5044, "island": "Big Island"},
        "Green Sand Beach": {"lat": 18.9366, "lng": -155.6468, "island": "Big Island"}
    }
    
    @staticmethod
    async def fetch_ocean_conditions() -> List[Dict]:
        """Fetch current ocean conditions from NOAA"""
        conditions = []
        
        try:
            async with httpx.AsyncClient() as client:
                # NOAA Buoy Data - Hawaii stations
                hawaii_buoys = [
                    "51201",  # Waimea Bay, Oahu
                    "51202",  # Mokapu Point, Oahu
                    "51203",  # Kaneohe Bay, Oahu
                    "51204",  # Kahului Harbor, Maui
                    "51205",  # Hilo Bay, Big Island
                ]
                
                for buoy_id in hawaii_buoys:
                    try:
                        # Fetch latest buoy data
                        response = await client.get(
                            f"https://www.ndbc.noaa.gov/data/latest_obs/{buoy_id}.txt"
                        )
                        
                        if response.status_code == 200:
                            data = OceanSafetyService._parse_buoy_data(
                                buoy_id, response.text
                            )
                            if data:
                                conditions.append(data)
                    except Exception as e:
                        logger.error(f"Error fetching buoy {buoy_id}: {e}")
                
                # Also fetch surf forecast data
                surf_conditions = await OceanSafetyService._fetch_surf_forecast(client)
                conditions.extend(surf_conditions)
                
        except Exception as e:
            logger.error(f"Error fetching ocean conditions: {e}")
        
        return conditions
    
    @staticmethod
    def _parse_buoy_data(buoy_id: str, raw_data: str) -> Optional[Dict]:
        """Parse NOAA buoy data"""
        try:
            lines = raw_data.strip().split('\n')
            if len(lines) < 2:
                return None
            
            # Parse the data (format varies by buoy)
            # This is a simplified parser
            data_values = lines[1].split()
            
            buoy_info = {
                "51201": {"name": "Waimea Bay", "island": "Oahu"},
                "51202": {"name": "Mokapu Point", "island": "Oahu"},
                "51203": {"name": "Kaneohe Bay", "island": "Oahu"},
                "51204": {"name": "Kahului Harbor", "island": "Maui"},
                "51205": {"name": "Hilo Bay", "island": "Big Island"},
            }
            
            info = buoy_info.get(buoy_id, {"name": f"Buoy {buoy_id}", "island": "Hawaii"})
            
            # Extract wave height and period if available
            wave_height = None
            wave_period = None
            water_temp = None
            
            # Simple parsing - in production would be more robust
            if len(data_values) > 8:
                try:
                    wave_height = float(data_values[8]) * 3.28  # Convert meters to feet
                    wave_period = float(data_values[9])
                except:
                    pass
            
            if len(data_values) > 14:
                try:
                    water_temp = float(data_values[14]) * 9/5 + 32  # Convert C to F
                except:
                    pass
            
            return {
                "source": f"NOAA Buoy {buoy_id}",
                "location": info["name"],
                "island": info["island"],
                "wave_height_ft": round(wave_height, 1) if wave_height else None,
                "wave_period_sec": wave_period,
                "water_temp_f": round(water_temp, 1) if water_temp else None,
                "timestamp": datetime.now(timezone.utc).isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error parsing buoy data: {e}")
            return None
    
    @staticmethod
    async def _fetch_surf_forecast(client: httpx.AsyncClient) -> List[Dict]:
        """Fetch surf forecast data"""
        forecasts = []
        
        # Simulated surf forecast data - in production would use real API
        # Could integrate with Surfline API or similar services
        surf_spots = [
            {
                "name": "Pipeline",
                "island": "Oahu",
                "current_height": 8,
                "forecast": "6-8ft building to 10-12ft",
                "conditions": "Clean",
                "warning": "Dangerous conditions - experts only"
            },
            {
                "name": "Waikiki",
                "island": "Oahu",
                "current_height": 2,
                "forecast": "2-3ft steady",
                "conditions": "Good for beginners",
                "warning": None
            },
            {
                "name": "Honolua Bay",
                "island": "Maui",
                "current_height": 4,
                "forecast": "4-6ft",
                "conditions": "Fair",
                "warning": "Strong current on outgoing tide"
            }
        ]
        
        for spot in surf_spots:
            forecasts.append({
                "source": "Surf Forecast",
                "location": spot["name"],
                "island": spot["island"],
                "wave_height_ft": spot["current_height"],
                "forecast": spot["forecast"],
                "conditions": spot["conditions"],
                "warning": spot["warning"],
                "timestamp": datetime.now(timezone.utc).isoformat()
            })
        
        return forecasts
    
    @staticmethod
    def create_ocean_safety_alerts(
        db: Session,
        conditions: List[Dict]
    ) -> List[Alert]:
        """Create alerts based on ocean conditions"""
        alerts = []
        
        for condition in conditions:
            # Check for dangerous conditions
            wave_height = condition.get("wave_height_ft", 0)
            warning = condition.get("warning")
            
            if wave_height > 10 or warning:
                # Create high surf alert
                alert = Alert(
                    external_id=f"ocean_{condition['location']}_{datetime.now().timestamp()}",
                    title=f"High Surf Warning - {condition['location']}",
                    description=f"Wave heights of {wave_height}ft reported. {warning or 'Exercise extreme caution.'}",
                    severity=AlertSeverity.SEVERE if wave_height > 15 else AlertSeverity.MODERATE,
                    category=AlertCategory.MARINE,
                    location_name=condition['location'],
                    effective_time=datetime.now(timezone.utc),
                    source="Ocean Safety Monitor",
                    metadata=condition
                )
                
                # Set location if available
                beach_info = OceanSafetyService.POPULAR_BEACHES.get(condition['location'])
                if beach_info:
                    alert.latitude = beach_info["lat"]
                    alert.longitude = beach_info["lng"]
                    alert.radius_miles = 2
                
                db.add(alert)
                alerts.append(alert)
            
            # Check for dangerous currents
            if "strong current" in str(condition.get("warning", "")).lower():
                alert = Alert(
                    external_id=f"current_{condition['location']}_{datetime.now().timestamp()}",
                    title=f"Strong Current Warning - {condition['location']}",
                    description="Strong currents detected. Swimming not recommended.",
                    severity=AlertSeverity.MODERATE,
                    category=AlertCategory.MARINE,
                    location_name=condition['location'],
                    effective_time=datetime.now(timezone.utc),
                    source="Ocean Safety Monitor",
                    metadata=condition
                )
                
                beach_info = OceanSafetyService.POPULAR_BEACHES.get(condition['location'])
                if beach_info:
                    alert.latitude = beach_info["lat"]
                    alert.longitude = beach_info["lng"]
                    alert.radius_miles = 1
                
                db.add(alert)
                alerts.append(alert)
        
        if alerts:
            db.commit()
            logger.info(f"Created {len(alerts)} ocean safety alerts")
        
        return alerts
    
    @staticmethod
    def get_beach_conditions(beach_name: str) -> Optional[Dict]:
        """Get current conditions for a specific beach"""
        beach_info = OceanSafetyService.POPULAR_BEACHES.get(beach_name)
        if not beach_info:
            return None
        
        # In production, would fetch real-time data for specific beach
        # For now, return general conditions
        return {
            "beach": beach_name,
            "island": beach_info["island"],
            "coordinates": {
                "lat": beach_info["lat"],
                "lng": beach_info["lng"]
            },
            "conditions": {
                "surf_height": "2-4ft",
                "wind": "10-15mph E",
                "tide": "Rising",
                "water_temp": "78°F",
                "visibility": "Good",
                "hazards": ["Occasional strong current", "Portuguese man o' war reported"],
                "lifeguard": "On duty 9am-5pm"
            },
            "forecast": {
                "morning": "2-3ft clean",
                "afternoon": "3-4ft choppy",
                "tomorrow": "Building to 4-6ft"
            },
            "safety_rating": "Yellow - Caution",
            "updated": datetime.now(timezone.utc).isoformat()
        }
    
    @staticmethod
    def get_tide_data(location: str) -> Dict:
        """Get tide information for a location"""
        # In production, would use NOAA CO-OPS API
        # This is simulated data
        return {
            "location": location,
            "current_tide": "Rising",
            "next_high": {
                "time": "14:30",
                "height": "2.3ft"
            },
            "next_low": {
                "time": "20:45", 
                "height": "0.4ft"
            },
            "sunrise": "06:12",
            "sunset": "18:45"
        }