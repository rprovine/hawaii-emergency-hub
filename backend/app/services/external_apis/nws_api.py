"""
National Weather Service (NWS) API Integration
Fetches weather alerts, warnings, and watches for Hawaii
"""
import httpx
import logging
from typing import List, Dict, Any, Optional
from datetime import datetime
import asyncio

from app.core.config import settings
from app.models.models import Alert, AlertSeverity, AlertCategory, User
from app.core.database import SessionLocal

logger = logging.getLogger(__name__)

class NWSAPIClient:
    """Client for fetching alerts from National Weather Service API"""
    
    def __init__(self):
        self.base_url = settings.NWS_API_URL
        self.hawaii_zones = [
            "HIZ001", "HIZ002", "HIZ003", "HIZ004", "HIZ005",  # Big Island zones
            "HIZ006", "HIZ007", "HIZ008", "HIZ009", "HIZ010",  # Maui County zones
            "HIZ011", "HIZ012", "HIZ013", "HIZ014", "HIZ015",  # Oahu zones
            "HIZ016", "HIZ017", "HIZ018", "HIZ019", "HIZ020",  # Kauai zones
            "HIZ021", "HIZ022", "HIZ023", "HIZ024", "HIZ025",  # Marine zones
            "HIZ026", "HIZ027", "HIZ028", "HIZ029", "HIZ030"   # Additional zones
        ]
        self.hawaii_counties = {
            "HIC001": "Hawaii County",
            "HIC003": "Honolulu County", 
            "HIC005": "Kalawao County",
            "HIC007": "Kauai County",
            "HIC009": "Maui County"
        }
        
    async def fetch_alerts(self) -> List[Dict[str, Any]]:
        """Fetch all active alerts for Hawaii"""
        alerts = []
        
        async with httpx.AsyncClient() as client:
            try:
                # Fetch alerts for Hawaii state
                response = await client.get(
                    f"{self.base_url}alerts/active?area=HI",
                    timeout=30.0,
                    headers={"User-Agent": "Hawaii Emergency Hub"}
                )
                response.raise_for_status()
                data = response.json()
                
                if "features" in data:
                    alerts.extend(data["features"])
                    
            except Exception as e:
                logger.error(f"Error fetching NWS alerts: {e}")
                
        return alerts
    
    def _map_severity(self, nws_severity: str, nws_certainty: str) -> AlertSeverity:
        """Map NWS severity/certainty to our severity levels"""
        severity_map = {
            "Extreme": AlertSeverity.EXTREME,
            "Severe": AlertSeverity.SEVERE,
            "Moderate": AlertSeverity.MODERATE,
            "Minor": AlertSeverity.MINOR,
            "Unknown": AlertSeverity.MINOR
        }
        
        # Consider certainty as well
        if nws_certainty in ["Unlikely", "Possible"] and nws_severity != "Extreme":
            # Downgrade severity for uncertain events
            if severity_map.get(nws_severity, AlertSeverity.MINOR) == AlertSeverity.SEVERE:
                return AlertSeverity.MODERATE
            elif severity_map.get(nws_severity, AlertSeverity.MINOR) == AlertSeverity.MODERATE:
                return AlertSeverity.MINOR
                
        return severity_map.get(nws_severity, AlertSeverity.MINOR)
    
    def _map_category(self, event_type: str) -> AlertCategory:
        """Map NWS event types to our categories"""
        category_map = {
            # Weather
            "Hurricane Warning": AlertCategory.HURRICANE,
            "Hurricane Watch": AlertCategory.HURRICANE,
            "Tropical Storm Warning": AlertCategory.HURRICANE,
            "Tropical Storm Watch": AlertCategory.HURRICANE,
            "High Wind Warning": AlertCategory.WEATHER,
            "Wind Advisory": AlertCategory.WEATHER,
            "Severe Thunderstorm Warning": AlertCategory.WEATHER,
            "Severe Thunderstorm Watch": AlertCategory.WEATHER,
            
            # Flood
            "Flash Flood Warning": AlertCategory.FLOOD,
            "Flash Flood Watch": AlertCategory.FLOOD,
            "Flood Warning": AlertCategory.FLOOD,
            "Flood Advisory": AlertCategory.FLOOD,
            "Coastal Flood Warning": AlertCategory.FLOOD,
            
            # Fire
            "Red Flag Warning": AlertCategory.WILDFIRE,
            "Fire Weather Watch": AlertCategory.WILDFIRE,
            
            # Tsunami
            "Tsunami Warning": AlertCategory.TSUNAMI,
            "Tsunami Advisory": AlertCategory.TSUNAMI,
            "Tsunami Watch": AlertCategory.TSUNAMI,
            
            # Marine
            "High Surf Warning": AlertCategory.MARINE,
            "High Surf Advisory": AlertCategory.MARINE,
            "Small Craft Advisory": AlertCategory.MARINE,
            "Marine Weather Statement": AlertCategory.MARINE,
            
            # Other
            "Special Weather Statement": AlertCategory.OTHER,
            "Heat Advisory": AlertCategory.WEATHER,
            "Excessive Heat Warning": AlertCategory.WEATHER,
            "Dense Fog Advisory": AlertCategory.WEATHER,
        }
        
        return category_map.get(event_type, AlertCategory.OTHER)
    
    def _extract_coordinates(self, geometry: Dict[str, Any]) -> tuple:
        """Extract center coordinates from polygon geometry"""
        if not geometry or "coordinates" not in geometry:
            # Default to center of Hawaii
            return (20.7984, -156.3319)
            
        coords = geometry["coordinates"][0] if geometry["type"] == "Polygon" else geometry["coordinates"]
        
        # Calculate centroid
        if coords and len(coords) > 0:
            lats = [c[1] for c in coords if len(c) >= 2]
            lons = [c[0] for c in coords if len(c) >= 2]
            if lats and lons:
                return (sum(lats) / len(lats), sum(lons) / len(lons))
                
        return (20.7984, -156.3319)
    
    def _extract_affected_counties(self, properties: Dict[str, Any]) -> List[str]:
        """Extract affected counties from NWS alert properties"""
        counties = []
        
        # Check areaDesc field
        if "areaDesc" in properties:
            area_desc = properties["areaDesc"].upper()
            for county in ["HAWAII", "MAUI", "HONOLULU", "KAUAI", "KALAWAO"]:
                if county in area_desc:
                    counties.append(f"{county.title()} County")
        
        # Check geocode
        if "geocode" in properties:
            same_codes = properties["geocode"].get("SAME", [])
            for code in same_codes:
                if code in self.hawaii_counties:
                    counties.append(self.hawaii_counties[code])
                    
        # Remove duplicates
        return list(set(counties)) if counties else ["Hawaii County"]
    
    async def convert_to_alerts(self, nws_alerts: List[Dict[str, Any]]) -> List[Alert]:
        """Convert NWS API response to our Alert model"""
        alerts = []
        
        for feature in nws_alerts:
            try:
                props = feature.get("properties", {})
                geometry = feature.get("geometry", {})
                
                # Skip if not active
                if props.get("status") != "Actual":
                    continue
                    
                lat, lon = self._extract_coordinates(geometry)
                
                alert = Alert(
                    external_id=f"nws_{props.get('id', '')}",
                    title=props.get("headline", "Weather Alert"),
                    description=props.get("description", ""),
                    severity=self._map_severity(
                        props.get("severity", "Unknown"),
                        props.get("certainty", "Unknown")
                    ),
                    category=self._map_category(props.get("event", "")),
                    location_name=props.get("areaDesc", "Hawaii"),
                    latitude=lat,
                    longitude=lon,
                    radius_miles=50,  # Default radius for NWS alerts
                    affected_counties=self._extract_affected_counties(props),
                    effective_time=datetime.fromisoformat(
                        props.get("effective", datetime.utcnow().isoformat()).replace("Z", "+00:00")
                    ),
                    expires_time=datetime.fromisoformat(
                        props.get("expires", datetime.utcnow().isoformat()).replace("Z", "+00:00")
                    ),
                    source="National Weather Service",
                    source_url=props.get("@id", ""),
                    alert_metadata={
                        "event": props.get("event"),
                        "urgency": props.get("urgency"),
                        "certainty": props.get("certainty"),
                        "response": props.get("response"),
                        "instruction": props.get("instruction"),
                        "parameters": props.get("parameters", {})
                    },
                    is_active=True,
                    is_test=False
                )
                
                alerts.append(alert)
                
            except Exception as e:
                logger.error(f"Error converting NWS alert: {e}")
                continue
                
        return alerts

    async def sync_alerts(self):
        """Sync NWS alerts to database"""
        logger.info("Starting NWS alert sync...")
        
        try:
            # Fetch alerts from API
            nws_data = await self.fetch_alerts()
            alerts = await self.convert_to_alerts(nws_data)
            
            logger.info(f"Fetched {len(alerts)} alerts from NWS")
            
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
                        db.flush()  # Get ID before commit
                        
                        # Send notifications for new alerts
                        asyncio.create_task(self._send_notifications_for_alert(db, alert))
                        
                db.commit()
                logger.info(f"Successfully synced {len(alerts)} NWS alerts")
                
            finally:
                db.close()
                
        except Exception as e:
            logger.error(f"Error syncing NWS alerts: {e}")
    
    async def _send_notifications_for_alert(self, db, alert: Alert):
        """Send notifications to affected users for new alert"""
        try:
            from app.services.geo_service import GeoService
            from app.services.notification_service import NotificationService
            
            # Find affected users
            geo_service = GeoService()
            affected_users = geo_service.get_users_in_alert_area(db, alert, User)
            
            if affected_users:
                logger.info(f"Sending notifications to {len(affected_users)} users for alert {alert.id}")
                
                # Send notifications
                notification_service = NotificationService()
                await notification_service.send_alert_notifications(db, alert, affected_users)
            else:
                logger.info(f"No users affected by alert {alert.id}")
                
        except Exception as e:
            logger.error(f"Error sending notifications for alert {alert.id}: {e}")

# Create singleton instance
nws_client = NWSAPIClient()