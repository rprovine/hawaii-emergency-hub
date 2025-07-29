"""
Hawaii Volcano Monitoring
Monitors volcanic activity using USGS data and earthquake patterns
"""
import httpx
import logging
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
import asyncio
import re

from app.core.config import settings
from app.models.models import Alert, AlertSeverity, AlertCategory
from app.core.database import SessionLocal

logger = logging.getLogger(__name__)

class HawaiiVolcanoMonitor:
    """Monitor volcanic activity in Hawaii"""
    
    def __init__(self):
        # Hawaii's active volcanoes
        self.volcanoes = {
            "kilauea": {
                "name": "Kilauea",
                "lat": 19.4069,
                "lon": -155.2834,
                "usgs_id": "1302251",
                "counties": ["Hawaii County"]
            },
            "mauna_loa": {
                "name": "Mauna Loa", 
                "lat": 19.4721,
                "lon": -155.5922,
                "usgs_id": "1302241",
                "counties": ["Hawaii County"]
            },
            "hualalai": {
                "name": "Hualalai",
                "lat": 19.6920,
                "lon": -155.8700,
                "usgs_id": "1302261",
                "counties": ["Hawaii County"]
            },
            "haleakala": {
                "name": "Haleakala",
                "lat": 20.7097,
                "lon": -156.2533,
                "usgs_id": "1302281",
                "counties": ["Maui County"]
            },
            "mauna_kea": {
                "name": "Mauna Kea",
                "lat": 19.8207,
                "lon": -155.4680,
                "usgs_id": "1302231",
                "counties": ["Hawaii County"]
            }
        }
        
        # Alert levels
        self.alert_levels = {
            "GREEN": {"severity": AlertSeverity.MINOR, "description": "Normal"},
            "YELLOW": {"severity": AlertSeverity.MODERATE, "description": "Advisory"},
            "ORANGE": {"severity": AlertSeverity.SEVERE, "description": "Watch"},
            "RED": {"severity": AlertSeverity.EXTREME, "description": "Warning"}
        }
        
    async def check_volcano_status(self) -> List[Dict[str, Any]]:
        """Check current status of Hawaii volcanoes"""
        volcano_alerts = []
        
        async with httpx.AsyncClient() as client:
            for volcano_id, volcano_info in self.volcanoes.items():
                try:
                    # Check USGS volcano status page
                    url = f"https://www.usgs.gov/volcanoes/kilauea/volcano-updates"
                    response = await client.get(url, timeout=30.0)
                    
                    if response.status_code == 200:
                        # Parse for alert level (simplified - in production would use proper parsing)
                        content = response.text.upper()
                        
                        current_level = "GREEN"  # Default
                        if "ALERT LEVEL: RED" in content or "WARNING" in content:
                            current_level = "RED"
                        elif "ALERT LEVEL: ORANGE" in content or "WATCH" in content:
                            current_level = "ORANGE"
                        elif "ALERT LEVEL: YELLOW" in content or "ADVISORY" in content:
                            current_level = "YELLOW"
                            
                        # Only create alert if not normal
                        if current_level != "GREEN":
                            volcano_alerts.append({
                                "volcano": volcano_info,
                                "alert_level": current_level,
                                "timestamp": datetime.utcnow()
                            })
                            
                except Exception as e:
                    logger.error(f"Error checking volcano {volcano_info['name']}: {e}")
                    
        return volcano_alerts
    
    async def check_volcanic_earthquakes(self) -> List[Dict[str, Any]]:
        """Check for earthquake swarms near volcanoes (indicates activity)"""
        volcanic_activity = []
        
        # Import the earthquake client to check for swarms
        from .usgs_earthquake_api import usgs_earthquake_client
        
        try:
            # Get recent earthquakes
            earthquakes = await usgs_earthquake_client.fetch_earthquakes("day")
            
            for volcano_id, volcano_info in self.volcanoes.items():
                # Count earthquakes within 10km of volcano
                nearby_quakes = []
                for quake in earthquakes:
                    coords = quake.get("geometry", {}).get("coordinates", [])
                    if len(coords) >= 2:
                        lon, lat = coords[0], coords[1]
                        # Simple distance check (approximation)
                        lat_diff = abs(lat - volcano_info["lat"])
                        lon_diff = abs(lon - volcano_info["lon"])
                        if lat_diff < 0.1 and lon_diff < 0.1:  # ~10km
                            nearby_quakes.append(quake)
                            
                # If significant swarm detected
                if len(nearby_quakes) >= 10:  # 10+ quakes in a day
                    volcanic_activity.append({
                        "volcano": volcano_info,
                        "earthquake_count": len(nearby_quakes),
                        "alert_level": "YELLOW" if len(nearby_quakes) < 20 else "ORANGE",
                        "timestamp": datetime.utcnow()
                    })
                    
        except Exception as e:
            logger.error(f"Error checking volcanic earthquakes: {e}")
            
        return volcanic_activity
    
    async def generate_volcano_alerts(self) -> List[Alert]:
        """Generate alerts from volcano monitoring data"""
        alerts = []
        
        # Check volcano status
        status_alerts = await self.check_volcano_status()
        
        # Check earthquake activity
        earthquake_alerts = await self.check_volcanic_earthquakes()
        
        # Combine and create alerts
        all_volcano_data = {}
        
        # Process status alerts
        for status in status_alerts:
            volcano_name = status["volcano"]["name"]
            all_volcano_data[volcano_name] = status
            
        # Process earthquake alerts
        for eq_alert in earthquake_alerts:
            volcano_name = eq_alert["volcano"]["name"]
            if volcano_name in all_volcano_data:
                # Upgrade alert level if earthquake activity is higher
                current_level = all_volcano_data[volcano_name]["alert_level"]
                eq_level = eq_alert["alert_level"]
                if self.alert_levels[eq_level]["severity"].value > self.alert_levels[current_level]["severity"].value:
                    all_volcano_data[volcano_name]["alert_level"] = eq_level
                all_volcano_data[volcano_name]["earthquake_count"] = eq_alert["earthquake_count"]
            else:
                all_volcano_data[volcano_name] = eq_alert
                
        # Create alerts
        for volcano_name, data in all_volcano_data.items():
            volcano_info = data["volcano"]
            alert_level = data["alert_level"]
            level_info = self.alert_levels[alert_level]
            
            description = f"{volcano_info['name']} is at {level_info['description']} level. "
            if "earthquake_count" in data:
                description += f"{data['earthquake_count']} earthquakes detected near the volcano in the last 24 hours. "
                
            if alert_level == "RED":
                description += "ERUPTION IMMINENT OR IN PROGRESS. Follow evacuation orders immediately."
            elif alert_level == "ORANGE":
                description += "Increased volcanic activity detected. Be prepared to evacuate if conditions worsen."
            elif alert_level == "YELLOW":
                description += "Elevated volcanic unrest. Stay informed and be prepared."
                
            alert = Alert(
                external_id=f"volcano_{volcano_info['name'].lower()}_{datetime.utcnow().strftime('%Y%m%d')}",
                title=f"Volcano Alert: {volcano_info['name']} - {level_info['description']}",
                description=description,
                severity=level_info["severity"],
                category=AlertCategory.VOLCANO,
                location_name=f"{volcano_info['name']} Volcano",
                latitude=volcano_info["lat"],
                longitude=volcano_info["lon"],
                radius_miles=50 if alert_level in ["ORANGE", "RED"] else 25,
                affected_counties=volcano_info["counties"],
                effective_time=datetime.utcnow(),
                expires_time=datetime.utcnow() + timedelta(hours=24),
                source="USGS Hawaiian Volcano Observatory",
                source_url="https://www.usgs.gov/volcanoes/kilauea",
                alert_metadata={
                    "volcano_name": volcano_info["name"],
                    "alert_level": alert_level,
                    "earthquake_count": data.get("earthquake_count", 0),
                    "usgs_volcano_id": volcano_info["usgs_id"]
                },
                is_active=True,
                is_test=False
            )
            
            alerts.append(alert)
            
        return alerts
    
    async def sync_volcano_alerts(self):
        """Sync volcano alerts to database"""
        logger.info("Starting volcano monitoring sync...")
        
        try:
            alerts = await self.generate_volcano_alerts()
            logger.info(f"Generated {len(alerts)} volcano alerts")
            
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
                logger.info(f"Successfully synced {len(alerts)} volcano alerts")
                
            finally:
                db.close()
                
        except Exception as e:
            logger.error(f"Error syncing volcano alerts: {e}")

# Create singleton instance
volcano_monitor = HawaiiVolcanoMonitor()