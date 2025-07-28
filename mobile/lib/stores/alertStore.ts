import { create } from 'zustand';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface LocationData {
  latitude: number;
  longitude: number;
  county?: string;
}

interface AlertPreferences {
  severityThreshold: 'minor' | 'moderate' | 'severe' | 'extreme';
  radiusMiles: number;
  pushEnabled: boolean;
  emailEnabled: boolean;
  smsEnabled: boolean;
  quietHoursEnabled: boolean;
  quietHoursStart: number;
  quietHoursEnd: number;
}

interface AlertStore {
  // Location
  location: LocationData | null;
  locationPermission: Location.PermissionStatus | null;
  setLocation: (location: LocationData) => void;
  requestLocationPermission: () => Promise<void>;
  
  // Preferences
  preferences: AlertPreferences;
  updatePreferences: (preferences: Partial<AlertPreferences>) => Promise<void>;
  
  // Alert states
  activeAlerts: any[];
  dismissedAlertIds: string[];
  setActiveAlerts: (alerts: any[]) => void;
  dismissAlert: (alertId: string) => void;
  
  // WebSocket
  wsConnected: boolean;
  setWsConnected: (connected: boolean) => void;
  
  // User
  user: any | null;
  setUser: (user: any) => void;
  
  // Initialization
  initialize: () => Promise<void>;
}

const defaultPreferences: AlertPreferences = {
  severityThreshold: 'minor',
  radiusMiles: 25,
  pushEnabled: true,
  emailEnabled: true,
  smsEnabled: false,
  quietHoursEnabled: false,
  quietHoursStart: 22,
  quietHoursEnd: 7,
};

export const useAlertStore = create<AlertStore>((set, get) => ({
  // Location
  location: null,
  locationPermission: null,
  
  setLocation: (location) => set({ location }),
  
  requestLocationPermission: async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      set({ locationPermission: status });
      
      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({});
        
        // Get county from coordinates
        const geocode = await Location.reverseGeocodeAsync({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
        
        const county = geocode[0]?.subregion || geocode[0]?.region;
        
        set({
          location: {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            county,
          },
        });
      }
    } catch (error) {
      console.error('Error requesting location permission:', error);
    }
  },
  
  // Preferences
  preferences: defaultPreferences,
  
  updatePreferences: async (newPreferences) => {
    const updatedPreferences = { ...get().preferences, ...newPreferences };
    set({ preferences: updatedPreferences });
    
    // Persist to storage
    try {
      await AsyncStorage.setItem(
        '@alert_preferences',
        JSON.stringify(updatedPreferences)
      );
    } catch (error) {
      console.error('Error saving preferences:', error);
    }
  },
  
  // Alert states
  activeAlerts: [],
  dismissedAlertIds: [],
  
  setActiveAlerts: (alerts) => set({ activeAlerts: alerts }),
  
  dismissAlert: (alertId) => {
    set((state) => ({
      dismissedAlertIds: [...state.dismissedAlertIds, alertId],
    }));
  },
  
  // WebSocket
  wsConnected: false,
  setWsConnected: (connected) => set({ wsConnected: connected }),
  
  // User
  user: null,
  setUser: (user) => set({ user }),
  
  // Initialization
  initialize: async () => {
    try {
      // Load preferences from storage
      const savedPreferences = await AsyncStorage.getItem('@alert_preferences');
      if (savedPreferences) {
        set({ preferences: JSON.parse(savedPreferences) });
      }
      
      // Load dismissed alerts
      const dismissedAlerts = await AsyncStorage.getItem('@dismissed_alerts');
      if (dismissedAlerts) {
        set({ dismissedAlertIds: JSON.parse(dismissedAlerts) });
      }
      
      // Request location permission
      await get().requestLocationPermission();
      
    } catch (error) {
      console.error('Error initializing store:', error);
    }
  },
}));