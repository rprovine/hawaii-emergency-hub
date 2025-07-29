from typing import List, Union
from pydantic_settings import BaseSettings
from pydantic import AnyHttpUrl, validator

class Settings(BaseSettings):
    PROJECT_NAME: str = "Hawaii Emergency Network Hub"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Security
    SECRET_KEY: str = "your-secret-key-here-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    # Database
    DATABASE_URL: str = "postgresql://postgres:password@localhost/hawaii_emergency"
    
    # Redis
    REDIS_URL: str = "redis://localhost:6379"
    
    # CORS
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:3001", 
        "http://localhost:3002",
        "http://localhost:19006",
        "http://localhost:8081"
    ]
    
    @validator("BACKEND_CORS_ORIGINS", pre=True)
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> Union[List[str], str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",")]
        elif isinstance(v, (list, str)):
            return v
        raise ValueError(v)
    
    # Email
    SMTP_TLS: bool = True
    SMTP_PORT: int = 587
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    EMAILS_FROM_EMAIL: str = "alerts@hawaii-emergency.gov"
    EMAILS_FROM_NAME: str = "Hawaii Emergency Network"
    
    # External APIs
    WEATHER_API_KEY: str = ""
    USGS_API_URL: str = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/"
    NWS_API_URL: str = "https://api.weather.gov/"
    
    # Alert Settings
    ALERT_EXPIRY_HOURS: int = 24
    MAX_ALERT_RADIUS_MILES: int = 100
    DEFAULT_ALERT_RADIUS_MILES: int = 25
    
    # Performance
    MAX_WEBSOCKET_CONNECTIONS: int = 10000
    ALERT_CACHE_TTL_SECONDS: int = 300
    
    # Hawaii-specific settings
    HAWAII_BOUNDS: dict = {
        "north": 22.2356,
        "south": 18.9106,
        "east": -154.8067,
        "west": -160.2471
    }
    
    HAWAII_COUNTIES: list = [
        "Hawaii County",
        "Maui County", 
        "Honolulu County",
        "Kauai County",
        "Kalawao County"
    ]
    
    SUPPORTED_LANGUAGES: list = ["en", "haw", "ja", "ko", "tl", "zh"]
    
    class Config:
        case_sensitive = True
        env_file = ".env"

settings = Settings()