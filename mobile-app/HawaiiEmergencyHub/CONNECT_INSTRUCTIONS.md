# How to Connect to Hawaii Emergency Hub

Since Expo Go removed manual URL entry, here are your options:

## Option 1: Use the QR Code (Recommended)
1. The QR code should be visible at: http://localhost:8081
2. Open your iPhone Camera app
3. Point at the QR code on your Mac screen
4. Tap the notification to open in Expo Go

## Option 2: Send yourself the link
1. Send this URL to yourself via Messages/Email: 
   ```
   exp://192.168.4.97:8081
   ```
2. Open the message on your iPhone
3. Tap the link - it should open in Expo Go

## Option 3: Use a URL shortener
1. Go to a URL shortener like bit.ly
2. Shorten this URL: `exp://192.168.4.97:8081`
3. Access the short URL on your iPhone

## Option 4: Create a development build (more complex)
If none of the above work, you may need to create a development build:
```bash
npx eas build --profile development --platform ios
```

## Troubleshooting
- Ensure both devices are on the same WiFi
- Check Mac Firewall settings
- Try restarting both the Expo server and Expo Go app
- The server is running on: http://192.168.4.97:8081

The app includes all real-time emergency features we built!