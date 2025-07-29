#!/bin/bash

echo "🚀 Starting Hawaii Emergency Hub Development Environment"
echo "=================================================="

# Function to kill processes on exit
cleanup() {
    echo -e "\n\n🛑 Shutting down services..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    exit
}

# Function to kill process on a port
kill_port() {
    local port=$1
    local pid=$(lsof -ti :$port)
    if [ ! -z "$pid" ]; then
        echo "⚠️  Port $port is in use by PID $pid. Killing it..."
        kill -9 $pid 2>/dev/null
        sleep 1
    fi
}

# Set up trap to cleanup on script exit
trap cleanup EXIT INT TERM

# Kill any existing processes on our ports
kill_port 8000
kill_port 3000

# Check if backend dependencies are installed
if [ ! -d "backend/venv" ]; then
    echo "📦 Setting up backend virtual environment..."
    cd backend
    python3 -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
    cd ..
else
    echo "✅ Backend virtual environment found"
fi

# Create SQLite database if it doesn't exist
if [ ! -f "backend/hawaii_emergency.db" ]; then
    echo "🗄️  Creating database..."
    cd backend
    source venv/bin/activate
    python -c "from app.models.models import Base; from sqlalchemy import create_engine; engine = create_engine('sqlite:///hawaii_emergency.db'); Base.metadata.create_all(engine)"
    
    # Run migrations
    if [ -f "migrations/add_premium_features.py" ]; then
        echo "🔧 Running database migrations..."
        python migrations/add_premium_features.py
    fi
    cd ..
fi

# Start backend
echo -e "\n🌐 Starting backend server on http://localhost:8000"
cd backend
source venv/bin/activate
uvicorn app.main:app --reload --port 8000 &
BACKEND_PID=$!
cd ..

# Wait for backend to start
echo "⏳ Waiting for backend to start..."
sleep 5

# Check if backend is running
if curl -s http://localhost:8000 > /dev/null; then
    echo "✅ Backend is running!"
else
    echo "❌ Backend failed to start. Check the logs above."
    exit 1
fi

# Check if frontend dependencies are installed
if [ ! -d "web-dashboard/node_modules" ]; then
    echo -e "\n📦 Installing frontend dependencies..."
    cd web-dashboard
    npm install
    cd ..
else
    echo "✅ Frontend dependencies found"
fi

# Start frontend
echo -e "\n🎨 Starting frontend on http://localhost:3000"
cd web-dashboard
npm run dev &
FRONTEND_PID=$!
cd ..

# Wait for frontend to start
echo "⏳ Waiting for frontend to start..."
sleep 10

echo -e "\n✨ Hawaii Emergency Hub is ready!"
echo "=================================================="
echo "🌐 Backend API: http://localhost:8000"
echo "🌐 API Docs: http://localhost:8000/docs"
echo "🎨 Frontend: http://localhost:3000"
echo "=================================================="
echo -e "\n📝 Test Credentials:"
echo "Email: test@example.com"
echo "Password: testpass123"
echo -e "\n💡 Press Ctrl+C to stop all services\n"

# Keep the script running
wait