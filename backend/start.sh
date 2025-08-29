#!/bin/bash

# Production startup script for backend
echo "Starting Hawaii Emergency Hub Backend..."

# Run database migrations if needed
if [ "$RUN_MIGRATIONS" = "true" ]; then
    echo "Running database migrations..."
    python setup_database.py
fi

# Start the application
exec uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}