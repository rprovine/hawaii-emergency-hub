#!/bin/bash

echo "🌺 Hawaii Emergency Hub - Subscription Upgrade"
echo "============================================="

# Get email and password
read -p "Enter your email: " EMAIL
read -sp "Enter your password: " PASSWORD
echo

# Login to get token
echo -e "\n🔐 Logging in..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=$EMAIL&password=$PASSWORD")

TOKEN=$(echo $LOGIN_RESPONSE | python3 -c "import sys, json; print(json.load(sys.stdin)['access_token'])")

if [ -z "$TOKEN" ]; then
    echo "❌ Login failed. Please check your credentials."
    exit 1
fi

echo "✅ Login successful!"

# Show current subscription
echo -e "\n📊 Checking current subscription..."
CURRENT=$(curl -s -X GET http://localhost:8000/api/v1/auth/me \
  -H "Authorization: Bearer $TOKEN")

CURRENT_TIER=$(echo $CURRENT | python3 -c "import sys, json; print(json.load(sys.stdin)['subscription']['tier'])")
echo "Current tier: $CURRENT_TIER"

# Show upgrade options
echo -e "\n💎 Available Tiers:"
echo "1. Essential ($9.99/month) - SMS notifications, 5 locations"
echo "2. Premium ($19.99/month) - SMS + Voice, 10 locations, API access"
echo "3. Business ($99.99/month) - Team features, 50 locations, custom branding"
echo "4. Cancel"

read -p "Select tier (1-4): " CHOICE

case $CHOICE in
    1) TIER="essential" ;;
    2) TIER="premium" ;;
    3) TIER="business" ;;
    4) echo "Cancelled."; exit 0 ;;
    *) echo "Invalid choice."; exit 1 ;;
esac

# Upgrade subscription
echo -e "\n🚀 Upgrading to $TIER..."
UPGRADE_RESPONSE=$(curl -s -X POST http://localhost:8000/api/v1/auth/subscribe \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"tier\": \"$TIER\", \"is_annual\": false}")

if echo $UPGRADE_RESPONSE | grep -q "success"; then
    echo "✅ Successfully upgraded to $TIER tier!"
    echo -e "\n🎉 Your new features are now active:"
    
    case $TIER in
        essential)
            echo "- 5 saved locations"
            echo "- SMS notifications"
            echo "- 1,000 API calls/day"
            ;;
        premium)
            echo "- 10 saved locations"
            echo "- SMS + Voice notifications"
            echo "- 5,000 API calls/day"
            echo "- API key generation"
            echo "- Family tracking"
            ;;
        business)
            echo "- 50 saved locations"
            echo "- All notification types"
            echo "- 10,000 API calls/day"
            echo "- Team management"
            echo "- Custom branding"
            ;;
    esac
else
    echo "❌ Upgrade failed: $UPGRADE_RESPONSE"
fi