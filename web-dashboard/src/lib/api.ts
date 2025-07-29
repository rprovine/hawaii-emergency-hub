// API service for fetching data from the backend

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

export interface Alert {
  id: string;
  title: string;
  description: string;
  severity: 'minor' | 'moderate' | 'severe' | 'extreme';
  category: string;
  location_name: string;
  affected_counties: string[];
  created_at: string;
  time_until_expiry: string;
  is_active: boolean;
  latitude?: number;
  longitude?: number;
  radius_miles?: number;
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
    const response = await fetch(`${API_URL}/alerts/?limit=${limit}`);
    if (!response.ok) throw new Error('Failed to fetch alerts');
    return response.json();
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