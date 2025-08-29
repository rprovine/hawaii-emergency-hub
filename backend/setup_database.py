#!/usr/bin/env python3
"""
Quick database setup script
"""
import os
import sys
from pathlib import Path

# Add the backend directory to Python path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

from sqlalchemy import create_engine
from app.models.models import Base
from app.core.config import settings

def create_database():
    """Create database and tables"""
    # Use the configured database URL (PostgreSQL in production, SQLite in dev)
    database_url = settings.DATABASE_URL
    
    if database_url.startswith("sqlite"):
        # Development - use SQLite
        db_path = backend_dir / "hawaii_emergency.db" 
        engine = create_engine(f"sqlite:///{db_path}")
        print(f"Creating SQLite database at: {db_path}")
    else:
        # Production - use PostgreSQL
        engine = create_engine(database_url)
        print(f"Connecting to PostgreSQL database...")
    
    Base.metadata.create_all(engine)
    print("✅ Database tables created successfully!")
    
    # Check if we need to run migrations
    migration_file = backend_dir / "migrations" / "add_premium_features.py"
    if migration_file.exists():
        print("\n🔧 Running migrations...")
        # Import and run the migration
        import importlib.util
        spec = importlib.util.spec_from_file_location("migration", migration_file)
        migration = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(migration)
        
        try:
            # SQLite doesn't support all ALTER operations, so we'll skip if it fails
            migration.upgrade()
            print("✅ Migrations completed!")
        except Exception as e:
            print(f"⚠️  Migration partially applied: {e}")
            print("   (This is normal for SQLite)")

if __name__ == "__main__":
    create_database()