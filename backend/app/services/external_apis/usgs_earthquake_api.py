"""
USGS Earthquake API Integration
Fetches earthquake data for Hawaii region
"""
import httpx
import logging
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
import asyncio

from app.core.config import settings
from app.models.models import Alert, AlertSeverity, AlertCategory
from app.core.database import SessionLocal

logger = logging.getLogger(__name__)

class USGSEarthquakeAPIClient:
    """Client for fetching earthquake data from USGS API"""
    
    def __init__(self):
        self.base_url = settings.USGS_API_URL
        # Hawaii bounding box
        self.min_latitude = 18.5
        self.max_latitude = 22.5
        self.min_longitude = -161.0
        self.max_longitude = -154.5
        
    async def fetch_earthquakes(self, time_range: str = "hour") -> List[Dict[str, Any]]:
        """
        Fetch earthquakes for Hawaii region
        time_range: 'hour', 'day', 'week', 'month'
        """
        earthquakes = []
        
        # Different magnitude thresholds for different time ranges
        magnitude_endpoints = {
            "hour": "all",      # All magnitudes in last hour
            "day": "2.5",       # M2.5+ in last day
            "week": "4.5",      # M4.5+ in last week
            "month": "significant"  # Significant quakes in last month
        }
        
        endpoint = magnitude_endpoints.get(time_range, "2.5")
        
        async with httpx.AsyncClient() as client:
            try:
                url = f"{self.base_url}{endpoint}_{time_range}.geojson"
                response = await client.get(
                    url,
                    timeout=30.0,
                    params={
                        "minlatitude": self.min_latitude,
                        "maxlatitude": self.max_latitude,
                        "minlongitude": self.min_longitude,
                        "maxlongitude": self.max_longitude
                    }
                )
                response.raise_for_status()
                data = response.json()
                
                if "features" in data:
                    # Filter for Hawaii region (API params don't always work perfectly)
                    for feature in data["features"]:
                        coords = feature.get("geometry", {}).get("coordinates", [])
                        if len(coords) >= 2:
                            lon, lat = coords[0], coords[1]
                            if (self.min_latitude <= lat <= self.max_latitude and 
                                self.min_longitude <= lon <= self.max_longitude):
                                earthquakes.append(feature)
                                
            except Exception as e:
                logger.error(f"Error fetching USGS earthquakes: {e}")
                
        return earthquakes
    
    def _map_magnitude_to_severity(self, magnitude: float) -> AlertSeverity:
        """Map earthquake magnitude to alert severity"""
        if magnitude >= 7.0:
            return AlertSeverity.EXTREME
        elif magnitude >= 6.0:
            return AlertSeverity.SEVERE
        elif magnitude >= 5.0:
            return AlertSeverity.MODERATE
        else:
            return AlertSeverity.MINOR
            
    def _calculate_radius(self, magnitude: float) -> int:
        """Calculate affected radius based on magnitude"""
        # Rough approximation of affected area
        if magnitude >= 7.0:
            return 200
        elif magnitude >= 6.0:
            return 100
        elif magnitude >= 5.0:
            return 50
        elif magnitude >= 4.0:
            return 25
        else:
            return 10
            
    def _get_location_description(self, properties: Dict[str, Any], lat: float, lon: float) -> str:
        """Get human-readable location description"""
        place = properties.get("place", "")
        
        # Determine which island based on coordinates
        island = "Hawaii"
        if 20.5 <= lat <= 21.5 and -158.5 <= lon <= -157.5:
            island = "Oahu"
        elif 20.5 <= lat <= 21.3 and -157.0 <= lon <= -156.0:
            island = "Maui"
        elif 21.8 <= lat <= 22.3 and -160.0 <= lon <= -159.0:
            island = "Kauai"
        elif 18.9 <= lat <= 20.3 and -156.1 <= lon <= -154.8:
            island = "Big Island"
            
        if place:
            return f"{place} - {island}"
        else:
            return f"Near {island}"
            
    def _determine_affected_counties(self, lat: float, lon: float) -> List[str]:
        """Determine affected counties based on coordinates"""
        counties = []
        
        # Simple geographic boundaries for Hawaii counties
        if 18.9 <= lat <= 20.3 and -156.1 <= lon <= -154.8:
            counties.append("Hawaii County")
        if 20.5 <= lat <= 21.5 and -158.5 <= lon <= -157.5:
            counties.append("Honolulu County")
        if 20.5 <= lat <= 21.3 and -157.0 <= lon <= -156.0:
            counties.append("Maui County")
            if 20.7 <= lat <= 21.0:
                counties.append("Kalawao County")  # Molokai
        if 21.8 <= lat <= 22.3 and -160.0 <= lon <= -159.0:
            counties.append("Kauai County")
            
        return counties if counties else ["Hawaii County"]
    
    async def convert_to_alerts(self, earthquakes: List[Dict[str, Any]]) -> List[Alert]:
        """Convert USGS earthquake data to our Alert model"""
        alerts = []
        
        for feature in earthquakes:
            try:
                props = feature.get("properties", {})
                coords = feature.get("geometry", {}).get("coordinates", [])
                
                if len(coords) < 2:
                    continue
                    
                lon, lat, depth = coords[0], coords[1], coords[2] if len(coords) > 2 else 0
                magnitude = props.get("mag", 0)
                
                # Skip very small earthquakes
                if magnitude < 2.5:
                    continue
                    
                # Create alert
                alert_time = datetime.fromtimestamp(props.get("time", 0) / 1000)
                
                # Earthquakes are instant events, but we'll keep alert active for a period
                if magnitude >= 6.0:
                    expires_hours = 24  # Major quakes stay active longer
                elif magnitude >= 5.0:
                    expires_hours = 12
                else:
                    expires_hours = 6
                    
                alert = Alert(
                    external_id=f"usgs_eq_{props.get('code', props.get('id', ''))}",
                    title=f"M{magnitude} Earthquake - {props.get('place', 'Hawaii')}",
                    description=f"A magnitude {magnitude} earthquake occurred at {alert_time.strftime('%I:%M %p')} "
                              f"at a depth of {depth:.1f} km. {props.get('alert', '').upper() if props.get('alert') else ''} "
                              f"alert level. Felt reports: {props.get('felt', 0)}. "
                              f"{'TSUNAMI POTENTIAL' if magnitude >= 7.0 and depth < 100 else 'No tsunami expected.'}",
                    severity=self._map_magnitude_to_severity(magnitude),
                    category=AlertCategory.EARTHQUAKE,
                    location_name=self._get_location_description(props, lat, lon),
                    latitude=lat,
                    longitude=lon,
                    radius_miles=self._calculate_radius(magnitude),
                    affected_counties=self._determine_affected_counties(lat, lon),
                    effective_time=alert_time,
                    expires_time=alert_time + timedelta(hours=expires_hours),
                    source="USGS Earthquake Hazards Program",
                    source_url=props.get("url", ""),
                    alert_metadata={
                        "magnitude": magnitude,
                        "depth_km": depth,
                        "felt_reports": props.get("felt", 0),
                        "alert_level": props.get("alert"),
                        "significance": props.get("sig", 0),
                        "network": props.get("net"),
                        "shake_map": props.get("detail"),
                        "tsunami": props.get("tsunami", 0),
                        "event_type": props.get("type", "earthquake")
                    },
                    is_active=True,
                    is_test=False
                )
                
                alerts.append(alert)
                
            except Exception as e:
                logger.error(f"Error converting USGS earthquake: {e}")
                continue
                
        return alerts

    async def sync_earthquakes(self):
        """Sync earthquake data to database"""
        logger.info("Starting USGS earthquake sync...")
        
        try:
            all_alerts = []
            
            # Fetch different time ranges
            for time_range in ["hour", "day"]:
                earthquakes = await self.fetch_earthquakes(time_range)
                alerts = await self.convert_to_alerts(earthquakes)
                all_alerts.extend(alerts)
                
            # Remove duplicates based on external_id
            unique_alerts = {alert.external_id: alert for alert in all_alerts}
            alerts = list(unique_alerts.values())
            
            logger.info(f"Fetched {len(alerts)} unique earthquakes from USGS")
            
            # Save to database
            db = SessionLocal()
            try:
                for alert in alerts:
                    # Check if alert already exists
                    existing = db.query(Alert).filter(
                        Alert.external_id == alert.external_id
                    ).first()
                    
                    if existing:
                        # Update existing alert
                        for key, value in alert.__dict__.items():
                            if not key.startswith('_'):
                                setattr(existing, key, value)
                        existing.updated_at = datetime.utcnow()
                    else:
                        # Add new alert
                        db.add(alert)
                        
                db.commit()
                logger.info(f"Successfully synced {len(alerts)} USGS earthquake alerts")
                
            finally:
                db.close()
                
        except Exception as e:
            logger.error(f"Error syncing USGS earthquakes: {e}")

# Create singleton instance
usgs_earthquake_client = USGSEarthquakeAPIClient()