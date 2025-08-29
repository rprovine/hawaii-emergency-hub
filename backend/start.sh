#!/bin/bash

# Production startup script for backend
echo "Starting Hawaii Emergency Hub Backend..."

# Always run database setup in production to ensure tables exist
echo "Setting up database..."
python setup_database.py

# Start the application
exec uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}