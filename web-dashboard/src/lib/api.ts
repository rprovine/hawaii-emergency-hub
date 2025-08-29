// API service for fetching data from the backend
import { noaaService } from './services/noaa-api';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

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
            id: 'tsunami-demo',
            title: 'TSUNAMI WARNING',
            description: 'A TSUNAMI WARNING IS IN EFFECT. Move to higher ground immediately.',
            severity: 'extreme' as const,
            category: 'tsunami',
            location_name: 'All Hawaiian Islands',
            affected_counties: ['All Counties'],
            created_at: new Date().toISOString(),
            time_until_expiry: 'ACTIVE NOW',
            is_active: true,
            latitude: 20.7984,
            longitude: -156.3319,
            coordinates: [-156.3319, 20.7984],
            affected_radius_km: 500,
            source: 'Demo'
          }
        ],
        total: 1
      };
    }
  },

  async getDashboardMetrics(): Promise<DashboardMetrics> {
    const response = await fetch(`${API_URL}/analytics/dashboard`);
    if (!response.ok) throw new Error('Failed to fetch dashboard metrics');
    return response.json();
  },

  async getAlertTrends(days = 7): Promise<AlertTrend[]> {
    const response = await fetch(`${API_URL}/analytics/trends?days=${days}`);
    if (!response.ok) throw new Error('Failed to fetch alert trends');
    return response.json();
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