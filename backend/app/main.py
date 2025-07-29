from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from typing import Dict, List, Set
import asyncio
import json
import logging
from datetime import datetime

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

from app.api import alerts, auth, analytics, admin, notifications, zones
from app.core.config import settings
from app.core.websocket import connection_manager
from app.models import models
from app.services.alert_processor import AlertProcessor

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Starting Hawaii Emergency Network Hub API...")
    # Initialize services
    app.state.alert_processor = AlertProcessor()
    await app.state.alert_processor.start()
    logger.info("Alert processor started with live data sync enabled")
    
    yield
    
    # Shutdown
    logger.info("Shutting down...")
    await app.state.alert_processor.stop()

app = FastAPI(
    title="Hawaii Emergency Network Hub API",
    description="Premium emergency alert aggregation system for Hawaii",
    version="1.0.0",
    lifespan=lifespan
)

# CORS configuration
origins = [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:3002",
    "http://localhost:19006",
    "http://localhost:8081"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(alerts.router, prefix="/api/v1/alerts", tags=["alerts"])
app.include_router(auth.router, prefix="/api/v1/auth", tags=["authentication"])
app.include_router(analytics.router, prefix="/api/v1/analytics", tags=["analytics"])
app.include_router(admin.router, prefix="/api/v1/admin", tags=["admin"])
app.include_router(notifications.router, prefix="/api/v1/notifications", tags=["notifications"])
app.include_router(zones.router, prefix="/api/v1/zones", tags=["zones"])

@app.get("/")
async def root():
    return {
        "service": "Hawaii Emergency Network Hub",
        "status": "operational",
        "timestamp": datetime.utcnow().isoformat(),
        "version": "1.0.0"
    }

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "services": {
            "api": "operational",
            "database": "operational",
            "redis": "operational",
            "websocket": "operational"
        }
    }

@app.websocket("/ws/alerts/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: str):
    await connection_manager.connect(user_id, websocket)
    try:
        while True:
            # Keep connection alive and handle incoming messages
            data = await websocket.receive_text()
            message = json.loads(data)
            
            if message.get("type") == "ping":
                await websocket.send_json({"type": "pong", "timestamp": datetime.utcnow().isoformat()})
            elif message.get("type") == "subscribe":
                # Handle location-based subscriptions
                location = message.get("location")
                if location:
                    await connection_manager.subscribe_to_location(user_id, location)
                    
    except WebSocketDisconnect:
        connection_manager.disconnect(user_id)
    except Exception as e:
        print(f"WebSocket error for user {user_id}: {e}")
        connection_manager.disconnect(user_id)

@app.websocket("/ws/admin/{admin_id}")
async def admin_websocket_endpoint(websocket: WebSocket, admin_id: str):
    await connection_manager.connect_admin(admin_id, websocket)
    try:
        while True:
            # Admin real-time dashboard updates
            data = await websocket.receive_text()
            message = json.loads(data)
            
            if message.get("type") == "ping":
                await websocket.send_json({
                    "type": "pong",
                    "timestamp": datetime.utcnow().isoformat(),
                    "stats": await connection_manager.get_connection_stats()
                })
                
    except WebSocketDisconnect:
        connection_manager.disconnect_admin(admin_id)
    except Exception as e:
        print(f"Admin WebSocket error for {admin_id}: {e}")
        connection_manager.disconnect_admin(admin_id)