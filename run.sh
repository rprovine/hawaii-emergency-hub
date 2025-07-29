#!/bin/bash

echo "🚀 Starting Hawaii Emergency Hub"
echo "================================"

# Kill any existing processes
echo "Cleaning up old processes..."
pkill -f "uvicorn app.main:app" 2>/dev/null
pkill -f "next dev" 2>/dev/null
sleep 2

# Start backend
echo "Starting backend..."
cd backend
source venv/bin/activate
nohup uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload > backend.log 2>&1 &
echo $! > backend.pid
cd ..

# Wait for backend
echo "Waiting for backend..."
for i in {1..10}; do
    if curl -s http://localhost:8000 > /dev/null; then
        echo "✅ Backend is ready!"
        break
    fi
    echo "  Attempt $i/10..."
    sleep 1
done

# Start frontend
echo -e "\nStarting frontend..."
cd web-dashboard
nohup npm run dev > frontend.log 2>&1 &
echo $! > frontend.pid
cd ..

echo -e "\n✨ Hawaii Emergency Hub is running!"
echo "================================"
echo "Backend: http://localhost:8000"
echo "API Docs: http://localhost:8000/docs"
echo "Frontend: http://localhost:3000"
echo -e "\nLogs:"
echo "  Backend: backend/backend.log"
echo "  Frontend: web-dashboard/frontend.log"
echo -e "\nTo stop: ./stop.sh"