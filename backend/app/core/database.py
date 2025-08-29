from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.ext.declarative import declarative_base
from typing import Generator
import os

from app.core.config import settings

# Handle different database types
try:
    if settings.DATABASE_URL.startswith("sqlite"):
        # SQLite configuration
        engine = create_engine(
            settings.DATABASE_URL,
            connect_args={"check_same_thread": False}
        )
    else:
        # PostgreSQL configuration
        engine = create_engine(
            settings.DATABASE_URL,
            pool_pre_ping=True,
            pool_recycle=300
        )
    
    # Test connection
    from sqlalchemy import text
    with engine.connect() as conn:
        conn.execute(text("SELECT 1"))
    print(f"✅ Database connected: {settings.DATABASE_URL[:20]}...")
    
except Exception as e:
    print(f"❌ Database connection failed: {e}")
    print("🔄 Falling back to SQLite...")
    # Fallback to SQLite
    engine = create_engine(
        "sqlite:///./hawaii_emergency.db",
        connect_args={"check_same_thread": False}
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

# Dependency to get DB session
def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Create tables
def create_tables():
    from app.models.models import Base
    Base.metadata.create_all(bind=engine)
    print("Database tables created successfully!")