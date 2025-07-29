import logging
from typing import Dict, List, Optional
from datetime import datetime
import asyncio
from twilio.rest import Client as TwilioClient
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail, To, From, Content
from sqlalchemy.orm import Session
from app.core.config import settings
from app.models.models import User, Alert, Notification, NotificationChannel, AlertSeverity
import httpx

logger = logging.getLogger(__name__)

class NotificationService:
    """Handle multi-channel notifications for alerts"""
    
    def __init__(self):
        # Initialize Twilio
        if settings.TWILIO_ACCOUNT_SID and settings.TWILIO_AUTH_TOKEN:
            self.twilio_client = TwilioClient(
                settings.TWILIO_ACCOUNT_SID,
                settings.TWILIO_AUTH_TOKEN
            )
        else:
            self.twilio_client = None
            logger.warning("Twilio credentials not configured")
        
        # Initialize SendGrid
        if settings.SENDGRID_API_KEY:
            self.sendgrid_client = SendGridAPIClient(settings.SENDGRID_API_KEY)
        else:
            self.sendgrid_client = None
            logger.warning("SendGrid credentials not configured")
    
    async def send_alert_notifications(
        self,
        db: Session,
        alert: Alert,
        affected_users: List[User]
    ):
        """Send notifications to all affected users based on their preferences"""
        tasks = []
        
        for user in affected_users:
            # Check user's subscription allows notifications
            if not self._can_send_notifications(user):
                continue
            
            # Check severity threshold
            if not self._meets_severity_threshold(alert, user):
                continue
            
            # Check quiet hours
            if self._is_quiet_hours(user):
                continue
            
            # Get user's notification channels
            channels = db.query(NotificationChannel).filter(
                NotificationChannel.user_id == user.id,
                NotificationChannel.is_active == True,
                NotificationChannel.is_verified == True
            ).all()
            
            for channel in channels:
                # Check channel-specific settings
                if not self._channel_accepts_alert(channel, alert):
                    continue
                
                # Create notification task
                if channel.channel_type == "email":
                    tasks.append(self._send_email_notification(db, user, alert, channel))
                elif channel.channel_type == "sms":
                    tasks.append(self._send_sms_notification(db, user, alert, channel))
                elif channel.channel_type == "voice":
                    tasks.append(self._send_voice_notification(db, user, alert, channel))
        
        # Send all notifications concurrently
        if tasks:
            results = await asyncio.gather(*tasks, return_exceptions=True)
            for i, result in enumerate(results):
                if isinstance(result, Exception):
                    logger.error(f"Notification failed: {result}")
    
    def _can_send_notifications(self, user: User) -> bool:
        """Check if user's subscription allows notifications"""
        from app.services.subscription_service import SubscriptionService
        limits = SubscriptionService.get_user_limits(user)
        
        # Free tier only gets web/push notifications
        if user.subscription_tier.value == "free":
            return False
        
        return True
    
    def _meets_severity_threshold(self, alert: Alert, user: User) -> bool:
        """Check if alert meets user's severity threshold"""
        severity_order = {
            AlertSeverity.MINOR: 1,
            AlertSeverity.MODERATE: 2,
            AlertSeverity.SEVERE: 3,
            AlertSeverity.EXTREME: 4
        }
        
        alert_level = severity_order.get(alert.severity, 1)
        user_threshold = severity_order.get(user.severity_threshold, 1)
        
        return alert_level >= user_threshold
    
    def _is_quiet_hours(self, user: User) -> bool:
        """Check if current time is within user's quiet hours"""
        if not user.quiet_hours_start or not user.quiet_hours_end:
            return False
        
        # Convert to HST
        from zoneinfo import ZoneInfo
        now_hst = datetime.now(ZoneInfo("Pacific/Honolulu"))
        current_hour = now_hst.hour
        
        # Handle overnight quiet hours
        if user.quiet_hours_start > user.quiet_hours_end:
            return current_hour >= user.quiet_hours_start or current_hour < user.quiet_hours_end
        else:
            return user.quiet_hours_start <= current_hour < user.quiet_hours_end
    
    def _channel_accepts_alert(self, channel: NotificationChannel, alert: Alert) -> bool:
        """Check if channel accepts this type of alert"""
        if channel.severity_threshold:
            severity_order = {
                AlertSeverity.MINOR: 1,
                AlertSeverity.MODERATE: 2,
                AlertSeverity.SEVERE: 3,
                AlertSeverity.EXTREME: 4
            }
            
            alert_level = severity_order.get(alert.severity, 1)
            channel_threshold = severity_order.get(channel.severity_threshold, 1)
            
            if alert_level < channel_threshold:
                return False
        
        if channel.categories:
            if alert.category.value not in channel.categories:
                return False
        
        return True
    
    async def _send_email_notification(
        self,
        db: Session,
        user: User,
        alert: Alert,
        channel: NotificationChannel
    ):
        """Send email notification"""
        try:
            if not self.sendgrid_client:
                logger.warning("SendGrid not configured, skipping email")
                return
            
            # Create notification record
            notification = Notification(
                user_id=user.id,
                alert_id=alert.id,
                channel="email",
                status="pending"
            )
            db.add(notification)
            db.commit()
            
            # Prepare email content
            subject = f"[{alert.severity.value.upper()}] {alert.title}"
            
            # Get translated content if available
            content = alert.description
            if user.preferred_language != "en" and alert.translations:
                lang_content = alert.translations.get(user.preferred_language, {})
                content = lang_content.get("description", content)
            
            html_content = f"""
            <html>
                <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="background-color: #{self._get_severity_color(alert.severity)}; color: white; padding: 20px; text-align: center;">
                        <h1 style="margin: 0;">{alert.severity.value.upper()} ALERT</h1>
                    </div>
                    <div style="padding: 20px;">
                        <h2>{alert.title}</h2>
                        <p>{content}</p>
                        <p><strong>Location:</strong> {alert.location_name or 'Hawaii'}</p>
                        <p><strong>Effective:</strong> {alert.effective_time.strftime('%Y-%m-%d %H:%M HST')}</p>
                        {f'<p><strong>Expires:</strong> {alert.expires_time.strftime("%Y-%m-%d %H:%M HST")}</p>' if alert.expires_time else ''}
                        <hr>
                        <p style="text-align: center; margin-top: 30px;">
                            <a href="https://hawaii-emergency.com/alerts/{alert.id}" 
                               style="background-color: #0066cc; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
                                View Full Alert
                            </a>
                        </p>
                        <p style="font-size: 12px; color: #666; margin-top: 30px;">
                            You received this alert because you are subscribed to Hawaii Emergency Network Hub.
                            <a href="https://hawaii-emergency.com/settings/notifications">Manage your notification preferences</a>
                        </p>
                    </div>
                </body>
            </html>
            """
            
            message = Mail(
                from_email=From(settings.SENDGRID_FROM_EMAIL, "Hawaii Emergency Network"),
                to_emails=To(channel.destination or user.email),
                subject=subject,
                html_content=Content("text/html", html_content)
            )
            
            # Send email
            response = self.sendgrid_client.send(message)
            
            # Update notification status
            notification.sent_at = datetime.utcnow()
            notification.status = "sent" if response.status_code == 202 else "failed"
            if response.status_code != 202:
                notification.error_message = f"SendGrid returned {response.status_code}"
            
            # Update channel last used
            channel.last_used = datetime.utcnow()
            db.commit()
            
        except Exception as e:
            logger.error(f"Failed to send email to {user.email}: {e}")
            if 'notification' in locals():
                notification.status = "failed"
                notification.error_message = str(e)
                db.commit()
    
    async def _send_sms_notification(
        self,
        db: Session,
        user: User,
        alert: Alert,
        channel: NotificationChannel
    ):
        """Send SMS notification"""
        try:
            if not self.twilio_client:
                logger.warning("Twilio not configured, skipping SMS")
                return
            
            # Check if user can receive SMS
            from app.services.subscription_service import SubscriptionService
            if not SubscriptionService.can_user_access_feature(user, "sms_enabled"):
                logger.info(f"User {user.id} subscription doesn't include SMS")
                return
            
            # Create notification record
            notification = Notification(
                user_id=user.id,
                alert_id=alert.id,
                channel="sms",
                status="pending"
            )
            db.add(notification)
            db.commit()
            
            # Prepare SMS content (limited to 160 chars)
            severity = alert.severity.value.upper()
            location = alert.location_name or "Hawaii"
            
            # Get translated content if needed
            title = alert.title
            if user.preferred_language != "en" and alert.translations:
                lang_content = alert.translations.get(user.preferred_language, {})
                title = lang_content.get("title", title)
            
            message_body = f"{severity}: {title}\nLocation: {location}\nReply STOP to unsubscribe"
            
            # Truncate if too long
            if len(message_body) > 160:
                message_body = message_body[:157] + "..."
            
            # Send SMS
            message = self.twilio_client.messages.create(
                body=message_body,
                from_=settings.TWILIO_PHONE_NUMBER,
                to=channel.destination or user.phone
            )
            
            # Update notification status
            notification.sent_at = datetime.utcnow()
            notification.status = "sent" if message.sid else "failed"
            if message.error_code:
                notification.error_message = message.error_message
            
            # Update channel last used
            channel.last_used = datetime.utcnow()
            db.commit()
            
        except Exception as e:
            logger.error(f"Failed to send SMS to user {user.id}: {e}")
            if 'notification' in locals():
                notification.status = "failed"
                notification.error_message = str(e)
                db.commit()
    
    async def _send_voice_notification(
        self,
        db: Session,
        user: User,
        alert: Alert,
        channel: NotificationChannel
    ):
        """Send voice call notification for critical alerts"""
        try:
            if not self.twilio_client:
                logger.warning("Twilio not configured, skipping voice call")
                return
            
            # Check if user can receive voice calls
            from app.services.subscription_service import SubscriptionService
            if not SubscriptionService.can_user_access_feature(user, "voice_enabled"):
                logger.info(f"User {user.id} subscription doesn't include voice calls")
                return
            
            # Only for severe/extreme alerts
            if alert.severity not in [AlertSeverity.SEVERE, AlertSeverity.EXTREME]:
                return
            
            # Create notification record
            notification = Notification(
                user_id=user.id,
                alert_id=alert.id,
                channel="voice",
                status="pending"
            )
            db.add(notification)
            db.commit()
            
            # Create TwiML for voice message
            twiml = f"""
            <Response>
                <Say voice="alice" language="en-US">
                    This is an emergency alert from Hawaii Emergency Network.
                    {alert.severity.value} alert: {alert.title}.
                    Location: {alert.location_name or 'Hawaii'}.
                    Please check your email or app for more details.
                    Press 1 to hear this message again.
                </Say>
                <Gather numDigits="1" action="/api/v1/voice/repeat/{alert.id}">
                    <Say>Press 1 to repeat this message.</Say>
                </Gather>
            </Response>
            """
            
            # Make voice call
            call = self.twilio_client.calls.create(
                twiml=twiml,
                from_=settings.TWILIO_PHONE_NUMBER,
                to=channel.destination or user.phone
            )
            
            # Update notification status
            notification.sent_at = datetime.utcnow()
            notification.status = "sent" if call.sid else "failed"
            
            # Update channel last used
            channel.last_used = datetime.utcnow()
            db.commit()
            
        except Exception as e:
            logger.error(f"Failed to make voice call to user {user.id}: {e}")
            if 'notification' in locals():
                notification.status = "failed"
                notification.error_message = str(e)
                db.commit()
    
    def _get_severity_color(self, severity: AlertSeverity) -> str:
        """Get color code for severity level"""
        colors = {
            AlertSeverity.MINOR: "f39c12",
            AlertSeverity.MODERATE: "e67e22",
            AlertSeverity.SEVERE: "e74c3c",
            AlertSeverity.EXTREME: "c0392b"
        }
        return colors.get(severity, "333333")
    
    async def verify_channel(
        self,
        db: Session,
        user: User,
        channel: NotificationChannel
    ) -> bool:
        """Send verification code to channel"""
        import random
        import string
        
        # Generate verification code
        code = ''.join(random.choices(string.digits, k=6))
        channel.verification_code = code
        channel.verification_sent_at = datetime.utcnow()
        db.commit()
        
        try:
            if channel.channel_type == "email":
                # Send verification email
                if self.sendgrid_client:
                    message = Mail(
                        from_email=From(settings.SENDGRID_FROM_EMAIL, "Hawaii Emergency Network"),
                        to_emails=To(channel.destination),
                        subject="Verify your email for Hawaii Emergency Network",
                        html_content=f"""
                        <p>Your verification code is: <strong>{code}</strong></p>
                        <p>This code expires in 10 minutes.</p>
                        """
                    )
                    self.sendgrid_client.send(message)
                    return True
                    
            elif channel.channel_type == "sms":
                # Send verification SMS
                if self.twilio_client:
                    self.twilio_client.messages.create(
                        body=f"Hawaii Emergency Network verification code: {code}",
                        from_=settings.TWILIO_PHONE_NUMBER,
                        to=channel.destination
                    )
                    return True
            
            return False
            
        except Exception as e:
            logger.error(f"Failed to send verification: {e}")
            return False