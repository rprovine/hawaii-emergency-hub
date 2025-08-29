// Comprehensive API Integration for Hawaii Emergency Hub
import { noaaService } from './noaa-api';
import { usgsService } from './usgs-api';
import { trafficCameraService } from './traffic-cameras-api';

// Additional API Services

// NOAA Tides and Currents
const NOAA_TIDES_API = 'https://api.tidesandcurrents.noaa.gov/api/prod/datagetter';

// Air Quality APIs
const AIRNOW_API = 'https://www.airnowapi.org/aq/observation/zipCode/current';
const PURPLEAIR_API = 'https://api.purpleair.com/v1/sensors';

// NASA FIRMS (Fire Information for Resource Management System)
const FIRMS_API = 'https://firms.modaps.eosdis.nasa.gov/api/area/csv';

// NOAA GOES Satellite
const GOES_API = 'https://www.star.nesdis.noaa.gov/goes/rest/api';

export interface TideData {
  station: string;
  time: string;
  height: number;
  type: 'high' | 'low';
  predictions: Array<{
    time: string;
    height: number;
    type: string;
  }>;
}

export interface AirQualityData {
  location: string;
  aqi: number;
  pm25: number;
  pm10: number;
  o3: number;
  no2: number;
  so2: number;
  co: number;
  vog_index?: number; // Hawaii-specific for volcanic smog
  category: 'good' | 'moderate' | 'unhealthy_sensitive' | 'unhealthy' | 'very_unhealthy' | 'hazardous';
}

export interface FireData {
  latitude: number;
  longitude: number;
  brightness: number;
  scan: number;
  track: number;
  acq_date: string;
  acq_time: string;
  satellite: string;
  confidence: number;
  frp: number; // Fire Radiative Power
}

export interface MarineWeather {
  zone: string;
  forecast: string;
  waveHeight: number;
  windSpeed: number;
  windDirection: string;
  swellHeight: number;
  swellPeriod: number;
  swellDirection: string;
  warnings: string[];
}

// Hawaii-specific tide stations
const HAWAII_TIDE_STATIONS = {
  'Honolulu': '1612340',
  'Hilo': '1617760',
  'Kahului': '1615680',
  'Nawiliwili': '1611400',
  'Kawaihae': '1617433'
};

