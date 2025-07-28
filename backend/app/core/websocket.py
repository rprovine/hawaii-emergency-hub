from typing import Dict, Set, List, Optional
from fastapi import WebSocket
import json
from datetime import datetime
import asyncio
from dataclasses import dataclass, field

@dataclass
class ConnectionInfo:
    websocket: WebSocket
    user_id: str
    connected_at: datetime = field(default_factory=datetime.utcnow)
    location: Optional[Dict[str, float]] = None
    subscribed_counties: Set[str] = field(default_factory=set)

class ConnectionManager:
    def __init__(self):
        # Active connections
        self.active_connections: Dict[str, ConnectionInfo] = {}
        self.admin_connections: Dict[str, WebSocket] = {}
        
        # Location-based subscriptions
        self.location_subscriptions: Dict[str, Set[str]] = {}  # user_id -> location_key
        
        # Statistics
        self.total_connections = 0
        self.peak_connections = 0
        self.messages_sent = 0
        
    async def connect(self, user_id: str, websocket: WebSocket):
        await websocket.accept()
        
        connection = ConnectionInfo(
            websocket=websocket,
            user_id=user_id
        )
        
        self.active_connections[user_id] = connection
        self.total_connections += 1
        
        # Update peak connections
        current_count = len(self.active_connections)
        if current_count > self.peak_connections:
            self.peak_connections = current_count
            
        # Send welcome message
        await self.send_personal_message(
            user_id,
            {
                "type": "connection",
                "status": "connected",
                "timestamp": datetime.utcnow().isoformat(),
                "user_id": user_id
            }
        )
        
        # Notify admins
        await self._notify_admins_connection_change("connect", user_id)
        
    def disconnect(self, user_id: str):
        if user_id in self.active_connections:
            del self.active_connections[user_id]
            
            # Clean up location subscriptions
            if user_id in self.location_subscriptions:
                del self.location_subscriptions[user_id]
                
            # Notify admins
            asyncio.create_task(
                self._notify_admins_connection_change("disconnect", user_id)
            )
    
    async def connect_admin(self, admin_id: str, websocket: WebSocket):
        await websocket.accept()
        self.admin_connections[admin_id] = websocket
        
        # Send initial stats
        await websocket.send_json({
            "type": "admin_connected",
            "stats": await self.get_connection_stats()
        })
    
    def disconnect_admin(self, admin_id: str):
        if admin_id in self.admin_connections:
            del self.admin_connections[admin_id]
    
    async def subscribe_to_location(self, user_id: str, location: Dict[str, float]):
        if user_id in self.active_connections:
            self.active_connections[user_id].location = location
            
            # Create location key for grouping nearby users
            location_key = f"{round(location['latitude'], 2)}_{round(location['longitude'], 2)}"
            
            if user_id not in self.location_subscriptions:
                self.location_subscriptions[user_id] = set()
                
            self.location_subscriptions[user_id].add(location_key)
            
            await self.send_personal_message(
                user_id,
                {
                    "type": "subscription",
                    "status": "subscribed",
                    "location": location,
                    "timestamp": datetime.utcnow().isoformat()
                }
            )
    
    async def send_personal_message(self, user_id: str, message: Dict):
        if user_id in self.active_connections:
            connection = self.active_connections[user_id]
            try:
                await connection.websocket.send_json(message)
                self.messages_sent += 1
            except Exception as e:
                print(f"Error sending message to {user_id}: {e}")
                self.disconnect(user_id)
    
    async def broadcast_alert(self, alert_data: Dict, target_location: Optional[Dict] = None):
        """Broadcast alert to relevant users based on location."""
        message = {
            "type": "alert",
            "data": alert_data,
            "timestamp": datetime.utcnow().isoformat()
        }
        
        # Send to all active connections if no target location
        if not target_location:
            disconnected_users = []
            
            for user_id, connection in self.active_connections.items():
                try:
                    await connection.websocket.send_json(message)
                    self.messages_sent += 1
                except Exception as e:
                    print(f"Error broadcasting to {user_id}: {e}")
                    disconnected_users.append(user_id)
            
            # Clean up disconnected users
            for user_id in disconnected_users:
                self.disconnect(user_id)
        else:
            # Send to users in specific location
            await self._broadcast_to_location(message, target_location)
        
        # Notify admins
        await self._notify_admins_alert_broadcast(alert_data)
    
    async def broadcast_to_county(self, alert_data: Dict, county: str):
        """Broadcast alert to users subscribed to a specific county."""
        message = {
            "type": "alert",
            "data": alert_data,
            "county": county,
            "timestamp": datetime.utcnow().isoformat()
        }
        
        disconnected_users = []
        sent_count = 0
        
        for user_id, connection in self.active_connections.items():
            if county in connection.subscribed_counties:
                try:
                    await connection.websocket.send_json(message)
                    self.messages_sent += 1
                    sent_count += 1
                except Exception as e:
                    print(f"Error broadcasting to {user_id}: {e}")
                    disconnected_users.append(user_id)
        
        # Clean up disconnected users
        for user_id in disconnected_users:
            self.disconnect(user_id)
            
        return sent_count
    
    async def _broadcast_to_location(self, message: Dict, target_location: Dict):
        """Broadcast to users near a specific location."""
        from geopy.distance import distance
        
        target_coords = (target_location['latitude'], target_location['longitude'])
        radius_miles = target_location.get('radius_miles', 25)
        
        disconnected_users = []
        
        for user_id, connection in self.active_connections.items():
            if connection.location:
                user_coords = (
                    connection.location['latitude'],
                    connection.location['longitude']
                )
                
                # Calculate distance
                dist = distance(target_coords, user_coords).miles
                
                if dist <= radius_miles:
                    try:
                        await connection.websocket.send_json(message)
                        self.messages_sent += 1
                    except Exception as e:
                        print(f"Error broadcasting to {user_id}: {e}")
                        disconnected_users.append(user_id)
        
        # Clean up disconnected users
        for user_id in disconnected_users:
            self.disconnect(user_id)
    
    async def _notify_admins_connection_change(self, event_type: str, user_id: str):
        """Notify admin dashboards of connection changes."""
        message = {
            "type": "connection_event",
            "event": event_type,
            "user_id": user_id,
            "timestamp": datetime.utcnow().isoformat(),
            "active_connections": len(self.active_connections)
        }
        
        disconnected_admins = []
        
        for admin_id, websocket in self.admin_connections.items():
            try:
                await websocket.send_json(message)
            except Exception as e:
                print(f"Error notifying admin {admin_id}: {e}")
                disconnected_admins.append(admin_id)
        
        # Clean up disconnected admins
        for admin_id in disconnected_admins:
            self.disconnect_admin(admin_id)
    
    async def _notify_admins_alert_broadcast(self, alert_data: Dict):
        """Notify admin dashboards of alert broadcasts."""
        message = {
            "type": "alert_broadcast",
            "alert": alert_data,
            "timestamp": datetime.utcnow().isoformat(),
            "recipients": len(self.active_connections)
        }
        
        for admin_id, websocket in self.admin_connections.items():
            try:
                await websocket.send_json(message)
            except Exception as e:
                print(f"Error notifying admin {admin_id}: {e}")
    
    async def get_connection_stats(self) -> Dict:
        """Get current connection statistics."""
        counties_stats = {}
        
        for connection in self.active_connections.values():
            for county in connection.subscribed_counties:
                counties_stats[county] = counties_stats.get(county, 0) + 1
        
        return {
            "active_connections": len(self.active_connections),
            "admin_connections": len(self.admin_connections),
            "total_connections": self.total_connections,
            "peak_connections": self.peak_connections,
            "messages_sent": self.messages_sent,
            "connections_by_county": counties_stats,
            "timestamp": datetime.utcnow().isoformat()
        }

# Global connection manager instance
connection_manager = ConnectionManager()