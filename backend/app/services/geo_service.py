import math
from typing import Dict, List, Tuple, Optional
from shapely.geometry import Point, Polygon, shape
from shapely.ops import transform
import pyproj
from app.models.models import Alert
import logging

logger = logging.getLogger(__name__)

class GeoService:
    """Service for geographic calculations and spatial queries"""
    
    @staticmethod
    def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        """
        Calculate the great circle distance between two points 
        on the earth (specified in decimal degrees).
        Returns distance in miles.
        """
        # Convert decimal degrees to radians
        lat1, lon1, lat2, lon2 = map(math.radians, [lat1, lon1, lat2, lon2])
        
        # Haversine formula
        dlat = lat2 - lat1
        dlon = lon2 - lon1
        a = math.sin(dlat/2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon/2)**2
        c = 2 * math.asin(math.sqrt(a))
        
        # Radius of earth in miles
        r = 3959
        
        return c * r
    
    @staticmethod
    def point_in_polygon(point: Tuple[float, float], polygon_geojson: Dict) -> bool:
        """
        Check if a point is inside a GeoJSON polygon
        """
        try:
            # Create shapely objects
            point_obj = Point(point[1], point[0])  # Note: GeoJSON is lon,lat
            polygon_obj = shape(polygon_geojson)
            
            return polygon_obj.contains(point_obj)
        except Exception as e:
            logger.error(f"Error checking point in polygon: {e}")
            return False
    
    @staticmethod
    def alert_within_radius(
        alert: Alert,
        center_lat: float,
        center_lon: float,
        radius_miles: float
    ) -> bool:
        """
        Check if an alert is within a radius of a center point
        """
        if alert.latitude and alert.longitude:
            # Point alert
            distance = GeoService.haversine_distance(
                center_lat, center_lon,
                alert.latitude, alert.longitude
            )
            
            # If alert has its own radius, check if circles overlap
            if alert.radius_miles:
                return distance <= (radius_miles + alert.radius_miles)
            else:
                return distance <= radius_miles
        
        elif alert.polygon:
            # Polygon alert - check if any part overlaps with circle
            # This is a simplified check - just check if polygon center is within extended radius
            polygon_obj = shape(alert.polygon)
            centroid = polygon_obj.centroid
            
            distance = GeoService.haversine_distance(
                center_lat, center_lon,
                centroid.y, centroid.x
            )
            
            # Add some buffer for polygon size
            return distance <= (radius_miles + 20)
        
        return False
    
    @staticmethod
    def alert_intersects_polygon(alert: Alert, zone_polygon: Dict) -> bool:
        """
        Check if an alert area intersects with a zone polygon
        """
        try:
            zone_poly = shape(zone_polygon)
            
            if alert.polygon:
                # Both are polygons - check intersection
                alert_poly = shape(alert.polygon)
                return zone_poly.intersects(alert_poly)
            
            elif alert.latitude and alert.longitude:
                # Alert is a point/circle
                alert_point = Point(alert.longitude, alert.latitude)
                
                if alert.radius_miles:
                    # Create a buffer around the point (approximate)
                    # Convert miles to degrees (rough approximation)
                    buffer_deg = alert.radius_miles / 69.0
                    alert_circle = alert_point.buffer(buffer_deg)
                    return zone_poly.intersects(alert_circle)
                else:
                    # Just a point
                    return zone_poly.contains(alert_point)
            
            return False
            
        except Exception as e:
            logger.error(f"Error checking alert intersection: {e}")
            return False
    
    @staticmethod
    def get_hawaii_islands() -> Dict[str, Polygon]:
        """
        Get simplified polygons for Hawaiian islands
        """
        # Simplified island boundaries (would be more detailed in production)
        islands = {
            "Hawaii": [
                (-155.5, 19.0), (-155.0, 19.0), (-154.8, 19.5),
                (-154.8, 20.2), (-155.5, 20.2), (-156.0, 19.5),
                (-155.5, 19.0)
            ],
            "Maui": [
                (-156.7, 20.6), (-156.0, 20.6), (-155.9, 21.0),
                (-156.3, 21.0), (-156.7, 20.8), (-156.7, 20.6)
            ],
            "Oahu": [
                (-158.3, 21.3), (-157.7, 21.3), (-157.7, 21.7),
                (-158.3, 21.7), (-158.3, 21.3)
            ],
            "Kauai": [
                (-159.8, 21.9), (-159.3, 21.9), (-159.3, 22.2),
                (-159.8, 22.2), (-159.8, 21.9)
            ],
            "Molokai": [
                (-157.3, 21.0), (-156.7, 21.0), (-156.7, 21.2),
                (-157.3, 21.2), (-157.3, 21.0)
            ],
            "Lanai": [
                (-157.0, 20.7), (-156.8, 20.7), (-156.8, 20.9),
                (-157.0, 20.9), (-157.0, 20.7)
            ]
        }
        
        return {
            name: Polygon(coords)
            for name, coords in islands.items()
        }
    
    @staticmethod
    def get_users_in_alert_area(
        db,
        alert: Alert,
        User
    ) -> List[User]:
        """
        Find all users who should receive this alert based on location
        """
        from sqlalchemy import or_, and_
        
        users = []
        
        if alert.latitude and alert.longitude:
            # For point/radius alerts, find users within range
            # This is a simplified query - in production would use PostGIS
            all_users = db.query(User).filter(
                User.is_active == True,
                User.home_latitude != None,
                User.home_longitude != None
            ).all()
            
            for user in all_users:
                distance = GeoService.haversine_distance(
                    alert.latitude, alert.longitude,
                    user.home_latitude, user.home_longitude
                )
                
                # Check if user is within alert radius + their preference radius
                total_radius = (alert.radius_miles or 0) + user.alert_radius_miles
                if distance <= total_radius:
                    users.append(user)
        
        # Also check users with custom alert zones
        from app.models.models import AlertZone
        zones = db.query(AlertZone).filter(
            AlertZone.is_active == True
        ).all()
        
        for zone in zones:
            if zone.user_id not in [u.id for u in users]:
                # Check if alert matches zone
                if zone.polygon:
                    if GeoService.alert_intersects_polygon(alert, zone.polygon):
                        user = db.query(User).filter(User.id == zone.user_id).first()
                        if user and user.is_active:
                            users.append(user)
                else:
                    if GeoService.alert_within_radius(
                        alert,
                        zone.center_latitude,
                        zone.center_longitude,
                        zone.radius_miles
                    ):
                        user = db.query(User).filter(User.id == zone.user_id).first()
                        if user and user.is_active:
                            users.append(user)
        
        # Check county subscriptions
        if alert.affected_counties:
            county_users = db.query(User).filter(
                User.is_active == True,
                User.subscribed_counties != None
            ).all()
            
            for user in county_users:
                if user.id not in [u.id for u in users]:
                    user_counties = user.subscribed_counties or []
                    if any(county in user_counties for county in alert.affected_counties):
                        users.append(user)
        
        return users
    
    @staticmethod
    def geocode_address(address: str) -> Optional[Tuple[float, float]]:
        """
        Geocode an address to coordinates (would use real geocoding service)
        """
        # Simplified geocoding for common Hawaii locations
        locations = {
            "honolulu": (21.3099, -157.8581),
            "pearl harbor": (21.3531, -157.9563),
            "waikiki": (21.2793, -157.8292),
            "hilo": (19.7241, -155.0868),
            "kona": (19.6400, -155.9969),
            "kahului": (20.8893, -156.4729),
            "lihue": (21.9811, -159.3711),
        }
        
        address_lower = address.lower()
        for location, coords in locations.items():
            if location in address_lower:
                return coords
        
        return None