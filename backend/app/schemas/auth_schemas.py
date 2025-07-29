from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    subscription_tier: Optional[str] = "free"

class TokenData(BaseModel):
    user_id: Optional[str] = None

class UserBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None
    preferred_language: str = "en"

class UserCreate(UserBase):
    password: str
    phone: Optional[str] = None

class UserUpdate(UserBase):
    password: Optional[str] = None
    phone: Optional[str] = None
    home_latitude: Optional[float] = None
    home_longitude: Optional[float] = None
    alert_radius_miles: Optional[float] = None

class UserResponse(UserBase):
    id: str
    is_active: bool
    is_verified: bool
    created_at: datetime
    
    class Config:
        from_attributes = True