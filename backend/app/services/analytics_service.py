from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta
from typing import Dict, List

from app.models.models import Alert, User, AlertSeverity

class AnalyticsService:
    def __init__(self, db: Session):
        self.db = db
    
    def get_active_alert_count(self) -> int:
        """Get count of active alerts."""
        return self.db.query(Alert).filter(
            Alert.is_active == True,
            (Alert.expires_time == None) | (Alert.expires_time > datetime.utcnow())
        ).count()
    
    def get_total_user_count(self) -> int:
        """Get total number of registered users."""
        return self.db.query(User).count()
    
    def get_alerts_last_24h(self) -> int:
        """Get number of alerts in last 24 hours."""
        since = datetime.utcnow() - timedelta(hours=24)
        return self.db.query(Alert).filter(Alert.created_at >= since).count()
    
    def get_response_metrics(self) -> Dict:
        """Get response time metrics."""
        # In production, this would calculate real metrics
        return {
            "average_response_minutes": 1.2,
            "median_response_minutes": 0.8,
            "95th_percentile_minutes": 2.5
        }
    
    def get_alerts_by_severity(self) -> Dict[str, int]:
        """Get alert counts by severity."""
        results = self.db.query(
            Alert.severity,
            func.count(Alert.id)
        ).group_by(Alert.severity).all()
        
        return {severity.value: count for severity, count in results}
    
    def get_alerts_by_county(self) -> Dict[str, int]:
        """Get alert counts by county."""
        # Simplified for demo - in production would properly handle JSON array
        alerts = self.db.query(Alert).all()
        county_counts = {}
        
        for alert in alerts:
            if alert.affected_counties:
                for county in alert.affected_counties:
                    county_counts[county] = county_counts.get(county, 0) + 1
        
        return county_counts
    
    def get_alert_trends(self, days: int = 7) -> List[Dict]:
        """Get alert trends over specified days."""
        trends = []
        
        for i in range(days):
            date = datetime.utcnow().date() - timedelta(days=i)
            start = datetime.combine(date, datetime.min.time())
            end = datetime.combine(date, datetime.max.time())
            
            count = self.db.query(Alert).filter(
                Alert.created_at >= start,
                Alert.created_at <= end
            ).count()
            
            trends.append({
                "date": date.isoformat(),
                "count": count
            })
        
        return list(reversed(trends))