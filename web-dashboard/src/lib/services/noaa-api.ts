// NOAA Weather Service API integration for real-time alerts
const NOAA_API_BASE = 'https://api.weather.gov';

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
const getSeverityLevel = (properties: any): string => {
  const { severity, urgency, certainty } = properties;
  
  if (severity === 'Extreme' || urgency === 'Immediate') return 'critical';
  if (severity === 'Severe') return 'high';
  if (severity === 'Moderate' || urgency === 'Expected') return 'moderate';
  if (severity === 'Minor') return 'low';
  return 'low';
};

// Convert NOAA alert to our Alert format
const convertNOAAAlert = (noaaAlert: any): any => {
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
    affected_radius_km: 80, // Default 80km
    source: 'NOAA',
    // Additional NOAA-specific fields
    instruction: properties.instruction,
    response: properties.response,
    parameters: properties.parameters,
  };
};

export const noaaService = {
  // Get all active alerts for Hawaii
  async getHawaiiAlerts(): Promise<any[]> {
    try {
      const response = await fetch(`${NOAA_API_BASE}/alerts/active?area=HI&status=actual&message_type=alert,update`, {
        headers: {
          'Accept': 'application/geo+json',
          'User-Agent': 'HawaiiEmergencyHub/1.0',
        },
      });
      
      if (!response.ok) {
        throw new Error(`NOAA API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data && data.features) {
        return data.features
          .map(convertNOAAAlert)
          .sort((a: any, b: any) => {
            // Sort by severity (critical first)
            const severityOrder = ['critical', 'high', 'moderate', 'low'];
            return severityOrder.indexOf(a.severity) - severityOrder.indexOf(b.severity);
          });
      }
      
      return [];
    } catch (error) {
      console.error('Error fetching NOAA alerts:', error);
      throw error;
    }
  },
  
  // Get tsunami-specific alerts
  async getTsunamiAlerts(): Promise<any[]> {
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