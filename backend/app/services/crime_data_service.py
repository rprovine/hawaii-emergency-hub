import logging
import httpx
from typing import Dict, List, Optional
from datetime import datetime, timezone, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import and_

from app.models.models import Alert, AlertCategory, AlertSeverity

logger = logging.getLogger(__name__)


class CrimeDataService:
    """Service for fetching and processing crime data"""
    
    # Hawaii Police Department jurisdictions
    POLICE_DEPARTMENTS = {
        "HPD": {
            "name": "Honolulu Police Department",
            "island": "Oahu",
            "api_endpoint": "https://data.honolulu.gov/resource/",  # Open data portal
            "coverage": ["Honolulu County"]
        },
        "MPD": {
            "name": "Maui Police Department", 
            "island": "Maui",
            "coverage": ["Maui County", "Molokai", "Lanai"]
        },
        "KPD": {
            "name": "Kauai Police Department",
            "island": "Kauai", 
            "coverage": ["Kauai County"]
        },
        "HPD-BI": {
            "name": "Hawaii Police Department",
            "island": "Big Island",
            "coverage": ["Hawaii County"]
        }
    }
    
    # Crime type mapping to severity
    CRIME_SEVERITY_MAP = {
        "homicide": AlertSeverity.EXTREME,
        "shooting": AlertSeverity.EXTREME,
        "armed_robbery": AlertSeverity.SEVERE,
        "assault": AlertSeverity.SEVERE,
        "robbery": AlertSeverity.SEVERE,
        "burglary": AlertSeverity.MODERATE,
        "theft": AlertSeverity.MINOR,
        "vandalism": AlertSeverity.MINOR
    }
    
    @staticmethod
    async def fetch_crime_data() -> List[Dict]:
        """Fetch recent crime data from available sources"""
        crime_incidents = []
        
        try:
            async with httpx.AsyncClient() as client:
                # Fetch from Honolulu Open Data (real endpoint)
                # This would connect to actual crime data APIs
                try:
                    # Example: Honolulu has an open data portal
                    # In production, would use actual API endpoints
                    response = await client.get(
                        "https://data.honolulu.gov/resource/pka4-quqb.json",
                        params={
                            "$limit": 100,
                            "$order": "date DESC",
                            "$where": f"date > '{(datetime.now() - timedelta(days=1)).isoformat()}'"
                        },
                        timeout=10.0
                    )
                    
                    if response.status_code == 200:
                        data = response.json()
                        for incident in data:
                            crime_incidents.append(
                                CrimeDataService._parse_honolulu_incident(incident)
                            )
                except Exception as e:
                    logger.error(f"Error fetching Honolulu crime data: {e}")
                
                # For other counties, would add similar API calls
                # For now, add simulated recent incidents
                crime_incidents.extend(CrimeDataService._get_simulated_incidents())
                
        except Exception as e:
            logger.error(f"Error fetching crime data: {e}")
        
        return crime_incidents
    
    @staticmethod
    def _parse_honolulu_incident(raw_incident: Dict) -> Dict:
        """Parse Honolulu crime incident data"""
        # Map fields from actual API response
        return {
            "id": raw_incident.get("incident_number", ""),
            "type": raw_incident.get("type", "unknown"),
            "description": raw_incident.get("description", ""),
            "location": raw_incident.get("location", ""),
            "latitude": float(raw_incident.get("latitude", 0)),
            "longitude": float(raw_incident.get("longitude", 0)),
            "date": raw_incident.get("date", ""),
            "time": raw_incident.get("time", ""),
            "county": "Honolulu County",
            "source": "HPD"
        }
    
    @staticmethod
    def _get_simulated_incidents() -> List[Dict]:
        """Get simulated crime incidents for demonstration"""
        # In production, this would be replaced with real API calls
        current_time = datetime.now(timezone.utc)
        
        return [
            {
                "id": "HPD-2024-001",
                "type": "burglary",
                "description": "Commercial burglary reported",
                "location": "Ala Moana Center",
                "latitude": 21.2914,
                "longitude": -157.8437,
                "date": current_time.isoformat(),
                "county": "Honolulu County",
                "source": "HPD"
            },
            {
                "id": "MPD-2024-002", 
                "type": "assault",
                "description": "Assault incident, suspect in custody",
                "location": "Lahaina Harbor",
                "latitude": 20.8725,
                "longitude": -156.6767,
                "date": (current_time - timedelta(hours=2)).isoformat(),
                "county": "Maui County",
                "source": "MPD"
            }
        ]
    
    @staticmethod
    def create_crime_alerts(
        db: Session,
        incidents: List[Dict]
    ) -> List[Alert]:
        """Create alerts from crime incidents"""
        alerts = []
        
        for incident in incidents:
            # Skip if already exists
            existing = db.query(Alert).filter(
                Alert.external_id == f"crime_{incident['id']}"
            ).first()
            
            if existing:
                continue
            
            # Determine severity
            crime_type = incident.get("type", "").lower()
            severity = AlertSeverity.MODERATE  # Default
            
            for key, sev in CrimeDataService.CRIME_SEVERITY_MAP.items():
                if key in crime_type:
                    severity = sev
                    break
            
            # Create alert
            alert = Alert(
                external_id=f"crime_{incident['id']}",
                title=f"Crime Alert - {incident.get('type', 'Incident').title()}",
                description=f"{incident.get('description', 'Crime incident reported')} at {incident.get('location', 'Unknown location')}",
                severity=severity,
                category=AlertCategory.SECURITY,
                location_name=incident.get("location", ""),
                latitude=incident.get("latitude"),
                longitude=incident.get("longitude"),
                radius_miles=0.5,  # Small radius for specific incidents
                affected_counties=[incident.get("county")] if incident.get("county") else [],
                effective_time=datetime.fromisoformat(incident.get("date", datetime.now(timezone.utc).isoformat())),
                expires_time=datetime.now(timezone.utc) + timedelta(hours=24),  # Expire after 24 hours
                source=f"Crime Data - {incident.get('source', 'Unknown')}",
                metadata=incident
            )
            
            db.add(alert)
            alerts.append(alert)
        
        if alerts:
            db.commit()
            logger.info(f"Created {len(alerts)} crime alerts")
        
        return alerts
    
    @staticmethod
    def get_crime_statistics(
        db: Session,
        county: Optional[str] = None,
        days: int = 7
    ) -> Dict:
        """Get crime statistics for a given period"""
        since = datetime.now(timezone.utc) - timedelta(days=days)
        
        query = db.query(Alert).filter(
            and_(
                Alert.category == AlertCategory.SECURITY,
                Alert.created_at >= since
            )
        )
        
        if county:
            query = query.filter(Alert.affected_counties.contains([county]))
        
        alerts = query.all()
        
        # Calculate statistics
        stats = {
            "total_incidents": len(alerts),
            "by_type": {},
            "by_severity": {},
            "by_county": {},
            "by_day": {},
            "hotspots": []
        }
        
        # Count by type
        type_counts = {}
        severity_counts = {}
        county_counts = {}
        
        for alert in alerts:
            # Extract type from metadata or title
            crime_type = "unknown"
            if alert.metadata and "type" in alert.metadata:
                crime_type = alert.metadata["type"]
            
            type_counts[crime_type] = type_counts.get(crime_type, 0) + 1
            
            # Count by severity
            severity_counts[alert.severity] = severity_counts.get(alert.severity, 0) + 1
            
            # Count by county
            if alert.affected_counties:
                for county in alert.affected_counties:
                    county_counts[county] = county_counts.get(county, 0) + 1
        
        stats["by_type"] = type_counts
        stats["by_severity"] = severity_counts
        stats["by_county"] = county_counts
        
        # Identify hotspots (areas with multiple incidents)
        location_counts = {}
        for alert in alerts:
            if alert.location_name:
                location_counts[alert.location_name] = location_counts.get(alert.location_name, 0) + 1
        
        # Sort by count and get top 5
        hotspots = sorted(location_counts.items(), key=lambda x: x[1], reverse=True)[:5]
        stats["hotspots"] = [{"location": loc, "incidents": count} for loc, count in hotspots]
        
        return stats
    
    @staticmethod
    def get_nearby_crimes(
        db: Session,
        lat: float,
        lng: float,
        radius_miles: float = 1.0,
        hours: int = 24
    ) -> List[Dict]:
        """Get crimes near a specific location"""
        since = datetime.now(timezone.utc) - timedelta(hours=hours)
        
        # Get all recent crime alerts
        alerts = db.query(Alert).filter(
            and_(
                Alert.category == AlertCategory.SECURITY,
                Alert.created_at >= since
            )
        ).all()
        
        nearby_crimes = []
        
        for alert in alerts:
            if alert.latitude and alert.longitude:
                # Calculate distance (simplified - in production use proper geo calculations)
                distance = CrimeDataService._calculate_distance(
                    lat, lng, alert.latitude, alert.longitude
                )
                
                if distance <= radius_miles:
                    nearby_crimes.append({
                        "id": alert.id,
                        "type": alert.metadata.get("type") if alert.metadata else "unknown",
                        "description": alert.description,
                        "location": alert.location_name,
                        "distance_miles": round(distance, 2),
                        "time": alert.effective_time.isoformat(),
                        "severity": alert.severity
                    })
        
        # Sort by distance
        nearby_crimes.sort(key=lambda x: x["distance_miles"])
        
        return nearby_crimes
    
    @staticmethod
    def _calculate_distance(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
        """Calculate distance between two points in miles (simplified)"""
        # Haversine formula (simplified for small distances)
        import math
        
        R = 3959  # Earth's radius in miles
        
        lat1_rad = math.radians(lat1)
        lat2_rad = math.radians(lat2)
        dlat = math.radians(lat2 - lat1)
        dlng = math.radians(lng2 - lng1)
        
        a = math.sin(dlat/2)**2 + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(dlng/2)**2
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
        
        return R * c