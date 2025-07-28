// Shared TypeScript types for Hawaii Emergency Network Hub

export type AlertSeverity = 'minor' | 'moderate' | 'severe' | 'extreme';

export type AlertCategory = 
  | 'weather'
  | 'earthquake' 
  | 'tsunami'
  | 'volcano'
  | 'wildfire'
  | 'flood'
  | 'hurricane'
  | 'civil'
  | 'health'
  | 'other';

export type UserRole = 'user' | 'admin' | 'government' | 'emergency_manager';

export interface Location {
  latitude: number;
  longitude: number;
  county?: string;
}

export interface Translation {
  title: string;
  description: string;
}

export interface Alert {
  id: string;
  externalId: string;
  title: string;
  description: string;
  severity: AlertSeverity;
  category: AlertCategory;
  locationName?: string;
  latitude?: number;
  longitude?: number;
  radiusMiles?: number;
  affectedCounties: string[];
  polygon?: GeoJSON.Polygon;
  effectiveTime: string;
  expiresTime?: string;
  createdAt: string;
  updatedAt?: string;
  source: string;
  sourceUrl?: string;
  translations?: Record<string, Translation>;
  metadata?: Record<string, any>;
  images: string[];
  isActive: boolean;
  isTest: boolean;
  timeUntilExpiry?: string;
  distanceMiles?: number;
}

export interface User {
  id: string;
  email: string;
  phone?: string;
  fullName?: string;
  preferredLanguage: string;
  role: UserRole;
  homeLocation?: Location;
  alertRadiusMiles: number;
  subscribedCounties: string[];
  pushEnabled: boolean;
  emailEnabled: boolean;
  smsEnabled: boolean;
  severityThreshold: AlertSeverity;
  quietHoursStart?: number;
  quietHoursEnd?: number;
  isActive: boolean;
  isVerified: boolean;
  createdAt: string;
  lastActive?: string;
  deviceTokens?: string[];
}

export interface Notification {
  id: string;
  userId: string;
  alertId: string;
  channel: 'push' | 'email' | 'sms';
  sentAt?: string;
  deliveredAt?: string;
  readAt?: string;
  status: 'pending' | 'sent' | 'delivered' | 'failed';
  errorMessage?: string;
}

export interface UserAlertInteraction {
  id: string;
  userId: string;
  alertId: string;
  viewedAt?: string;
  dismissedAt?: string;
  sharedAt?: string;
  feedback?: 'useful' | 'not_useful' | 'false_alarm';
}

export interface AlertStatistics {
  totalAlerts: number;
  activeAlerts: number;
  alertsBySeverity: Record<AlertSeverity, number>;
  alertsByCategory: Record<AlertCategory, number>;
  alertsByCounty: Record<string, number>;
  averageResponseTimeMinutes: number;
  peakAlertHour: number;
}

export interface ApiResponse<T> {
  data: T;
  status: 'success' | 'error';
  message?: string;
  timestamp: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  skip: number;
  limit: number;
  hasMore: boolean;
}

export interface WebSocketMessage {
  type: 'connection' | 'alert' | 'subscription' | 'ping' | 'pong' | 'error';
  data?: any;
  timestamp: string;
}

export interface AlertFilter {
  severity?: AlertSeverity;
  category?: AlertCategory;
  county?: string;
  activeOnly?: boolean;
  location?: Location & { radiusMiles: number };
  startDate?: string;
  endDate?: string;
}

export interface UserPreferences {
  severityThreshold: AlertSeverity;
  categories: AlertCategory[];
  counties: string[];
  radiusMiles: number;
  quietHoursEnabled: boolean;
  quietHoursStart: number;
  quietHoursEnd: number;
  language: string;
  theme: 'light' | 'dark' | 'system';
}

export interface AdminAction {
  id: string;
  adminId: string;
  actionType: string;
  targetType: string;
  targetId: string;
  changes?: Record<string, any>;
  reason?: string;
  ipAddress: string;
  performedAt: string;
}

export interface SystemHealth {
  status: 'healthy' | 'degraded' | 'down';
  services: {
    api: 'operational' | 'degraded' | 'down';
    database: 'operational' | 'degraded' | 'down';
    redis: 'operational' | 'degraded' | 'down';
    websocket: 'operational' | 'degraded' | 'down';
  };
  metrics: {
    activeConnections: number;
    averageLatency: number;
    errorRate: number;
    uptime: number;
  };
  timestamp: string;
}

// Hawaii-specific constants
export const HAWAII_COUNTIES = [
  'Hawaii County',
  'Maui County',
  'Honolulu County',
  'Kauai County',
  'Kalawao County'
] as const;

export const SUPPORTED_LANGUAGES = [
  'en', // English
  'haw', // Hawaiian
  'ja', // Japanese
  'ko', // Korean
  'tl', // Tagalog
  'zh' // Chinese
] as const;

export const HAWAII_BOUNDS = {
  north: 22.2356,
  south: 18.9106,
  east: -154.8067,
  west: -160.2471
} as const;