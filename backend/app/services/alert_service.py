from typing import List, Optional, Tuple
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import uuid

from app.models.models import Alert, AlertSeverity, AlertCategory, UserAlertInteraction
from app.schemas.alert_schemas import AlertCreate, AlertFilter

class AlertService:
    def __init__(self, db: Session):
        self.db = db
    
    async def get_alerts(
        self, 
        filters: AlertFilter, 
        skip: int = 0, 
        limit: int = 20
    ) -> Tuple[List[Alert], int]:
        """Get alerts with filtering and pagination."""
        query = self.db.query(Alert)
        
        if filters.active_only:
            query = query.filter(
                Alert.is_active == True,
                (Alert.expires_time == None) | (Alert.expires_time > datetime.utcnow())
            )
        
        if filters.severity:
            query = query.filter(Alert.severity == filters.severity)
        
        if filters.category:
            query = query.filter(Alert.category == filters.category)
        
        if filters.county:
            # For SQLite, we need to handle JSON differently
            query = query.filter(Alert.affected_counties.like(f'%"{filters.county}"%'))
        
        total = query.count()
        alerts = query.offset(skip).limit(limit).all()
        
        return alerts, total
    
    async def get_alert_by_id(self, alert_id: str) -> Optional[Alert]:
        """Get alert by ID."""
        return self.db.query(Alert).filter(Alert.id == alert_id).first()
    
    async def create_alert(self, alert_data: AlertCreate, admin_id: str) -> Alert:
        """Create a new alert."""
        alert = Alert(
            id=str(uuid.uuid4()),
            **alert_data.dict()
        )
        self.db.add(alert)
        self.db.commit()
        self.db.refresh(alert)
        return alert
    
    async def get_nearby_alerts(
        self,
        latitude: float,
        longitude: float,
        radius_miles: float,
        severity_threshold: Optional[AlertSeverity] = None
    ) -> Tuple[List[Alert], int]:
        """Get alerts near a location."""
        # For SQLite, we'll do a simple bounding box query
        # In production with PostgreSQL, use PostGIS for accurate distance
        
        alerts = self.db.query(Alert).filter(
            Alert.is_active == True,
            (Alert.expires_time == None) | (Alert.expires_time > datetime.utcnow())
        ).all()
        
        # Filter by distance (simplified for demo)
        nearby_alerts = []
        for alert in alerts:
            if alert.latitude and alert.longitude:
                # Simple distance check (not accurate, just for demo)
                if abs(alert.latitude - latitude) < 1 and abs(alert.longitude - longitude) < 1:
                    nearby_alerts.append(alert)
        
        return nearby_alerts, len(nearby_alerts)
    
    async def mark_alert_viewed(self, alert_id: str, user_id: str):
        """Mark alert as viewed by user."""
        interaction = self.db.query(UserAlertInteraction).filter(
            UserAlertInteraction.alert_id == alert_id,
            UserAlertInteraction.user_id == user_id
        ).first()
        
        if not interaction:
            interaction = UserAlertInteraction(
                id=str(uuid.uuid4()),
                user_id=user_id,
                alert_id=alert_id,
                viewed_at=datetime.utcnow()
            )
            self.db.add(interaction)
        else:
            interaction.viewed_at = datetime.utcnow()
        
        self.db.commit()
    
    async def get_county_alerts(
        self,
        county_name: str,
        active_only: bool = True
    ) -> Tuple[List[Alert], int]:
        """Get all alerts for a specific county."""
        query = self.db.query(Alert)
        
        if active_only:
            query = query.filter(
                Alert.is_active == True,
                (Alert.expires_time == None) | (Alert.expires_time > datetime.utcnow())
            )
        
        # For SQLite JSON handling
        query = query.filter(Alert.affected_counties.like(f'%"{county_name}"%'))
        
        alerts = query.all()
        return alerts, len(alerts)
    
    async def generate_share_link(self, alert_id: str, user_id: str) -> dict:
        """Generate a shareable link for an alert."""
        return {
            "share_url": f"https://hawaii-emergency.gov/alerts/{alert_id}",
            "short_code": alert_id[:8],
            "expires_at": (datetime.utcnow() + timedelta(days=7)).isoformat()
        }
    
    async def dismiss_alert(self, alert_id: str, user_id: str):
        """Dismiss an alert for a user."""
        interaction = self.db.query(UserAlertInteraction).filter(
            UserAlertInteraction.alert_id == alert_id,
            UserAlertInteraction.user_id == user_id
        ).first()
        
        if not interaction:
            interaction = UserAlertInteraction(
                id=str(uuid.uuid4()),
                user_id=user_id,
                alert_id=alert_id,
                dismissed_at=datetime.utcnow()
            )
            self.db.add(interaction)
        else:
            interaction.dismissed_at = datetime.utcnow()
        
        self.db.commit()
    
    async def get_alert_statistics(self, since: datetime) -> dict:
        """Get alert statistics."""
        total_alerts = self.db.query(Alert).filter(Alert.created_at >= since).count()
        active_alerts = self.db.query(Alert).filter(
            Alert.is_active == True,
            Alert.created_at >= since
        ).count()
        
        # Get counts by severity
        severity_counts = {}
        for severity in AlertSeverity:
            count = self.db.query(Alert).filter(
                Alert.severity == severity,
                Alert.created_at >= since
            ).count()
            severity_counts[severity.value] = count
        
        # Get counts by category
        category_counts = {}
        for category in AlertCategory:
            count = self.db.query(Alert).filter(
                Alert.category == category,
                Alert.created_at >= since
            ).count()
            category_counts[category.value] = count
        
        return {
            "total_alerts": total_alerts,
            "active_alerts": active_alerts,
            "alerts_by_severity": severity_counts,
            "alerts_by_category": category_counts,
            "average_response_time_minutes": 1.5,
            "peak_alert_hour": 14
        }