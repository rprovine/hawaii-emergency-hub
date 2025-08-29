# Hawaii Emergency Hub - Mobile App

React Native mobile application for the Hawaii Emergency Hub system.

## Features

- **Real-time Emergency Alerts**: View active emergency alerts with severity levels
- **Interactive Alert Map**: See alert locations on an interactive map
- **Family Safety Check-in**: Mark yourself as safe and check on family members
- **Emergency Resources**: Quick access to emergency contacts and services
- **Offline Support**: Access critical information even without internet

## Screens

1. **Home Screen**: Dashboard with current emergency status and quick actions
2. **Alerts Screen**: List of all active emergency alerts
3. **Map Screen**: Interactive map showing alert locations
4. **Family Screen**: Family member status and check-in functionality
5. **Emergency Screen**: Emergency contacts, evacuation info, and emergency kit checklist

## Setup

1. Install dependencies:
```bash
npm install
```

2. Install iOS dependencies (macOS only):
```bash
cd ios && pod install
```

3. Start the development server:
```bash
npm start
```

4. Run on iOS:
```bash
npm run ios
```

5. Run on Android:
```bash
npm run android
```

## Project Structure

```
src/
├── components/      # Reusable UI components
├── constants/       # App constants (colors, configs)
├── navigation/      # Navigation configuration
├── screens/         # App screens
├── services/        # API services
├── types/          # TypeScript type definitions
└── utils/          # Utility functions
```

## API Integration

The app currently uses demo data but is designed to connect to the Hawaii Emergency Hub API. Update the API_BASE_URL in `src/services/api.ts` to connect to the production API.

## Building for Production

### iOS
```bash
expo build:ios
```

### Android
```bash
expo build:android
```

## Technologies

- React Native with Expo
- TypeScript
- React Navigation
- AsyncStorage for offline data
- Axios for API calls