export const comprehensiveApiService = {
  // Get all data for dashboard
  async getAllEmergencyData() {
    try {
      const [
        noaaAlerts,
        earthquakes,
        volcanoes,
        cameras,
        tides,
        airQuality,
        fires,
        marineWeather
      ] = await Promise.allSettled([
        noaaService.getHawaiiAlerts(),
        usgsService.getHawaiiEarthquakes(1), // Last 24 hours
        usgsService.getVolcanoStatus(),
        trafficCameraService.getAllCameras(),
        this.getTideData(),
        this.getAirQuality(),
        this.getActiveFireData(),
        this.getMarineWeather()
      ]);

      return {
        alerts: this.combineAllAlerts(noaaAlerts, earthquakes),
        volcanoes: volcanoes.status === 'fulfilled' ? volcanoes.value : [],
        cameras: cameras.status === 'fulfilled' ? cameras.value : {},
        tides: tides.status === 'fulfilled' ? tides.value : [],
        airQuality: airQuality.status === 'fulfilled' ? airQuality.value : [],
        fires: fires.status === 'fulfilled' ? fires.value : [],
        marineWeather: marineWeather.status === 'fulfilled' ? marineWeather.value : []
      };
    } catch (error) {
      console.error('Error fetching comprehensive data:', error);
      throw error;
    }
  },

  // Combine all alerts from different sources
  combineAllAlerts(noaaResult: any, earthquakeResult: any): any[] {
    const alerts = [];
    
    // Add NOAA alerts
    if (noaaResult.status === 'fulfilled' && noaaResult.value) {
      alerts.push(...noaaResult.value);
    }
    
    // Add earthquake alerts
    if (earthquakeResult.status === 'fulfilled' && earthquakeResult.value) {
      const quakeAlerts = earthquakeResult.value.map((eq: any) => 
        usgsService.convertToAlert(eq)
      );
      alerts.push(...quakeAlerts);
    }
    
    // Sort by severity and time
    return alerts.sort((a, b) => {
      const severityOrder = ['extreme', 'critical', 'high', 'severe', 'moderate', 'minor', 'low'];
      const severityDiff = severityOrder.indexOf(a.severity) - severityOrder.indexOf(b.severity);
      if (severityDiff !== 0) return severityDiff;
      
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  },

  // Get tide data for major Hawaii harbors
  async getTideData(): Promise<TideData[]> {
    try {
      const stations = Object.entries(HAWAII_TIDE_STATIONS);
      const tidePromises = stations.map(async ([name, id]) => {
        const now = new Date();
        const endDate = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        
        const params = new URLSearchParams({
          begin_date: now.toISOString().slice(0, 10).replace(/-/g, ''),
          end_date: endDate.toISOString().slice(0, 10).replace(/-/g, ''),
          station: id,
          product: 'predictions',
          datum: 'MLLW',
          units: 'english',
          time_zone: 'lst_ldt',
          format: 'json',
          interval: 'hilo'
        });
        
        const response = await fetch(`${NOAA_TIDES_API}?${params}`);
        const data = await response.json();
        
        return {
          station: name,
          time: now.toISOString(),
          height: 0, // Current height would come from water_level product
          type: 'high' as const,
          predictions: data.predictions || []
        };
      });
      
      return await Promise.all(tidePromises);
    } catch (error) {
      console.error('Error fetching tide data:', error);
      return [];
    }
  },

  // Get air quality data including vog levels
  async getAirQuality(): Promise<AirQualityData[]> {
    // In production, would use real APIs with API keys
    // Mock data for Hawaii locations
    return [
      {
        location: 'Honolulu',
        aqi: 42,
        pm25: 10.5,
        pm10: 18,
        o3: 0.045,
        no2: 0.012,
        so2: 0.003,
        co: 0.4,
        vog_index: 1, // Low
        category: 'good'
      },
      {
        location: 'Kona',
        aqi: 85,
        pm25: 28.5,
        pm10: 45,
        o3: 0.055,
        no2: 0.018,
        so2: 0.125, // Higher due to vog
        co: 0.5,
        vog_index: 4, // High
        category: 'moderate'
      },
      {
        location: 'Hilo',
        aqi: 58,
        pm25: 15.5,
        pm10: 25,
        o3: 0.048,
        no2: 0.015,
        so2: 0.045,
        co: 0.4,
        vog_index: 2, // Moderate
        category: 'moderate'
      }
    ];
  },

  // Get active fire data from NASA FIRMS
  async getActiveFireData(): Promise<FireData[]> {
    // In production, would use FIRMS API with proper authentication
    // Mock data for demonstration
    return [
      {
        latitude: 19.4069,
        longitude: -155.2834,
        brightness: 320.5,
        scan: 1.0,
        track: 1.0,
        acq_date: new Date().toISOString().split('T')[0],
        acq_time: '0230',
        satellite: 'MODIS',
        confidence: 85,
        frp: 15.2
      }
    ];
  },

  // Get marine weather and small craft advisories
  async getMarineWeather(): Promise<MarineWeather[]> {
    try {
      // Would integrate with NOAA Marine Weather API
      return [
        {
          zone: 'Hawaiian Waters',
          forecast: 'Small Craft Advisory in effect. Seas 8-12 ft.',
          waveHeight: 10,
          windSpeed: 25,
          windDirection: 'ENE',
          swellHeight: 8,
          swellPeriod: 12,
          swellDirection: 'NNE',
          warnings: ['Small Craft Advisory']
        }
      ];
    } catch (error) {
      console.error('Error fetching marine weather:', error);
      return [];
    }
  },

  // Get satellite imagery URLs
  async getSatelliteImagery(): Promise<{ [key: string]: string }> {
    const baseTime = new Date();
    baseTime.setMinutes(Math.floor(baseTime.getMinutes() / 10) * 10); // Round to nearest 10 min
    
    return {
      visible: `https://cdn.star.nesdis.noaa.gov/GOES18/ABI/SECTOR/hi/GEOCOLOR/latest.jpg`,
      infrared: `https://cdn.star.nesdis.noaa.gov/GOES18/ABI/SECTOR/hi/13/latest.jpg`,
      water_vapor: `https://cdn.star.nesdis.noaa.gov/GOES18/ABI/SECTOR/hi/09/latest.jpg`,
      animated: `https://cdn.star.nesdis.noaa.gov/GOES18/ABI/SECTOR/hi/GEOCOLOR/GOES18-HI-GEOCOLOR-600x600.gif`
    };
  },

  // Get radar imagery
  async getRadarImagery(): Promise<{ [key: string]: string }> {
    return {
      hawaii_composite: 'https://radar.weather.gov/ridge/standard/HAWAII_loop.gif',
      molokai: 'https://radar.weather.gov/ridge/standard/PHMO_loop.gif',
      kauai: 'https://radar.weather.gov/ridge/standard/PHKI_loop.gif',
      kohala: 'https://radar.weather.gov/ridge/standard/PHKM_loop.gif',
      south_shore: 'https://radar.weather.gov/ridge/standard/PHWA_loop.gif'
    };
  }
};