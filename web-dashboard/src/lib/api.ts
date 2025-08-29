// API service for fetching data from the backend
import { noaaService } from './services/noaa-api';

// Temporarily use mock data while backend is being fixed
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
const USE_MOCK_DATA = true; // Toggle this to switch between real API and mock data

export interface Alert {
  id: string;
  title: string;
  description: string;
  severity: 'minor' | 'moderate' | 'severe' | 'extreme' | 'critical' | 'high' | 'low';
  category: string;
  location_name: string;
  affected_counties: string[];
  created_at: string;
  time_until_expiry: string;
  is_active: boolean;
  latitude?: number;
  longitude?: number;
  radius_miles?: number;
  coordinates?: number[];
  affected_radius_km?: number;
  source?: string;
  instruction?: string;
}

export interface DashboardMetrics {
  active_alerts: number;
  total_users: number;
  alerts_last_24h: number;
  response_metrics: {
    average_response_minutes: number;
    median_response_minutes: number;
    '95th_percentile_minutes': number;
  };
  alerts_by_severity: Record<string, number>;
  alerts_by_county: Record<string, number>;
  timestamp: string;
}

export interface AlertTrend {
  date: string;
  count: number;
}

export interface SystemHealth {
  status: string;
  services: {
    api: string;
    database: string;
    websocket: string;
    redis: string;
  };
  timestamp: string;
}

export const api = {
  async getAlerts(limit = 10): Promise<{ alerts: Alert[]; total: number }> {
    try {
      // First try to get real NOAA alerts
      const noaaAlerts = await noaaService.getHawaiiAlerts();
      if (noaaAlerts.length > 0) {
        console.log('Using real NOAA alerts:', noaaAlerts.length);
        const alerts = limit ? noaaAlerts.slice(0, limit) : noaaAlerts;
        return { alerts, total: noaaAlerts.length };
      }
    } catch (noaaError) {
      console.error('Failed to fetch NOAA alerts, falling back to API:', noaaError);
    }
    
    // Fallback to local API
    try {
      const response = await fetch(`${API_URL}/alerts/?limit=${limit}`);
      if (!response.ok) throw new Error('Failed to fetch alerts');
      return response.json();
    } catch (apiError) {
      console.error('API error:', apiError);
      // Return demo data as last resort
      return {
        alerts: [
          {
            id: 'alert-1',
            title: 'High Surf Warning',
            description: 'Large breaking waves of 25 to 35 feet along north facing shores.',
            severity: 'moderate' as const,
            category: 'weather',
            location_name: 'North Shore, Oahu',
            affected_counties: ['Honolulu County'],
            created_at: new Date().toISOString(),
            time_until_expiry: '24 hours',
            is_active: true,
            latitude: 21.6795,
            longitude: -158.0265,
            coordinates: [-158.0265, 21.6795],
            affected_radius_km: 25,
            radius_miles: 15,
            source: 'NWS'
          },
          {
            id: 'alert-2',
            title: 'Volcanic Activity Advisory',
            description: 'Kilauea volcano showing increased seismic activity.',
            severity: 'minor' as const,
            category: 'volcano',
            location_name: 'Hawaii Volcanoes National Park',
            affected_counties: ['Hawaii County'],
            created_at: new Date().toISOString(),
            time_until_expiry: '48 hours',
            is_active: true,
            latitude: 19.4194,
            longitude: -155.2885,
            coordinates: [-155.2885, 19.4194],
            affected_radius_km: 32,
            radius_miles: 20,
            source: 'USGS'
          },
          {
            id: 'alert-3',
            title: 'Flash Flood Watch',
            description: 'Heavy rainfall expected. Avoid low-lying areas.',
            severity: 'moderate' as const,
            category: 'weather',
            location_name: 'Windward Oahu',
            affected_counties: ['Honolulu County'],
            created_at: new Date().toISOString(),
            time_until_expiry: '12 hours',
            is_active: true,
            latitude: 21.4389,
            longitude: -157.7583,
            coordinates: [-157.7583, 21.4389],
            affected_radius_km: 16,
            radius_miles: 10,
            source: 'NWS'
          }
        ],
        total: 3
      };
    }
  },

  async getDashboardMetrics(): Promise<DashboardMetrics> {
    // Return mock metrics for now
    return {
      active_alerts: 3,
      total_users: 1524,
      alerts_last_24h: 5,
      response_metrics: {
        average_response_minutes: 12,
        median_response_minutes: 8,
        '95th_percentile_minutes': 25
      },
      alerts_by_severity: {
        minor: 1,
        moderate: 2,
        severe: 0,
        extreme: 0
      },
      alerts_by_county: {
        'Honolulu County': 2,
        'Hawaii County': 1
      },
      timestamp: new Date().toISOString()
    };
  },

  async getAlertTrends(days = 7): Promise<AlertTrend[]> {
    // Return mock trend data
    const trends: AlertTrend[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      trends.push({
        date: date.toISOString().split('T')[0],
        count: Math.floor(Math.random() * 5) + 1
      });
    }
    return trends;
  },

  async getSystemHealth(token?: string): Promise<SystemHealth> {
    const headers: HeadersInit = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    const response = await fetch(`${API_URL}/admin/system/health`, { headers });
    if (!response.ok) throw new Error('Failed to fetch system health');
    return response.json();
  },

  async getAlertStats(): Promise<any> {
    const response = await fetch(`${API_URL}/alerts/stats/summary`);
    if (!response.ok) throw new Error('Failed to fetch alert stats');
    return response.json();
  }
};