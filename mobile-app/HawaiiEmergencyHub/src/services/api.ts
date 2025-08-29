import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { Alert, DashboardMetrics } from '../types';
import { noaaService } from './noaaApi';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
const CACHE_PREFIX = '@hawaii_emergency_cache_';
const CACHE_EXPIRY = 3600000; // 1 hour in milliseconds

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token if available
api.interceptors.request.use(async (config) => {
  try {
    const token = await AsyncStorage.getItem('@hawaii_emergency_auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (error) {
    console.error('Error getting auth token:', error);
  }
  return config;
});

// Cache management functions
const cacheData = async (key: string, data: any): Promise<void> => {
  try {
    const cacheItem = {
      data,
      timestamp: Date.now(),
    };
    await AsyncStorage.setItem(CACHE_PREFIX + key, JSON.stringify(cacheItem));
  } catch (error) {
    console.error('Error caching data:', error);
  }
};

const getCachedData = async (key: string): Promise<any | null> => {
  try {
    const cachedItem = await AsyncStorage.getItem(CACHE_PREFIX + key);
    if (!cachedItem) return null;

    const { data, timestamp } = JSON.parse(cachedItem);
    const isExpired = Date.now() - timestamp > CACHE_EXPIRY;

    if (isExpired) {
      await AsyncStorage.removeItem(CACHE_PREFIX + key);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error getting cached data:', error);
    return null;
  }
};

const isOnline = async (): Promise<boolean> => {
  const netInfo = await NetInfo.fetch();
  return netInfo.isConnected ?? false;
};

export const apiService = {
  // Dashboard
  getDashboardMetrics: async (): Promise<DashboardMetrics> => {
    const cacheKey = 'dashboard_metrics';
    
    try {
      if (await isOnline()) {
        const response = await api.get('/dashboard/metrics');
        await cacheData(cacheKey, response.data);
        return response.data;
      }
    } catch (error) {
      console.error('Error fetching metrics:', error);
    }

    // Try cache or demo data
    const cached = await getCachedData(cacheKey);
    return cached || demoData.metrics;
  },

  // Alerts
  getAlerts: async (limit?: number): Promise<{ alerts: Alert[] }> => {
    const cacheKey = `alerts_${limit || 'all'}`;
    
    try {
      if (await isOnline()) {
        // Try NOAA API first for real-time data
        try {
          const noaaAlerts = await noaaService.getHawaiiAlerts();
          if (noaaAlerts.length > 0) {
            const alertsData = { alerts: limit ? noaaAlerts.slice(0, limit) : noaaAlerts };
            await cacheData(cacheKey, alertsData);
            return alertsData;
          }
        } catch (noaaError) {
          console.error('NOAA API error, falling back to main API:', noaaError);
        }
        
        // Fallback to main API
        const response = await api.get('/alerts', { params: { limit } });
        await cacheData(cacheKey, response.data);
        return response.data;
      }
    } catch (error) {
      console.error('Error fetching alerts:', error);
    }

    // Try cache or demo data
    const cached = await getCachedData(cacheKey);
    return cached || { alerts: demoData.alerts };
  },

  getActiveAlerts: async (): Promise<Alert[]> => {
    const cacheKey = 'active_alerts';
    
    try {
      if (await isOnline()) {
        // Try NOAA API first for real-time data
        try {
          const noaaAlerts = await noaaService.getHawaiiAlerts();
          if (noaaAlerts.length > 0) {
            await cacheData(cacheKey, noaaAlerts);
            return noaaAlerts;
          }
        } catch (noaaError) {
          console.error('NOAA API error, falling back to main API:', noaaError);
        }
        
        // Fallback to main API
        const response = await api.get('/alerts/active');
        await cacheData(cacheKey, response.data.alerts);
        return response.data.alerts;
      }
    } catch (error) {
      console.error('Error fetching active alerts:', error);
    }

    // Try cache or demo data
    const cached = await getCachedData(cacheKey);
    return cached || demoData.alerts;
  },

  getAlertById: async (id: string): Promise<Alert | null> => {
    const cacheKey = `alert_${id}`;
    
    try {
      if (await isOnline()) {
        const response = await api.get(`/alerts/${id}`);
        await cacheData(cacheKey, response.data);
        return response.data;
      }
    } catch (error) {
      console.error('Error fetching alert:', error);
    }

    // Try cache or demo data
    const cached = await getCachedData(cacheKey);
    return cached || demoData.alerts.find(alert => alert.id === id) || null;
  },

  // Family Safety
  updateFamilyStatus: async (status: string): Promise<void> => {
    try {
      if (await isOnline()) {
        await api.post('/family/status', { status });
      } else {
        // Queue for later sync
        const queueKey = 'offline_queue';
        const queue = await AsyncStorage.getItem(queueKey);
        const queueData = queue ? JSON.parse(queue) : [];
        queueData.push({
          type: 'family_status',
          status,
          timestamp: Date.now(),
        });
        await AsyncStorage.setItem(queueKey, JSON.stringify(queueData));
      }
    } catch (error) {
      console.error('Error updating family status:', error);
    }
  },

  getFamilyMembers: async (): Promise<any[]> => {
    const response = await api.get('/family/members');
    return response.data;
  },

  // Emergency Contacts
  getEmergencyContacts: async (): Promise<any[]> => {
    const cacheKey = 'emergency_contacts';
    
    try {
      if (await isOnline()) {
        const response = await api.get('/emergency/contacts');
        await cacheData(cacheKey, response.data);
        return response.data;
      }
    } catch (error) {
      console.error('Error fetching emergency contacts:', error);
    }

    // Try cache or return empty array
    const cached = await getCachedData(cacheKey);
    return cached || [];
  },

  // Get tsunami warnings
  getTsunamiWarnings: async (): Promise<Alert[]> => {
    const cacheKey = 'tsunami_warnings';
    
    try {
      if (await isOnline()) {
        const tsunamiAlerts = await noaaService.getTsunamiAlerts();
        if (tsunamiAlerts.length > 0) {
          await cacheData(cacheKey, tsunamiAlerts);
          return tsunamiAlerts;
        }
      }
    } catch (error) {
      console.error('Error fetching tsunami warnings:', error);
    }

    // Try cache
    const cached = await getCachedData(cacheKey);
    return cached || [];
  },

  // Sync offline data when back online
  syncOfflineData: async (): Promise<void> => {
    try {
      if (!(await isOnline())) return;

      const queueKey = 'offline_queue';
      const queue = await AsyncStorage.getItem(queueKey);
      if (!queue) return;

      const queueData = JSON.parse(queue);
      for (const item of queueData) {
        if (item.type === 'family_status') {
          await api.post('/family/status', { status: item.status });
        }
      }

      // Clear queue after successful sync
      await AsyncStorage.removeItem(queueKey);
    } catch (error) {
      console.error('Error syncing offline data:', error);
    }
  },
};

// Fallback data for demo/offline mode
export const demoData = {
  alerts: [
    {
      id: 'tsunami-2024-01-30',
      title: 'TSUNAMI WARNING',
      description: 'A TSUNAMI WARNING IS IN EFFECT FOR THE STATE OF HAWAII. A series of powerful waves and strong currents may impact coasts for many hours after initial arrival. Move to higher ground or inland immediately.',
      severity: 'extreme' as const,
      category: 'tsunami',
      location_name: 'All Hawaiian Islands',
      affected_counties: ['All Counties'],
      created_at: new Date().toISOString(),
      time_until_expiry: 'ACTIVE NOW',
      is_active: true,
      latitude: 20.7984,
      longitude: -156.3319,
      radius_miles: 500,
    },
    {
      id: '1',
      title: 'Flash Flood Warning',
      description: 'Heavy rainfall causing flash flooding in low-lying areas',
      severity: 'severe' as const,
      category: 'weather',
      location_name: 'Hilo, Big Island',
      affected_counties: ['Hawaii County'],
      created_at: new Date().toISOString(),
      time_until_expiry: '2 hours',
      is_active: true,
      latitude: 19.7297,
      longitude: -155.0868,
      radius_miles: 10,
    },
    {
      id: '2',
      title: 'High Surf Advisory',
      description: 'Dangerous surf conditions on north shores',
      severity: 'moderate' as const,
      category: 'ocean',
      location_name: 'North Shore, Oahu',
      affected_counties: ['Honolulu County'],
      created_at: new Date().toISOString(),
      time_until_expiry: '6 hours',
      is_active: true,
      latitude: 21.6403,
      longitude: -158.0631,
      radius_miles: 15,
    },
    {
      id: '3',
      title: 'Tsunami Advisory',
      description: 'Small tsunami waves possible. Stay away from beaches',
      severity: 'critical' as const,
      category: 'tsunami',
      location_name: 'All Hawaiian Islands',
      affected_counties: ['All Counties'],
      created_at: new Date().toISOString(),
      time_until_expiry: '2 hours',
      is_active: true,
      latitude: 20.7984,
      longitude: -156.3319,
      radius_miles: 500,
    },
  ],
  metrics: {
    total_users: 15234,
    active_alerts: 3,
    alerts_today: 8,
    response_rate: 94.5,
    critical_alerts: 1,
    system_health: 98,
  },
};