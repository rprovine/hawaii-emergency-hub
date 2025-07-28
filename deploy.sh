#!/bin/bash

# Hawaii Emergency Network Hub - Deployment Script

set -e

echo "🌺 Hawaii Emergency Network Hub - Deployment Script"
echo "================================================"

# Check if Docker and Docker Compose are installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Function to check if .env files exist
check_env_files() {
    if [ ! -f "./backend/.env" ]; then
        echo "⚠️  Creating backend .env file from example..."
        cp ./backend/.env.example ./backend/.env
        echo "📝 Please update ./backend/.env with your configuration"
    fi
    
    if [ ! -f "./web-dashboard/.env.local" ]; then
        echo "⚠️  Creating web-dashboard .env.local file from example..."
        cp ./web-dashboard/.env.example ./web-dashboard/.env.local
        echo "📝 Please update ./web-dashboard/.env.local with your configuration"
    fi
}

# Function to build and start services
deploy() {
    echo "🔧 Building Docker images..."
    docker-compose build
    
    echo "🚀 Starting services..."
    docker-compose up -d
    
    echo "⏳ Waiting for services to be healthy..."
    sleep 10
    
    echo "🗄️  Running database migrations..."
    docker-compose exec backend alembic upgrade head
    
    echo "✅ Deployment complete!"
    echo ""
    echo "📍 Service URLs:"
    echo "   - API: http://localhost:8000"
    echo "   - Government Dashboard: http://localhost:3000"
    echo "   - API Documentation: http://localhost:8000/docs"
    echo "   - Flower (Celery monitoring): http://localhost:5555"
    echo ""
    echo "📊 To view logs: docker-compose logs -f [service-name]"
    echo "🛑 To stop services: docker-compose down"
}

# Function to run tests
run_tests() {
    echo "🧪 Running tests..."
    
    # Backend tests
    echo "Testing backend..."
    docker-compose exec backend pytest
    
    # Frontend tests
    echo "Testing dashboard..."
    docker-compose exec web-dashboard npm test
    
    echo "✅ All tests passed!"
}

# Function to backup database
backup_db() {
    timestamp=$(date +%Y%m%d_%H%M%S)
    backup_file="backup_${timestamp}.sql"
    
    echo "💾 Creating database backup..."
    docker-compose exec postgres pg_dump -U postgres hawaii_emergency > "./backups/${backup_file}"
    echo "✅ Backup saved to ./backups/${backup_file}"
}

# Main menu
case "$1" in
    "start")
        check_env_files
        deploy
        ;;
    "stop")
        echo "🛑 Stopping services..."
        docker-compose down
        echo "✅ Services stopped"
        ;;
    "restart")
        echo "🔄 Restarting services..."
        docker-compose restart
        echo "✅ Services restarted"
        ;;
    "test")
        run_tests
        ;;
    "backup")
        backup_db
        ;;
    "logs")
        docker-compose logs -f ${2:-}
        ;;
    "clean")
        echo "🧹 Cleaning up..."
        docker-compose down -v
        docker system prune -f
        echo "✅ Cleanup complete"
        ;;
    *)
        echo "Usage: $0 {start|stop|restart|test|backup|logs|clean}"
        echo ""
        echo "Commands:"
        echo "  start   - Build and start all services"
        echo "  stop    - Stop all services"
        echo "  restart - Restart all services"
        echo "  test    - Run all tests"
        echo "  backup  - Backup the database"
        echo "  logs    - View logs (optionally specify service)"
        echo "  clean   - Stop services and clean up volumes"
        exit 1
        ;;
esac