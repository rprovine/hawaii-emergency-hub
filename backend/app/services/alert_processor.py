import asyncio
import logging
from typing import Dict, List
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)

class AlertProcessor:
    """Process and manage alerts from various sources."""
    
    def __init__(self):
        self.active_alerts: Dict[str, Dict] = {}
        self.processing = False
        self.sync_task = None
        self.sync_interval = 300  # 5 minutes
        
    async def start(self):
        """Start the alert processor."""
        self.processing = True
        logger.info("Alert processor started")
        
        # Start the sync task
        self.sync_task = asyncio.create_task(self._sync_loop())
        
    async def stop(self):
        """Stop the alert processor."""
        self.processing = False
        
        # Cancel the sync task
        if self.sync_task:
            self.sync_task.cancel()
            try:
                await self.sync_task
            except asyncio.CancelledError:
                pass
                
        logger.info("Alert processor stopped")
        
    async def _sync_loop(self):
        """Continuously sync alerts from external sources."""
        # Import API clients here to avoid circular imports
        from app.services.external_apis.nws_api import nws_client
        from app.services.external_apis.usgs_earthquake_api import usgs_earthquake_client
        from app.services.external_apis.volcano_monitor import volcano_monitor
        
        # Initial sync immediately
        await self._sync_all_sources()
        
        while self.processing:
            try:
                await asyncio.sleep(self.sync_interval)
                
                if self.processing:
                    await self._sync_all_sources()
                    
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Error in sync loop: {e}")
                await asyncio.sleep(60)  # Wait a minute before retrying
                
    async def _sync_all_sources(self):
        """Sync alerts from all external sources."""
        logger.info("Starting alert sync from all sources...")
        
        try:
            # Import API clients
            from app.services.external_apis.nws_api import nws_client
            from app.services.external_apis.usgs_earthquake_api import usgs_earthquake_client
            from app.services.external_apis.volcano_monitor import volcano_monitor
            from app.services.ocean_safety_service import OceanSafetyService
            from app.services.crime_data_service import CrimeDataService
            from app.core.database import SessionLocal
            
            # Run all syncs concurrently
            tasks = [
                nws_client.sync_alerts(),
                usgs_earthquake_client.sync_earthquakes(),
                volcano_monitor.sync_volcano_alerts()
            ]
            
            # Add ocean safety monitoring
            try:
                ocean_conditions = await OceanSafetyService.fetch_ocean_conditions()
                if ocean_conditions:
                    db = SessionLocal()
                    try:
                        OceanSafetyService.create_ocean_safety_alerts(db, ocean_conditions)
                    finally:
                        db.close()
            except Exception as e:
                logger.error(f"Error monitoring ocean conditions: {e}")
            
            # Add crime data monitoring
            try:
                crime_incidents = await CrimeDataService.fetch_crime_data()
                if crime_incidents:
                    db = SessionLocal()
                    try:
                        CrimeDataService.create_crime_alerts(db, crime_incidents)
                    finally:
                        db.close()
            except Exception as e:
                logger.error(f"Error monitoring crime data: {e}")
            
            results = await asyncio.gather(*tasks, return_exceptions=True)
            
            # Log any errors
            for i, result in enumerate(results):
                if isinstance(result, Exception):
                    source_names = ["NWS", "USGS Earthquake", "Volcano Monitor"]
                    logger.error(f"Error syncing {source_names[i]}: {result}")
                    
            # Clean up expired alerts
            await self._cleanup_expired_alerts()
            
            logger.info("Alert sync completed")
            
        except Exception as e:
            logger.error(f"Critical error in alert sync: {e}")
            
    async def _cleanup_expired_alerts(self):
        """Remove expired alerts from the database."""
        from app.core.database import SessionLocal
        from app.models.models import Alert
        
        try:
            db = SessionLocal()
            try:
                # Mark expired alerts as inactive
                expired_count = db.query(Alert).filter(
                    Alert.expires_time < datetime.utcnow(),
                    Alert.is_active == True
                ).update({"is_active": False})
                
                db.commit()
                
                if expired_count > 0:
                    logger.info(f"Marked {expired_count} alerts as inactive")
                    
            finally:
                db.close()
                
        except Exception as e:
            logger.error(f"Error cleaning up expired alerts: {e}")
        
    async def process_alert(self, alert_data: Dict):
        """Process incoming alert."""
        alert_id = alert_data.get('id', str(datetime.utcnow().timestamp()))
        self.active_alerts[alert_id] = alert_data
        # In production, this would trigger WebSocket broadcasts
        return alert_data
        
    async def force_sync(self):
        """Force an immediate sync of all sources."""
        logger.info("Force sync requested")
        await self._sync_all_sources()