# Hawaii Emergency Hub - Testing Guide

## 🚀 Quick Start Testing

### 1. Start the Backend Server

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt

# Run database migrations
python migrations/add_premium_features.py

# Start the server
uvicorn app.main:app --reload --port 8000
```

### 2. Start the Frontend

```bash
# In a new terminal
cd web-dashboard
npm install
npm run dev
```

The app will be available at http://localhost:3000

## 🧪 Testing Premium Features

### Step 1: Create a Test User

```bash
# Register a new user
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "testpass123",
    "full_name": "Test User",
    "phone": "+18085551234"
  }'
```

### Step 2: Login and Get Token

```bash
# Login
curl -X POST http://localhost:8000/api/v1/auth/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=test@example.com&password=testpass123"
```

Save the access_token from the response. You'll use it as `YOUR_TOKEN` in the following requests.

### Step 3: Check User Info

```bash
curl -X GET http://localhost:8000/api/v1/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN"
```

You should see:
- Current subscription tier (starts as "free")
- Feature limits
- API calls remaining

### Step 4: Test Subscription Upgrade

```bash
# Upgrade to Premium tier
curl -X POST http://localhost:8000/api/v1/auth/subscribe \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "tier": "premium"
  }'
```

Note: This will work in test mode without actual payment

### Step 5: Test Notification Channels

#### Add Email Channel
```bash
curl -X POST http://localhost:8000/api/v1/notifications/channels \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "channel_type": "email",
    "destination": "test@example.com",
    "severity_threshold": "moderate"
  }'
```

#### Add SMS Channel (Premium only)
```bash
curl -X POST http://localhost:8000/api/v1/notifications/channels \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "channel_type": "sms",
    "destination": "+18085551234",
    "severity_threshold": "severe"
  }'
```

### Step 6: Test Alert Zones

#### Create a Custom Zone
```bash
curl -X POST http://localhost:8000/api/v1/zones \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Home - Honolulu",
    "description": "5 mile radius around home",
    "center_latitude": 21.3099,
    "center_longitude": -157.8581,
    "radius_miles": 5,
    "severity_threshold": "moderate",
    "categories": ["weather", "tsunami", "earthquake"]
  }'
```

#### Test Zone Against Current Alerts
```bash
curl -X GET http://localhost:8000/api/v1/zones/ZONE_ID/test \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Step 7: View Live Alerts

```bash
# Get all active alerts
curl -X GET http://localhost:8000/api/v1/alerts \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Step 8: Test API Key (Premium feature)

```bash
# Generate API key
curl -X POST http://localhost:8000/api/v1/auth/generate-api-key \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Then use the API key for requests:
```bash
curl -X GET http://localhost:8000/api/v1/alerts \
  -H "Authorization: Bearer YOUR_API_KEY"
```

## 📱 Testing via Web Dashboard

1. Open http://localhost:3000
2. The dashboard should show live alerts from:
   - National Weather Service
   - USGS Earthquakes
   - Volcano monitoring

3. Login with your test account
4. Navigate to Settings to:
   - View subscription status
   - Add notification channels
   - Create alert zones

## 🧪 Testing Without External Services

If you don't have Twilio/SendGrid configured, you can still test:

1. **Mock Mode**: The notification service will log messages instead of sending
2. **Database Check**: Notifications are still recorded in the database
3. **View Logs**: Check console output for notification attempts

## 🔍 Verify Live Data Integration

The system automatically syncs data every 5 minutes. To verify:

1. Check logs for sync messages:
```
INFO: Starting NWS alert sync...
INFO: Starting USGS earthquake sync...
INFO: Starting volcano monitoring sync...
```

2. Force a manual sync:
```bash
curl -X POST http://localhost:8000/api/v1/admin/sync/trigger \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 🐛 Common Issues

### Database Not Found
```bash
# Create SQLite database
cd backend
python -c "from app.models.models import Base; from sqlalchemy import create_engine; engine = create_engine('sqlite:///hawaii_emergency.db'); Base.metadata.create_all(engine)"
```

### Missing Environment Variables
Create a `.env` file in the backend directory:
```env
SECRET_KEY=your-secret-key-here
DATABASE_URL=sqlite:///hawaii_emergency.db
REDIS_URL=redis://localhost:6379

# Optional - for full functionality
STRIPE_SECRET_KEY=sk_test_...
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
SENDGRID_API_KEY=SG...
```

### CORS Errors
Make sure the frontend URL is in the CORS origins list in `backend/app/main.py`

## 📊 Testing Premium Limits

### Free Tier Limits
- 1 saved location
- 1 alert zone
- 100 API calls/day
- Web notifications only

### Premium Tier ($19.99/mo)
- 10 saved locations
- 10 alert zones
- 5,000 API calls/day
- SMS + Email notifications
- Voice calls for severe alerts

Test limit enforcement:
```bash
# Try to create more zones than allowed
# Should fail on the 2nd zone for free users
for i in {1..3}; do
  curl -X POST http://localhost:8000/api/v1/zones \
    -H "Authorization: Bearer YOUR_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"name\": \"Zone $i\", \"center_latitude\": 21.3099, \"center_longitude\": -157.8581, \"radius_miles\": 5}"
done
```

## 🎯 Testing Checklist

- [ ] User registration works
- [ ] Login returns token with subscription info
- [ ] Live alerts appear on dashboard
- [ ] Subscription upgrade changes limits
- [ ] Notification channels can be added
- [ ] Alert zones can be created
- [ ] Zone testing shows matching alerts
- [ ] API key generation works (premium)
- [ ] Rate limits are enforced
- [ ] Resource limits prevent excess creation

## 🚨 Test Emergency Alert

To simulate an emergency alert:

1. Use the admin endpoint (requires admin role):
```bash
curl -X POST http://localhost:8000/api/v1/admin/test-alert \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "TEST: Tsunami Warning",
    "severity": "extreme",
    "category": "tsunami"
  }'
```

This will trigger notifications to all affected users based on their zones and preferences.