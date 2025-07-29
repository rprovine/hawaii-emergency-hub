#!/bin/bash

echo "🛑 Stopping Hawaii Emergency Hub..."

# Kill processes by PID files
if [ -f backend/backend.pid ]; then
    kill $(cat backend/backend.pid) 2>/dev/null
    rm backend/backend.pid
fi

if [ -f web-dashboard/frontend.pid ]; then
    kill $(cat web-dashboard/frontend.pid) 2>/dev/null
    rm web-dashboard/frontend.pid
fi

# Also kill by name just in case
pkill -f "uvicorn app.main:app" 2>/dev/null
pkill -f "next dev" 2>/dev/null

echo "✅ All services stopped."