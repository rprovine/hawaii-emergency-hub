#!/usr/bin/env python3
"""
Quick test script for Hawaii Emergency Hub premium features
"""
import requests
import json
import time

BASE_URL = "http://localhost:8000"
TEST_EMAIL = "premium_test@example.com"
TEST_PASSWORD = "testpass123"

class TestHawaiiEmergencyHub:
    def __init__(self):
        self.token = None
        self.api_key = None
        
    def test_registration(self):
        """Test user registration"""
        print("1. Testing registration...")
        response = requests.post(
            f"{BASE_URL}/api/v1/auth/register",
            json={
                "email": TEST_EMAIL,
                "password": TEST_PASSWORD,
                "full_name": "Premium Test User",
                "phone": "+18085551234"
            }
        )
        
        if response.status_code == 200:
            print("✅ Registration successful")
        elif response.status_code == 400:
            print("⚠️  User already exists (that's OK)")
        else:
            print(f"❌ Registration failed: {response.text}")
            
    def test_login(self):
        """Test login and get token"""
        print("\n2. Testing login...")
        response = requests.post(
            f"{BASE_URL}/api/v1/auth/token",
            data={
                "username": TEST_EMAIL,
                "password": TEST_PASSWORD
            }
        )
        
        if response.status_code == 200:
            data = response.json()
            self.token = data["access_token"]
            print(f"✅ Login successful")
            print(f"   Subscription tier: {data.get('subscription_tier', 'free')}")
        else:
            print(f"❌ Login failed: {response.text}")
            return False
        return True
        
    def test_user_info(self):
        """Get current user info"""
        print("\n3. Getting user info...")
        response = requests.get(
            f"{BASE_URL}/api/v1/auth/me",
            headers={"Authorization": f"Bearer {self.token}"}
        )
        
        if response.status_code == 200:
            data = response.json()
            print("✅ User info retrieved:")
            print(f"   Email: {data['email']}")
            print(f"   Subscription: {data['subscription']['tier']}")
            print(f"   API calls remaining: {data['subscription']['api_calls_remaining']}")
            print(f"   SMS enabled: {data['features']['sms_enabled']}")
            print(f"   Voice enabled: {data['features']['voice_enabled']}")
        else:
            print(f"❌ Failed to get user info: {response.text}")
            
    def test_subscription_upgrade(self):
        """Test upgrading to premium"""
        print("\n4. Testing subscription upgrade to PREMIUM...")
        response = requests.post(
            f"{BASE_URL}/api/v1/auth/subscribe",
            headers={"Authorization": f"Bearer {self.token}"},
            json={
                "tier": "premium",
                "is_annual": False
            }
        )
        
        if response.status_code == 200:
            data = response.json()
            print("✅ Subscription upgraded!")
            print(f"   Tier: {data['tier']}")
            if data.get('trial_end'):
                print(f"   Trial ends: {data['trial_end']}")
        else:
            print(f"❌ Subscription upgrade failed: {response.text}")
            
    def test_notification_channels(self):
        """Test adding notification channels"""
        print("\n5. Testing notification channels...")
        
        # Add email channel
        response = requests.post(
            f"{BASE_URL}/api/v1/notifications/channels",
            headers={"Authorization": f"Bearer {self.token}"},
            json={
                "channel_type": "email",
                "destination": TEST_EMAIL,
                "severity_threshold": "moderate"
            }
        )
        
        if response.status_code == 200:
            print("✅ Email channel added")
        else:
            print(f"⚠️  Email channel: {response.json().get('detail', 'Failed')}")
            
        # Add SMS channel (premium only)
        response = requests.post(
            f"{BASE_URL}/api/v1/notifications/channels",
            headers={"Authorization": f"Bearer {self.token}"},
            json={
                "channel_type": "sms",
                "destination": "+18085551234",
                "severity_threshold": "severe"
            }
        )
        
        if response.status_code == 200:
            print("✅ SMS channel added (premium feature)")
        else:
            print(f"⚠️  SMS channel: {response.json().get('detail', 'Failed')}")
            
    def test_alert_zones(self):
        """Test creating alert zones"""
        print("\n6. Testing alert zones...")
        
        zones = [
            {
                "name": "Home - Honolulu",
                "center_latitude": 21.3099,
                "center_longitude": -157.8581,
                "radius_miles": 5
            },
            {
                "name": "Work - Pearl Harbor",
                "center_latitude": 21.3531,
                "center_longitude": -157.9563,
                "radius_miles": 3
            },
            {
                "name": "Beach - Waikiki",
                "center_latitude": 21.2793,
                "center_longitude": -157.8292,
                "radius_miles": 2
            }
        ]
        
        created_zones = []
        for zone in zones:
            response = requests.post(
                f"{BASE_URL}/api/v1/zones",
                headers={"Authorization": f"Bearer {self.token}"},
                json=zone
            )
            
            if response.status_code == 200:
                data = response.json()
                created_zones.append(data['id'])
                print(f"✅ Created zone: {zone['name']}")
            else:
                print(f"⚠️  Zone creation failed: {response.json().get('detail', 'Failed')}")
                break
                
        return created_zones
        
    def test_api_key(self):
        """Test API key generation"""
        print("\n7. Testing API key generation...")
        response = requests.post(
            f"{BASE_URL}/api/v1/auth/generate-api-key",
            headers={"Authorization": f"Bearer {self.token}"}
        )
        
        if response.status_code == 200:
            data = response.json()
            self.api_key = data['api_key']
            print("✅ API key generated")
            print(f"   Key: {self.api_key[:10]}...")
            
            # Test using API key
            response = requests.get(
                f"{BASE_URL}/api/v1/alerts",
                headers={"Authorization": f"Bearer {self.api_key}"}
            )
            if response.status_code == 200:
                print("✅ API key authentication works")
        else:
            print(f"⚠️  API key generation: {response.json().get('detail', 'Failed')}")
            
    def test_live_alerts(self):
        """Check live alerts"""
        print("\n8. Checking live alerts...")
        response = requests.get(
            f"{BASE_URL}/api/v1/alerts",
            headers={"Authorization": f"Bearer {self.token}"}
        )
        
        if response.status_code == 200:
            alerts = response.json()
            print(f"✅ Found {len(alerts)} active alerts")
            
            # Show first 3 alerts
            for alert in alerts[:3]:
                print(f"   - [{alert['severity']}] {alert['title']}")
                print(f"     Source: {alert['source']}")
                print(f"     Location: {alert.get('location_name', 'Hawaii')}")
        else:
            print(f"❌ Failed to get alerts: {response.text}")
            
    def test_rate_limiting(self):
        """Test API rate limits"""
        print("\n9. Testing rate limits...")
        print("   Making 10 rapid API calls...")
        
        success_count = 0
        for i in range(10):
            response = requests.get(
                f"{BASE_URL}/api/v1/alerts",
                headers={"Authorization": f"Bearer {self.token}"}
            )
            if response.status_code == 200:
                success_count += 1
            elif response.status_code == 429:
                print(f"   Rate limit hit after {i} calls")
                break
                
        print(f"✅ Made {success_count} successful calls")
        
    def run_all_tests(self):
        """Run all tests"""
        print("🧪 Hawaii Emergency Hub - Premium Features Test")
        print("=" * 50)
        
        self.test_registration()
        
        if not self.test_login():
            print("\n❌ Cannot continue without login")
            return
            
        self.test_user_info()
        self.test_subscription_upgrade()
        
        # Wait a moment for subscription to process
        time.sleep(1)
        
        self.test_notification_channels()
        self.test_alert_zones()
        self.test_api_key()
        self.test_live_alerts()
        self.test_rate_limiting()
        
        print("\n" + "=" * 50)
        print("✅ Testing complete!")
        print("\nNext steps:")
        print("1. Check the web dashboard at http://localhost:3000")
        print("2. Configure Twilio/SendGrid for real notifications")
        print("3. Set up Stripe for real payments")

if __name__ == "__main__":
    tester = TestHawaiiEmergencyHub()
    tester.run_all_tests()