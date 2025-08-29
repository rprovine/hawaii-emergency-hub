export interface Alert {
  id: string;
  title: string;
  description: string;
  severity: 'minor' | 'moderate' | 'severe' | 'extreme' | 'critical' | 'high';
  category: string;
  location_name: string;
  affected_counties?: string[];
  created_at: string;
  expires_at?: string;
  time_until_expiry: string;
  is_active?: boolean;
  latitude?: number;
  longitude?: number;
  radius_miles?: number;
  coordinates?: number[];
  affected_radius_km?: number;
}

export interface DashboardMetrics {
  total_users: number;
  active_alerts: number;
  alerts_today: number;
  response_rate: number;
  critical_alerts: number;
  system_health: number;
}

export interface FamilyMember {
  id: string;
  name: string;
  status: 'safe' | 'unsafe' | 'unknown' | 'needs_help';
  lastUpdate: Date;
  phoneNumber?: string;
  location?: string;
  avatarUrl?: string;
}

export interface EmergencyContact {
  id: string;
  name: string;
  number: string;
  type: 'police' | 'fire' | 'medical' | 'personal' | 'shelter' | 'other';
  available247: boolean;
  location?: string;
}

export interface NavigationParamList {
  Home: undefined;
  Alerts: undefined;
  Map: { alert?: Alert };
  Family: undefined;
  Emergency: undefined;
  Settings: undefined;
}