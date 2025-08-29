import axios from 'axios';
import { Alert } from '../types';

const NOAA_API_BASE = 'https://api.weather.gov';

// No API key required for NOAA Weather Service API
const noaaApi = axios.create({
  baseURL: NOAA_API_BASE,
  timeout: 10000,
  headers: {
    'Accept': 'application/geo+json',
    'User-Agent': 'HawaiiEmergencyHub/1.0 (contact@hawaiiemergencyhub.com)',
  },
});

// Map NOAA event types to our categories
const EVENT_CATEGORY_MAP: Record<string, string> = {
  'Tsunami Warning': 'tsunami',
  'Tsunami Watch': 'tsunami',
  'Tsunami Advisory': 'tsunami',
  'Hurricane Warning': 'hurricane',
  'Hurricane Watch': 'hurricane',
  'Tropical Storm Warning': 'tropical_storm',
  'Tropical Storm Watch': 'tropical_storm',
  'Flash Flood Warning': 'flood',
  'Flood Warning': 'flood',
  'Flood Watch': 'flood',
  'High Surf Warning': 'surf',
  'High Surf Advisory': 'surf',
  'Earthquake': 'earthquake',
  'Volcano Warning': 'volcano',
  'Red Flag Warning': 'wildfire',
  'Fire Weather Watch': 'wildfire',
};

// Map NOAA severity/urgency/certainty to our severity levels
const getSeverityLevel = (properties: any): Alert['severity'] => {
  const { severity, urgency, certainty } = properties;
  
  if (severity === 'Extreme' || urgency === 'Immediate') return 'extreme';
  if (severity === 'Severe') return 'critical';
  if (severity === 'Moderate' || urgency === 'Expected') return 'high';
  if (severity === 'Minor') return 'moderate';
  return 'minor';
};

// Convert NOAA alert to our Alert format
const convertNOAAAlert = (noaaAlert: any): Alert => {
  const properties = noaaAlert.properties;
  const geometry = noaaAlert.geometry;
  
  // Extract coordinates from geometry
  let latitude = 20.7984; // Hawaii center as default
  let longitude = -156.3319;
  
  if (geometry && geometry.coordinates && geometry.coordinates.length > 0) {
    // For polygons, calculate center point
    if (geometry.type === 'Polygon') {
      const coords = geometry.coordinates[0];
      longitude = coords.reduce((sum: number, coord: number[]) => sum + coord[0], 0) / coords.length;
      latitude = coords.reduce((sum: number, coord: number[]) => sum + coord[1], 0) / coords.length;
    }
  }
  
  // Calculate time until expiry
  const expires = new Date(properties.expires);
  const now = new Date();
  const hoursUntilExpiry = Math.max(0, Math.floor((expires.getTime() - now.getTime()) / (1000 * 60 * 60)));
  const timeUntilExpiry = hoursUntilExpiry > 0 ? `${hoursUntilExpiry} hours` : 'ACTIVE NOW';
  
  // Determine category
  const category = EVENT_CATEGORY_MAP[properties.event] || 'other';
  
  return {
    id: properties.id,
    title: properties.event,
    description: properties.description || properties.headline,
    severity: getSeverityLevel(properties),
    category,
    location_name: properties.areaDesc,
    affected_counties: properties.geocode?.UGC || [],
    created_at: properties.sent,
    expires_at: properties.expires,
    time_until_expiry: timeUntilExpiry,
    is_active: properties.status === 'Actual',
    latitude,
    longitude,
    coordinates: [longitude, latitude],
    radius_miles: 50, // Default radius, adjust based on alert type
    affected_radius_km: 80, // Default 80km
  };
};

export const noaaService = {
  // Get all active alerts for Hawaii
  async getHawaiiAlerts(): Promise<Alert[]> {
    try {
      const response = await noaaApi.get('/alerts/active', {
        params: {
          area: 'HI', // Hawaii state code
          status: 'actual',
          message_type: 'alert,update',
        },
      });
      
      if (response.data && response.data.features) {
        return response.data.features
          .map(convertNOAAAlert)
          .sort((a, b) => {
            // Sort by severity (extreme first)
            const severityOrder = ['extreme', 'critical', 'high', 'severe', 'moderate', 'minor'];
            return severityOrder.indexOf(a.severity) - severityOrder.indexOf(b.severity);
          });
      }
      
      return [];
    } catch (error) {
      console.error('Error fetching NOAA alerts:', error);
      throw error;
    }
  },
  
  // Get alerts by specific zone or county
  async getAlertsByZone(zoneId: string): Promise<Alert[]> {
    try {
      const response = await noaaApi.get('/alerts/active/zone/' + zoneId);
      
      if (response.data && response.data.features) {
        return response.data.features.map(convertNOAAAlert);
      }
      
      return [];
    } catch (error) {
      console.error('Error fetching zone alerts:', error);
      throw error;
    }
  },
  
  // Get a specific alert by ID
  async getAlertById(alertId: string): Promise<Alert | null> {
    try {
      const response = await noaaApi.get(`/alerts/${alertId}`);
      
      if (response.data) {
        return convertNOAAAlert(response.data);
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching alert by ID:', error);
      return null;
    }
  },
  
  // Get tsunami-specific alerts
  async getTsunamiAlerts(): Promise<Alert[]> {
    try {
      const allAlerts = await this.getHawaiiAlerts();
      return allAlerts.filter(alert => 
        alert.category === 'tsunami' || 
        alert.title.toLowerCase().includes('tsunami')
      );
    } catch (error) {
      console.error('Error fetching tsunami alerts:', error);
      return [];
    }
  },
};