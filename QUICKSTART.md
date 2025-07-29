# 🚀 Hawaii Emergency Hub - Quick Start Guide

## Option 1: Automated Start (Recommended)

```bash
# Run the all-in-one startup script
./start-dev.sh
```

This will:
- Set up Python virtual environment
- Install backend dependencies
- Create database
- Start backend server (http://localhost:8000)
- Install frontend dependencies
- Start frontend (http://localhost:3000)

## Option 2: Manual Start

### Backend Setup
```bash
cd backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create database
python setup_database.py

# Start server
uvicorn app.main:app --reload
```

### Frontend Setup
```bash
# In a new terminal
cd web-dashboard

# Install dependencies
npm install

# Start development server
npm run dev
```

## 🧪 Testing the Application

1. Open http://localhost:3000
2. You'll see a login screen
3. Click "Register" tab and create an account
4. After login, you'll see:
   - Live emergency alerts from Hawaii
   - Dashboard with statistics
   - Alert severity indicators

## 📱 Test Premium Features

### Quick Test Script
```bash
python test_premium_features.py
```

### Manual Testing

1. **Register/Login**
   - Email: test@example.com
   - Password: testpass123

2. **View Live Alerts**
   - The dashboard shows real alerts from:
     - National Weather Service
     - USGS Earthquakes
     - Volcano monitoring

3. **Test Premium Features** (via API)
   ```bash
   # Get auth token
   curl -X POST http://localhost:8000/api/v1/auth/login \
     -H "Content-Type: application/x-www-form-urlencoded" \
     -d "username=test@example.com&password=testpass123"
   
   # Use the token for API calls
   export TOKEN="your-token-here"
   
   # Upgrade to premium
   curl -X POST http://localhost:8000/api/v1/auth/subscribe \
     -H "Authorization: Bearer $TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"tier": "premium"}'
   ```

## 🔍 API Documentation

- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## 🐛 Troubleshooting

### Backend won't start
```bash
# Check if port 8000 is in use
lsof -i :8000

# Kill the process if needed
kill -9 <PID>
```

### Frontend won't start
```bash
# Check if port 3000 is in use
lsof -i :3000

# Clear Next.js cache
rm -rf web-dashboard/.next
```

### Database errors
```bash
cd backend
rm hawaii_emergency.db
python setup_database.py
```

### No alerts showing
The system fetches live data every 5 minutes. To force a sync:
```bash
# Requires admin role
curl -X POST http://localhost:8000/api/v1/admin/sync/trigger \
  -H "Authorization: Bearer $TOKEN"
```

## 📝 Default Limits

### Free Tier
- 1 saved location
- 1 alert zone
- 100 API calls/day
- Web notifications only

### Premium Tier ($19.99/mo)
- 10 saved locations
- 10 alert zones
- 5,000 API calls/day
- SMS + Email notifications
- API key access

## 🎯 Next Steps

1. Configure real services (optional):
   - Stripe: Add `STRIPE_SECRET_KEY` to `.env`
   - Twilio: Add `TWILIO_ACCOUNT_SID` and `TWILIO_AUTH_TOKEN`
   - SendGrid: Add `SENDGRID_API_KEY`

2. Explore the dashboard:
   - Create custom alert zones
   - Set notification preferences
   - View alert analytics

3. Test the API:
   - Use the Swagger UI at http://localhost:8000/docs
   - Try the test script: `python test_premium_features.py`