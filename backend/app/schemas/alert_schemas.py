from pydantic import BaseModel, Field, validator
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum

from app.models.models import AlertSeverity, AlertCategory

class LocationFilter(BaseModel):
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    radius_miles: float = Field(25.0, ge=1, le=100)

class AlertFilter(BaseModel):
    severity: Optional[AlertSeverity] = None
    category: Optional[AlertCategory] = None
    county: Optional[str] = None
    active_only: bool = True
    location: Optional[LocationFilter] = None

class Translation(BaseModel):
    title: str
    description: str

class AlertBase(BaseModel):
    title: str
    description: str
    severity: AlertSeverity
    category: AlertCategory
    location_name: Optional[str] = None
    latitude: Optional[float] = Field(None, ge=-90, le=90)
    longitude: Optional[float] = Field(None, ge=-180, le=180)
    radius_miles: Optional[float] = Field(None, ge=1, le=300)
    affected_counties: List[str] = []
    effective_time: datetime
    expires_time: Optional[datetime] = None
    source: str
    source_url: Optional[str] = None
    translations: Optional[Dict[str, Translation]] = {}
    alert_metadata: Optional[Dict[str, Any]] = {}
    images: Optional[List[str]] = None

class AlertCreate(AlertBase):
    external_id: str
    polygon: Optional[Dict[str, Any]] = None  # GeoJSON
    is_test: bool = False

class AlertUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    severity: Optional[AlertSeverity] = None
    expires_time: Optional[datetime] = None
    translations: Optional[Dict[str, Translation]] = None
    is_active: Optional[bool] = None

class AlertResponse(AlertBase):
    id: str
    external_id: str
    created_at: datetime
    updated_at: Optional[datetime] = None
    is_active: bool
    is_test: bool
    
    # Computed fields
    time_until_expiry: Optional[str] = None
    distance_miles: Optional[float] = None  # From user's location
    
    @validator('time_until_expiry', always=True)
    def calculate_time_until_expiry(cls, v, values):
        if values.get('expires_time'):
            delta = values['expires_time'] - datetime.utcnow()
            if delta.total_seconds() > 0:
                hours = int(delta.total_seconds() // 3600)
                minutes = int((delta.total_seconds() % 3600) // 60)
                if hours > 0:
                    return f"{hours}h {minutes}m"
                return f"{minutes}m"
        return None
    
    class Config:
        from_attributes = True

class AlertListResponse(BaseModel):
    alerts: List[AlertResponse]
    total: int
    skip: int
    limit: int
    
class AlertStatistics(BaseModel):
    total_alerts: int
    active_alerts: int
    alerts_by_severity: Dict[str, int]
    alerts_by_category: Dict[str, int]
    alerts_by_county: Dict[str, int]
    average_response_time_minutes: float
    peak_alert_hour: int  # Hour of day with most alerts
    
class ShareableAlert(BaseModel):
    share_url: str
    short_code: str
    expires_at: datetime
    
class UserAlertPreferences(BaseModel):
    severity_threshold: AlertSeverity = AlertSeverity.MINOR
    categories: List[AlertCategory] = []
    counties: List[str] = []
    radius_miles: float = Field(25.0, ge=5, le=100)
    quiet_hours_enabled: bool = False
    quiet_hours_start: int = Field(22, ge=0, le=23)
    quiet_hours_end: int = Field(7, ge=0, le=23)