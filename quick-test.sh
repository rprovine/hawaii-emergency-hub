#!/bin/bash

echo "🚀 Quick Test for Hawaii Emergency Hub"
echo "====================================="

# Start backend in background
echo "Starting backend..."
cd backend
source venv/bin/activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000 > backend.log 2>&1 &
BACKEND_PID=$!
cd ..

# Wait for backend
echo "Waiting for backend to start..."
sleep 5

# Check if backend is running
if curl -s http://localhost:8000 > /dev/null; then
    echo "✅ Backend is running on http://localhost:8000"
    echo "📚 API Docs: http://localhost:8000/docs"
else
    echo "❌ Backend failed to start. Check backend/backend.log"
    cat backend/backend.log
    exit 1
fi

# Start frontend
echo -e "\nStarting frontend..."
cd web-dashboard
npm run dev &
FRONTEND_PID=$!
cd ..

echo -e "\n✨ Services are starting!"
echo "====================================="
echo "Backend: http://localhost:8000"
echo "Frontend: http://localhost:3000"
echo -e "\nPress Ctrl+C to stop\n"

# Function to cleanup
cleanup() {
    echo -e "\nStopping services..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    exit
}

trap cleanup EXIT INT TERM

# Keep running
wait