// USGS Earthquake and Volcano Data API Integration
const USGS_EARTHQUAKE_API = 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary';
const USGS_VOLCANO_API = 'https://volcanoes.usgs.gov/vsc/api';
const HVO_API = 'https://www.usgs.gov/observatories/hawaiian-volcano-observatory';

interface Earthquake {
  id: string;
  properties: {
    mag: number;
    place: string;
    time: number;
    updated: number;
    tz: number;
    url: string;
    detail: string;
    felt: number;
    cdi: number;
    mmi: number;
    alert: string;
    status: string;
    tsunami: number;
    sig: number;
    net: string;
    code: string;
    ids: string;
    sources: string;
    types: string;
    nst: number;
    dmin: number;
    rms: number;
    gap: number;
    magType: string;
    type: string;
    title: string;
  };
  geometry: {
    type: string;
    coordinates: [number, number, number];
  };
}

export const usgsService = {
  // Get recent earthquakes in Hawaii region
  async getHawaiiEarthquakes(days: number = 7): Promise<Earthquake[]> {
    try {
      // Hawaii bounding box approximately
      const minLat = 18.0;
      const maxLat = 23.0;
      const minLon = -161.0;
      const maxLon = -154.0;
      
      const url = `${USGS_EARTHQUAKE_API}/all_day.geojson`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`USGS API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Filter for Hawaii region
      const hawaiiQuakes = data.features.filter((quake: Earthquake) => {
        const [lon, lat] = quake.geometry.coordinates;
        return lat >= minLat && lat <= maxLat && lon >= minLon && lon <= maxLon;
      });
      
      return hawaiiQuakes.sort((a: Earthquake, b: Earthquake) => 
        b.properties.time - a.properties.time
      );
    } catch (error) {
      console.error('Error fetching USGS earthquake data:', error);
      return [];
    }
  },

  // Get significant earthquakes (magnitude > 4.5)
  async getSignificantQuakes(): Promise<Earthquake[]> {
    try {
      const url = `${USGS_EARTHQUAKE_API}/significant_week.geojson`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`USGS API error: ${response.status}`);
      }
      
      const data = await response.json();
      return data.features;
    } catch (error) {
      console.error('Error fetching significant earthquakes:', error);
      return [];
    }
  },

  // Convert earthquake to alert format
  convertToAlert(earthquake: Earthquake): any {
    const mag = earthquake.properties.mag;
    const severity = mag >= 6.0 ? 'extreme' : 
                    mag >= 5.0 ? 'critical' :
                    mag >= 4.0 ? 'high' :
                    mag >= 3.0 ? 'moderate' : 'low';
    
    const [lon, lat, depth] = earthquake.geometry.coordinates;
    
    return {
      id: `quake-${earthquake.id}`,
      title: `M${mag.toFixed(1)} Earthquake`,
      description: `${earthquake.properties.place}. Depth: ${depth.toFixed(1)}km. ${earthquake.properties.tsunami ? 'TSUNAMI POSSIBLE' : ''}`,
      severity,
      category: 'earthquake',
      location_name: earthquake.properties.place,
      affected_counties: [],
      created_at: new Date(earthquake.properties.time).toISOString(),
      time_until_expiry: 'N/A',
      is_active: true,
      latitude: lat,
      longitude: lon,
      coordinates: [lon, lat],
      affected_radius_km: mag * 20, // Rough estimate
      source: 'USGS',
      instruction: mag >= 5.0 ? 'Drop, Cover, and Hold On. Check for damage and aftershocks.' : 'Be aware of possible aftershocks.',
      metadata: {
        magnitude: mag,
        depth: depth,
        felt: earthquake.properties.felt,
        tsunami: earthquake.properties.tsunami,
        url: earthquake.properties.url
      }
    };
  },

  // Get volcano status from Hawaiian Volcano Observatory
  async getVolcanoStatus(): Promise<any[]> {
    // Note: HVO doesn't have a public API, so we'd need to scrape or use RSS feeds
    // For now, return mock data structure
    return [
      {
        name: 'Kilauea',
        status: 'WATCH',
        alert_level: 'ORANGE',
        activity: 'Elevated seismic activity. Lava lake active in summit crater.',
        last_update: new Date().toISOString(),
        webcams: [
          'https://www.usgs.gov/volcanoes/kilauea/webcam/K3cam',
          'https://www.usgs.gov/volcanoes/kilauea/webcam/F1cam'
        ]
      },
      {
        name: 'Mauna Loa',
        status: 'ADVISORY',
        alert_level: 'YELLOW',
        activity: 'Not erupting. Earthquake rates remain slightly elevated.',
        last_update: new Date().toISOString(),
        webcams: [
          'https://www.usgs.gov/volcanoes/mauna-loa/webcam/M1cam'
        ]
      }
    ];
  }
};