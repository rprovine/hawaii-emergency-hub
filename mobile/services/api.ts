import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

interface ApiOptions extends RequestInit {
  params?: Record<string, any>;
}

class ApiClient {
  private async getAuthToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem('@auth_token');
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  }

  async request<T>(endpoint: string, options: ApiOptions = {}): Promise<T> {
    const { params, ...fetchOptions } = options;
    
    // Build URL with query params
    const url = new URL(`${API_BASE_URL}${endpoint}`);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, value.toString());
        }
      });
    }

    // Add auth header
    const token = await this.getAuthToken();
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...fetchOptions.headers,
    };
    
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url.toString(), {
        ...fetchOptions,
        headers,
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
        throw new Error(error.detail || `HTTP ${response.status}`);
      }

      return response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Convenience methods
  get<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET', params });
  }

  post<T>(endpoint: string, data?: any, params?: Record<string, any>): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
      params,
    });
  }

  put<T>(endpoint: string, data?: any, params?: Record<string, any>): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
      params,
    });
  }

  delete<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE', params });
  }
}

const api = new ApiClient();

// Alert API
export const fetchNearbyAlerts = async (location: { latitude: number; longitude: number } | null) => {
  if (!location) return [];
  
  return api.get('/alerts/nearby/me', {
    latitude: location.latitude,
    longitude: location.longitude,
    radius_miles: 25,
  });
};

export const fetchAlerts = async (filters?: {
  severity?: string;
  category?: string;
  county?: string;
  active_only?: boolean;
}) => {
  return api.get('/alerts', filters);
};

export const fetchAlertById = async (alertId: string) => {
  return api.get(`/alerts/${alertId}`);
};

export const markAlertViewed = async (alertId: string) => {
  return api.post(`/alerts/${alertId}/view`);
};

export const dismissAlert = async (alertId: string) => {
  return api.post(`/alerts/${alertId}/dismiss`);
};

export const shareAlert = async (alertId: string) => {
  return api.post(`/alerts/${alertId}/share`);
};

// Statistics API
export const fetchAlertStats = async () => {
  return api.get('/alerts/stats/summary', { timeframe_hours: 24 });
};

// Auth API
export const login = async (email: string, password: string) => {
  const response = await api.post('/auth/login', { email, password });
  if (response.access_token) {
    await AsyncStorage.setItem('@auth_token', response.access_token);
  }
  return response;
};

export const register = async (data: {
  email: string;
  password: string;
  full_name: string;
  phone?: string;
}) => {
  return api.post('/auth/register', data);
};

export const logout = async () => {
  await AsyncStorage.removeItem('@auth_token');
  return api.post('/auth/logout');
};

// User API
export const updateUserProfile = async (data: any) => {
  return api.put('/users/me', data);
};

export const updateUserLocation = async (location: {
  latitude: number;
  longitude: number;
}) => {
  return api.put('/users/me/location', location);
};

export const updateNotificationPreferences = async (preferences: any) => {
  return api.put('/users/me/preferences', preferences);
};

// WebSocket connection
export const createWebSocketConnection = (userId: string, onMessage: (data: any) => void) => {
  const wsUrl = API_BASE_URL.replace('http', 'ws').replace('/api/v1', '');
  const ws = new WebSocket(`${wsUrl}/ws/alerts/${userId}`);
  
  ws.onopen = () => {
    console.log('WebSocket connected');
    ws.send(JSON.stringify({ type: 'ping' }));
  };
  
  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      onMessage(data);
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
    }
  };
  
  ws.onerror = (error) => {
    console.error('WebSocket error:', error);
  };
  
  ws.onclose = () => {
    console.log('WebSocket disconnected');
    // Implement reconnection logic here
  };
  
  return ws;
};