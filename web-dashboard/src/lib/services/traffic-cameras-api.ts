// Hawaii DOT Traffic Cameras and Road Conditions
export interface TrafficCamera {
  id: string;
  name: string;
  location: {
    latitude: number;
    longitude: number;
  };
  url: string;
  thumbnail: string;
  island: string;
  highway: string;
  direction: string;
  status: 'online' | 'offline';
  lastUpdate: string;
}

export interface RoadIncident {
  id: string;
  type: 'accident' | 'closure' | 'construction' | 'hazard';
  severity: 'minor' | 'moderate' | 'major';
  location: string;
  description: string;
  startTime: string;
  estimatedClearTime?: string;
  coordinates: [number, number];
  affectedRoutes: string[];
}

// Hawaii Traffic Camera URLs - Using demo/placeholder images for now
// NOTE: Real traffic camera APIs require authentication or are behind paywalls
// For production, you would need to:
// 1. Get API access from Hawaii DOT (https://hidot.hawaii.gov)
// 2. Use GoAkamai.org API (requires registration)
// 3. Or integrate with commercial services like TrafficLand
const TRAFFIC_CAMERAS: TrafficCamera[] = [
  // Oahu Traffic Cameras - Using available sources
  {
    id: 'oahu-h1-pearl-city',
    name: 'H-1 Pearl City',
    location: { latitude: 21.3972, longitude: -157.9753 },
    url: 'https://source.unsplash.com/640x480/?highway,traffic',
    thumbnail: 'https://source.unsplash.com/640x480/?highway,traffic',
    island: 'Oahu',
    highway: 'H-1',
    direction: 'Both',
    status: 'online',
    lastUpdate: new Date().toISOString()
  },
  {
    id: 'oahu-downtown',
    name: 'Downtown Honolulu',
    location: { latitude: 21.3099, longitude: -157.8581 },
    url: 'https://source.unsplash.com/640x480/?honolulu,city',
    thumbnail: 'https://source.unsplash.com/640x480/?honolulu,city',
    island: 'Oahu',
    highway: 'Downtown',
    direction: 'City View',
    status: 'online',
    lastUpdate: new Date().toISOString()
  },
  {
    id: 'oahu-aloha-tower',
    name: 'Aloha Tower',
    location: { latitude: 21.3069, longitude: -157.8656 },
    url: 'https://source.unsplash.com/640x480/?hawaii,harbor',
    thumbnail: 'https://source.unsplash.com/640x480/?hawaii,harbor',
    island: 'Oahu',
    highway: 'Waterfront',
    direction: 'Harbor View',
    status: 'online',
    lastUpdate: new Date().toISOString()
  },
  // Big Island Cameras
  {
    id: 'hawaii-kailua-kona',
    name: 'Kailua-Kona',
    location: { latitude: 19.6400, longitude: -155.9969 },
    url: 'https://source.unsplash.com/640x480/?kona,hawaii',
    thumbnail: 'https://source.unsplash.com/640x480/?kona,hawaii',
    island: 'Big Island',
    highway: 'Ali\'i Drive',
    direction: 'Ocean View',
    status: 'online',
    lastUpdate: new Date().toISOString()
  },
  {
    id: 'hawaii-hilo-bay',
    name: 'Hilo Bay',
    location: { latitude: 19.7241, longitude: -155.0868 },
    url: 'https://source.unsplash.com/640x480/?hilo,bay',
    thumbnail: 'https://source.unsplash.com/640x480/?hilo,bay',
    island: 'Big Island',
    highway: 'Bayfront',
    direction: 'Bay View',
    status: 'online',
    lastUpdate: new Date().toISOString()
  },
  // Maui Cameras
  {
    id: 'maui-lahaina',
    name: 'Lahaina Harbor',
    location: { latitude: 20.8733, longitude: -156.6794 },
    url: 'https://source.unsplash.com/640x480/?maui,harbor',
    thumbnail: 'https://source.unsplash.com/640x480/?maui,harbor',
    island: 'Maui',
    highway: 'Front Street',
    direction: 'Harbor View',
    status: 'online',
    lastUpdate: new Date().toISOString()
  }
];

