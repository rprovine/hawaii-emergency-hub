# How to Connect to Hawaii Emergency Hub on iPhone

Since Expo Go isn't detecting the server automatically, here are your options:

## Option 1: Direct URL Entry (Recommended)
1. Open Expo Go on your iPhone
2. Look for "Enter URL manually" at the bottom
3. Type exactly: `exp://192.168.4.97:8081`
4. Press "Connect"

## Option 2: Use Expo's Web Interface
1. On your Mac, open: http://localhost:8081
2. If this shows a page, there should be a QR code
3. Scan with your iPhone camera (not Expo Go)

## Option 3: Use ngrok (if local network isn't working)
Since the tunnel says "ready" but isn't providing a public URL, you might need to:
1. Install ngrok: `brew install ngrok`
2. Run: `ngrok http 8081`
3. Use the ngrok URL in Expo Go

## Troubleshooting:
- Make sure your iPhone and Mac are on the same WiFi network
- Try disabling any VPN on either device
- Check your Mac's firewall settings
- Try: `exp://localhost:8081` if you're testing on simulator

The app includes all the real-time emergency features:
- NOAA weather alerts
- Earthquake monitoring
- Traffic cameras
- Volcano status
- Air quality/vog monitoring
- Tide predictions
- Fire detection
- Marine weather