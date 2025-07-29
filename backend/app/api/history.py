from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from datetime import datetime, timedelta, timezone
from typing import Optional, List

from app.core.database import get_db
from app.core.auth import get_current_user, require_subscription_tier
from app.models.models import User, Alert, AlertSeverity, AlertCategory, SubscriptionTier
from app.services.subscription_service import SubscriptionService

router = APIRouter()

@router.get("/alerts")
async def get_historical_alerts(
    start_date: datetime = Query(..., description="Start date for historical data"),
    end_date: datetime = Query(..., description="End date for historical data"),
    severity: Optional[AlertSeverity] = Query(None, description="Filter by severity"),
    category: Optional[AlertCategory] = Query(None, description="Filter by category"),
    county: Optional[str] = Query(None, description="Filter by county"),
    limit: int = Query(100, ge=1, le=1000, description="Maximum number of results"),
    offset: int = Query(0, ge=0, description="Offset for pagination"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get historical alert data based on subscription tier"""
    
    # Check subscription tier and enforce historical data limits
    subscription = current_user.subscription
    if not subscription:
        raise HTTPException(status_code=403, detail="Subscription required for historical data")
    
    tier_limits = SubscriptionService.TIER_LIMITS.get(subscription.tier, {})
    historical_days = tier_limits.get("historical_days", 7)
    
    if historical_days == -1:  # Unlimited for enterprise
        max_history_date = datetime.min.replace(tzinfo=timezone.utc)
    else:
        max_history_date = datetime.now(timezone.utc) - timedelta(days=historical_days)
    
    # Enforce tier limits
    if start_date < max_history_date:
        raise HTTPException(
            status_code=403, 
            detail=f"Your subscription tier allows {historical_days} days of historical data"
        )
    
    # Build query
    query = db.query(Alert).filter(
        and_(
            Alert.created_at >= start_date,
            Alert.created_at <= end_date
        )
    )
    
    # Apply filters
    if severity:
        query = query.filter(Alert.severity == severity)
    
    if category:
        query = query.filter(Alert.category == category)
    
    if county:
        query = query.filter(
            or_(
                Alert.location_name.ilike(f"%{county}%"),
                Alert.affected_counties.contains([county])
            )
        )
    
    # Get total count for pagination
    total_count = query.count()
    
    # Apply pagination and get results
    alerts = query.order_by(Alert.created_at.desc()).offset(offset).limit(limit).all()
    
    return {
        "total": total_count,
        "limit": limit,
        "offset": offset,
        "subscription_tier": subscription.tier,
        "max_history_days": historical_days,
        "alerts": [
            {
                "id": alert.id,
                "title": alert.title,
                "description": alert.description,
                "severity": alert.severity,
                "category": alert.category,
                "location_name": alert.location_name,
                "latitude": alert.latitude,
                "longitude": alert.longitude,
                "affected_counties": alert.affected_counties,
                "created_at": alert.created_at.isoformat(),
                "effective_time": alert.effective_time.isoformat(),
                "expires_time": alert.expires_time.isoformat() if alert.expires_time else None
            }
            for alert in alerts
        ]
    }

@router.get("/statistics")
async def get_alert_statistics(
    start_date: datetime = Query(..., description="Start date for statistics"),
    end_date: datetime = Query(..., description="End date for statistics"),
    group_by: str = Query("day", description="Group by: hour, day, week, month"),
    current_user: User = Depends(require_subscription_tier([
        SubscriptionTier.ESSENTIAL,
        SubscriptionTier.PREMIUM,
        SubscriptionTier.BUSINESS,
        SubscriptionTier.ENTERPRISE
    ])),
    db: Session = Depends(get_db)
):
    """Get alert statistics over time"""
    
    # Validate date range based on subscription
    subscription = current_user.subscription
    tier_limits = SubscriptionService.TIER_LIMITS.get(subscription.tier, {})
    historical_days = tier_limits.get("historical_days", 7)
    
    if historical_days != -1:
        max_history_date = datetime.now(timezone.utc) - timedelta(days=historical_days)
        if start_date < max_history_date:
            start_date = max_history_date
    
    # Get alerts in date range
    alerts = db.query(Alert).filter(
        and_(
            Alert.created_at >= start_date,
            Alert.created_at <= end_date
        )
    ).all()
    
    # Calculate statistics
    stats = {
        "total_alerts": len(alerts),
        "by_severity": {},
        "by_category": {},
        "by_county": {},
        "timeline": []
    }
    
    # Count by severity
    for severity in AlertSeverity:
        count = sum(1 for a in alerts if a.severity == severity)
        if count > 0:
            stats["by_severity"][severity] = count
    
    # Count by category
    for category in AlertCategory:
        count = sum(1 for a in alerts if a.category == category)
        if count > 0:
            stats["by_category"][category] = count
    
    # Count by county
    county_counts = {}
    for alert in alerts:
        if alert.affected_counties:
            for county in alert.affected_counties:
                county_counts[county] = county_counts.get(county, 0) + 1
    stats["by_county"] = county_counts
    
    # Timeline data (simplified - in production would use SQL grouping)
    if group_by == "day":
        current = start_date.replace(hour=0, minute=0, second=0, microsecond=0)
        delta = timedelta(days=1)
    elif group_by == "hour":
        current = start_date.replace(minute=0, second=0, microsecond=0)
        delta = timedelta(hours=1)
    elif group_by == "week":
        current = start_date.replace(hour=0, minute=0, second=0, microsecond=0)
        delta = timedelta(weeks=1)
    else:  # month
        current = start_date.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        delta = timedelta(days=30)  # Approximate
    
    while current <= end_date:
        next_period = current + delta
        period_alerts = [a for a in alerts if current <= a.created_at < next_period]
        
        if period_alerts:
            stats["timeline"].append({
                "period_start": current.isoformat(),
                "period_end": next_period.isoformat(),
                "count": len(period_alerts),
                "by_severity": {
                    sev: sum(1 for a in period_alerts if a.severity == sev)
                    for sev in AlertSeverity
                    if sum(1 for a in period_alerts if a.severity == sev) > 0
                }
            })
        
        current = next_period
    
    return stats

@router.get("/export")
async def export_historical_data(
    format: str = Query("json", description="Export format: json, csv"),
    start_date: datetime = Query(..., description="Start date for export"),
    end_date: datetime = Query(..., description="End date for export"),
    current_user: User = Depends(require_subscription_tier([
        SubscriptionTier.PREMIUM,
        SubscriptionTier.BUSINESS,
        SubscriptionTier.ENTERPRISE
    ])),
    db: Session = Depends(get_db)
):
    """Export historical alert data"""
    
    # Check subscription limits
    subscription = current_user.subscription
    tier_limits = SubscriptionService.TIER_LIMITS.get(subscription.tier, {})
    historical_days = tier_limits.get("historical_days", 7)
    
    if historical_days != -1:
        max_history_date = datetime.now(timezone.utc) - timedelta(days=historical_days)
        if start_date < max_history_date:
            raise HTTPException(
                status_code=403,
                detail=f"Your subscription tier allows {historical_days} days of historical data"
            )
    
    # Get alerts
    alerts = db.query(Alert).filter(
        and_(
            Alert.created_at >= start_date,
            Alert.created_at <= end_date
        )
    ).order_by(Alert.created_at.desc()).all()
    
    if format == "csv":
        import csv
        import io
        
        output = io.StringIO()
        writer = csv.writer(output)
        
        # Write header
        writer.writerow([
            "ID", "Title", "Description", "Severity", "Category",
            "Location", "Latitude", "Longitude", "Counties",
            "Created At", "Effective Time", "Expires Time"
        ])
        
        # Write data
        for alert in alerts:
            writer.writerow([
                alert.id,
                alert.title,
                alert.description,
                alert.severity,
                alert.category,
                alert.location_name,
                alert.latitude,
                alert.longitude,
                ";".join(alert.affected_counties) if alert.affected_counties else "",
                alert.created_at.isoformat(),
                alert.effective_time.isoformat(),
                alert.expires_time.isoformat() if alert.expires_time else ""
            ])
        
        from fastapi.responses import Response
        return Response(
            content=output.getvalue(),
            media_type="text/csv",
            headers={
                "Content-Disposition": f"attachment; filename=alerts_{start_date.date()}_{end_date.date()}.csv"
            }
        )
    
    else:  # JSON format
        data = {
            "export_date": datetime.now(timezone.utc).isoformat(),
            "start_date": start_date.isoformat(),
            "end_date": end_date.isoformat(),
            "total_alerts": len(alerts),
            "alerts": [
                {
                    "id": alert.id,
                    "title": alert.title,
                    "description": alert.description,
                    "severity": alert.severity,
                    "category": alert.category,
                    "location_name": alert.location_name,
                    "coordinates": {
                        "latitude": alert.latitude,
                        "longitude": alert.longitude
                    },
                    "affected_counties": alert.affected_counties,
                    "timestamps": {
                        "created": alert.created_at.isoformat(),
                        "effective": alert.effective_time.isoformat(),
                        "expires": alert.expires_time.isoformat() if alert.expires_time else None
                    },
                    "source": alert.source,
                    "metadata": alert.metadata
                }
                for alert in alerts
            ]
        }
        
        return data

@router.get("/archive/{alert_id}")
async def get_archived_alert(
    alert_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a specific archived alert"""
    
    alert = db.query(Alert).filter_by(id=alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    
    # Check if user has access based on subscription
    subscription = current_user.subscription
    if subscription:
        tier_limits = SubscriptionService.TIER_LIMITS.get(subscription.tier, {})
        historical_days = tier_limits.get("historical_days", 7)
        
        if historical_days != -1:
            max_history_date = datetime.now(timezone.utc) - timedelta(days=historical_days)
            if alert.created_at < max_history_date:
                raise HTTPException(
                    status_code=403,
                    detail="This alert is outside your subscription's historical data range"
                )
    
    return {
        "id": alert.id,
        "title": alert.title,
        "description": alert.description,
        "severity": alert.severity,
        "category": alert.category,
        "location_name": alert.location_name,
        "latitude": alert.latitude,
        "longitude": alert.longitude,
        "radius_miles": alert.radius_miles,
        "affected_counties": alert.affected_counties,
        "polygon": alert.polygon,
        "created_at": alert.created_at.isoformat(),
        "effective_time": alert.effective_time.isoformat(),
        "expires_time": alert.expires_time.isoformat() if alert.expires_time else None,
        "source": alert.source,
        "metadata": alert.metadata,
        "is_test": alert.is_test
    }