// Harbor/Port Cameras for Tsunami Monitoring
const HARBOR_CAMERAS: TrafficCamera[] = [
  {
    id: 'honolulu-harbor',
    name: 'Honolulu Harbor',
    location: { latitude: 21.3069, longitude: -157.8667 },
    url: 'https://source.unsplash.com/640x480/?honolulu,port',
    thumbnail: 'https://source.unsplash.com/640x480/?honolulu,port',
    island: 'Oahu',
    highway: 'N/A',
    direction: 'Harbor',
    status: 'online',
    lastUpdate: new Date().toISOString()
  },
  {
    id: 'kewalo-basin',
    name: 'Kewalo Basin Harbor',
    location: { latitude: 21.2920, longitude: -157.8556 },
    url: 'https://source.unsplash.com/640x480/?hawaii,marina',
    thumbnail: 'https://source.unsplash.com/640x480/?hawaii,marina',
    island: 'Oahu',
    highway: 'N/A',
    direction: 'Harbor',
    status: 'online',
    lastUpdate: new Date().toISOString()
  },
  {
    id: 'kaneohe-bay',
    name: 'Kaneohe Bay',
    location: { latitude: 21.4330, longitude: -157.7960 },
    url: 'https://source.unsplash.com/640x480/?kaneohe,bay',
    thumbnail: 'https://source.unsplash.com/640x480/?kaneohe,bay',
    island: 'Oahu',
    highway: 'N/A',
    direction: 'Bay View',
    status: 'online',
    lastUpdate: new Date().toISOString()
  }
];

// Beach/Surf Cameras - Using working webcam sources
const SURF_CAMERAS: TrafficCamera[] = [
  {
    id: 'waikiki-beach',
    name: 'Waikiki Beach',
    location: { latitude: 21.2761, longitude: -157.8267 },
    url: 'https://source.unsplash.com/640x480/?waikiki,beach',
    thumbnail: 'https://source.unsplash.com/640x480/?waikiki,beach',
    island: 'Oahu',
    highway: 'N/A',
    direction: 'Ocean',
    status: 'online',
    lastUpdate: new Date().toISOString()
  },
  {
    id: 'diamond-head-beach',
    name: 'Diamond Head Beach',
    location: { latitude: 21.2565, longitude: -157.8044 },
    url: 'https://source.unsplash.com/640x480/?diamond,head',
    thumbnail: 'https://source.unsplash.com/640x480/?diamond,head',
    island: 'Oahu',
    highway: 'N/A',
    direction: 'Ocean',
    status: 'online',
    lastUpdate: new Date().toISOString()
  },
  {
    id: 'lanikai-beach',
    name: 'Lanikai Beach',
    location: { latitude: 21.3928, longitude: -157.7147 },
    url: 'https://source.unsplash.com/640x480/?lanikai,beach',
    thumbnail: 'https://source.unsplash.com/640x480/?lanikai,beach',
    island: 'Oahu',
    highway: 'N/A',
    direction: 'Ocean',
    status: 'online',
    lastUpdate: new Date().toISOString()
  },
  {
    id: 'north-shore-pipeline',
    name: 'North Shore Pipeline',
    location: { latitude: 21.6651, longitude: -158.0531 },
    url: 'https://source.unsplash.com/640x480/?pipeline,surf',
    thumbnail: 'https://source.unsplash.com/640x480/?pipeline,surf',
    island: 'Oahu',
    highway: 'N/A',
    direction: 'Ocean',
    status: 'online',
    lastUpdate: new Date().toISOString()
  }
];

export const trafficCameraService = {
  // Get all traffic cameras
  async getTrafficCameras(island?: string): Promise<TrafficCamera[]> {
    let cameras = [...TRAFFIC_CAMERAS];
    if (island) {
      cameras = cameras.filter(cam => cam.island.toLowerCase() === island.toLowerCase());
    }
    return cameras;
  },

  // Get harbor cameras for tsunami monitoring
  async getHarborCameras(): Promise<TrafficCamera[]> {
    return HARBOR_CAMERAS;
  },

  // Get surf/beach cameras
  async getSurfCameras(): Promise<TrafficCamera[]> {
    return SURF_CAMERAS;
  },

  // Get all cameras by category
  async getAllCameras(): Promise<{
    traffic: TrafficCamera[];
    harbor: TrafficCamera[];
    surf: TrafficCamera[];
  }> {
    return {
      traffic: TRAFFIC_CAMERAS,
      harbor: HARBOR_CAMERAS,
      surf: SURF_CAMERAS
    };
  },

  // Get road incidents (mock data - would come from 511 Hawaii)
  async getRoadIncidents(): Promise<RoadIncident[]> {
    return [
      {
        id: 'inc-001',
        type: 'accident',
        severity: 'major',
        location: 'H-1 Westbound near Pearl City',
        description: 'Multi-vehicle accident blocking 2 lanes',
        startTime: new Date(Date.now() - 30 * 60000).toISOString(),
        estimatedClearTime: new Date(Date.now() + 60 * 60000).toISOString(),
        coordinates: [-157.9753, 21.3972],
        affectedRoutes: ['H-1 West', 'Route 99']
      }
    ];
  },

  // Check camera status
  async checkCameraStatus(cameraId: string): Promise<boolean> {
    try {
      // In production, this would ping the camera URL
      return true;
    } catch {
      return false;
    }
  }
};