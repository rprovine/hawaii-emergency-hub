"use client"

import { useEffect, useRef, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Cloud, 
  CloudRain, 
  Zap, 
  Sun, 
  CloudSnow,
  Wind,
  Thermometer,
  Droplets,
  Eye,
  Activity,
  RefreshCw,
  AlertTriangle,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Settings
} from 'lucide-react'

// Dynamic import for Mapbox to avoid SSR issues
let mapboxgl: any;
if (typeof window !== 'undefined') {
  mapboxgl = require('mapbox-gl');
  require('mapbox-gl/dist/mapbox-gl.css');
  mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';
}

interface WeatherData {
  location: string
  temperature: number
  humidity: number
  windSpeed: number
  windDirection: number
  pressure: number
  visibility: number
  conditions: string
  forecast: WeatherForecast[]
}

interface WeatherForecast {
  time: string
  temperature: number
  conditions: string
  precipitation: number
  windSpeed: number
}

interface RadarFrame {
  timestamp: number
  imageUrl: string
  precipitationIntensity: 'light' | 'moderate' | 'heavy' | 'extreme'
}

interface WeatherAlert {
  id: string
  type: 'thunderstorm' | 'flash_flood' | 'high_wind' | 'tropical_storm'
  severity: 'minor' | 'moderate' | 'severe' | 'extreme'
  title: string
  description: string
  coordinates: [number, number]
  radius: number
  expiresAt: string
}

interface WeatherRadarWidgetProps {
  center?: [number, number]
  zoom?: number
  showAnimation?: boolean
  showAlerts?: boolean
}

// Sample weather data for Hawaii regions
const HAWAII_WEATHER_STATIONS = [
  {
    location: "Honolulu",
    temperature: 82,
    humidity: 68,
    windSpeed: 12,
    windDirection: 65, // NE
    pressure: 30.12,
    visibility: 10,
    conditions: "partly_cloudy",
    forecast: [
      { time: "12:00 PM", temperature: 84, conditions: "sunny", precipitation: 0, windSpeed: 10 },
      { time: "3:00 PM", temperature: 86, conditions: "partly_cloudy", precipitation: 10, windSpeed: 14 },
      { time: "6:00 PM", temperature: 83, conditions: "cloudy", precipitation: 30, windSpeed: 16 },
      { time: "9:00 PM", temperature: 80, conditions: "rain", precipitation: 70, windSpeed: 18 }
    ]
  },
  {
    location: "Hilo",
    temperature: 77,
    humidity: 85,
    windSpeed: 8,
    windDirection: 45,
    pressure: 30.08,
    visibility: 8,
    conditions: "light_rain",
    forecast: [
      { time: "12:00 PM", temperature: 78, conditions: "rain", precipitation: 60, windSpeed: 8 },
      { time: "3:00 PM", temperature: 79, conditions: "heavy_rain", precipitation: 85, windSpeed: 12 },
      { time: "6:00 PM", temperature: 76, conditions: "rain", precipitation: 40, windSpeed: 10 },
      { time: "9:00 PM", temperature: 74, conditions: "cloudy", precipitation: 20, windSpeed: 6 }
    ]
  }
]

// Sample weather alerts
const WEATHER_ALERTS: WeatherAlert[] = [
  {
    id: 'weather-1',
    type: 'flash_flood',
    severity: 'severe',
    title: 'Flash Flood Warning',
    description: 'Heavy rainfall may cause flash flooding in low-lying areas',
    coordinates: [-155.4308, 19.5429], // Big Island
    radius: 25,
    expiresAt: 'in 4 hours'
  },
  {
    id: 'weather-2',
    type: 'high_wind',
    severity: 'moderate',
    title: 'High Wind Advisory',
    description: 'Sustained winds 25-35 mph with gusts up to 50 mph',
    coordinates: [-157.8167, 21.4667], // Oahu
    radius: 30,
    expiresAt: 'in 6 hours'
  }
]

// Sample radar frames (in real app, these would come from weather API)
const generateRadarFrames = (): RadarFrame[] => {
  const frames: RadarFrame[] = []
  const now = Date.now()
  
  for (let i = 0; i < 12; i++) {
    frames.push({
      timestamp: now - (i * 10 * 60 * 1000), // 10 minute intervals
      imageUrl: `/api/weather/radar/${now - (i * 10 * 60 * 1000)}`, // Would be real radar image URLs
      precipitationIntensity: ['light', 'moderate', 'heavy', 'extreme'][Math.floor(Math.random() * 4)] as any
    })
  }
  
  return frames.reverse() // Oldest to newest
}

export function WeatherRadarWidget({ 
  center = [-157.8167, 21.4667], 
  zoom = 7,
  showAnimation = true,
  showAlerts = true 
}: WeatherRadarWidgetProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<mapboxgl.Map | null>(null)
  const [weatherData, setWeatherData] = useState<WeatherData[]>(HAWAII_WEATHER_STATIONS)
  const [radarFrames, setRadarFrames] = useState<RadarFrame[]>([])
  const [currentFrameIndex, setCurrentFrameIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [radarOpacity, setRadarOpacity] = useState(0.7)
  const [showTemperature, setShowTemperature] = useState(true)
  const [showPrecipitation, setShowPrecipitation] = useState(true)

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current || !mapboxgl) return

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/satellite-streets-v12',
      center,
      zoom
    })

    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right')

    // Wait for map to load before adding sources and layers
    map.current.on('load', () => {
      if (!map.current) return

      // Add weather station markers
      HAWAII_WEATHER_STATIONS.forEach((station, index) => {
        if (!map.current) return

        const coordinates: [number, number] = index === 0 ? [-157.8167, 21.4667] : [-155.4308, 19.5429]
        
        // Create weather station marker
        const el = document.createElement('div')
        el.className = 'weather-station-marker'
        el.style.backgroundColor = '#3b82f6'
        el.style.width = '24px'
        el.style.height = '24px'
        el.style.borderRadius = '50%'
        el.style.border = '3px solid white'
        el.style.cursor = 'pointer'
        el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)'
        el.style.display = 'flex'
        el.style.alignItems = 'center'
        el.style.justifyContent = 'center'
        el.innerHTML = '🌡️'

        const popup = new mapboxgl.Popup({
          offset: 25,
          closeButton: false
        }).setHTML(`
          <div class="weather-popup" style="min-width: 220px;">
            <h3 style="font-weight: bold; margin-bottom: 8px;">${station.location}</h3>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 12px;">
              <div>Temperature: ${station.temperature}°F</div>
              <div>Humidity: ${station.humidity}%</div>
              <div>Wind: ${station.windSpeed} mph</div>
              <div>Pressure: ${station.pressure}"</div>
              <div>Visibility: ${station.visibility} mi</div>
              <div>Conditions: ${station.conditions.replace('_', ' ')}</div>
            </div>
          </div>
        `)

        new mapboxgl.Marker(el)
          .setLngLat(coordinates)
          .setPopup(popup)
          .addTo(map.current!)
      })

      // Add weather alert markers
      if (showAlerts) {
        WEATHER_ALERTS.forEach((alert) => {
          if (!map.current) return

          const alertColor = {
            'minor': '#facc15',
            'moderate': '#fb923c', 
            'severe': '#ef4444',
            'extreme': '#7f1d1d'
          }[alert.severity]

          // Create alert marker
          const el = document.createElement('div')
          el.className = 'weather-alert-marker'
          el.style.backgroundColor = alertColor
          el.style.width = '20px'
          el.style.height = '20px'
          el.style.borderRadius = '50%'
          el.style.border = '2px solid white'
          el.style.cursor = 'pointer'
          el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)'
          
          if (alert.severity === 'severe' || alert.severity === 'extreme') {
            el.style.animation = 'pulse 2s infinite'
          }

          const popup = new mapboxgl.Popup({
            offset: 25,
            closeButton: false
          }).setHTML(`
            <div class="weather-alert-popup" style="min-width: 200px;">
              <h3 style="font-weight: bold; margin-bottom: 4px;">${alert.title}</h3>
              <p style="font-size: 12px; color: #666; margin-bottom: 8px;">${alert.description}</p>
              <div style="margin-bottom: 8px;">
                <span style="
                  background-color: ${alertColor};
                  color: white;
                  padding: 2px 8px;
                  border-radius: 4px;
                  font-size: 10px;
                  font-weight: bold;
                ">${alert.severity.toUpperCase()}</span>
              </div>
              <p style="font-size: 11px; color: #666;">Expires: ${alert.expiresAt}</p>
            </div>
          `)

          new mapboxgl.Marker(el)
            .setLngLat(alert.coordinates)
            .setPopup(popup)
            .addTo(map.current!)

          // Add alert radius circle (only after map is loaded)
          if (map.current.isStyleLoaded()) {
            map.current.addSource(`alert-${alert.id}`, {
              type: 'geojson',
              data: {
                type: 'Feature',
                properties: {},
                geometry: {
                  type: 'Point',
                  coordinates: alert.coordinates
                }
              }
            })

            map.current.addLayer({
              id: `alert-circle-${alert.id}`,
              type: 'circle',
              source: `alert-${alert.id}`,
              paint: {
                'circle-radius': alert.radius * 1000, // Convert miles to meters approximation
                'circle-color': alertColor,
                'circle-opacity': 0.1,
                'circle-stroke-color': alertColor,
                'circle-stroke-width': 2,
                'circle-stroke-opacity': 0.5
              }
            })
          }
        })
      }
    })

    // Handle map style loading errors
    map.current.on('error', (e) => {
      console.error('Weather radar map error:', e)
      setError('Failed to load weather map. Please refresh the page.')
    })

    return () => {
      if (map.current) {
        map.current.remove()
        map.current = null
      }
    }
  }, [center, zoom, showAlerts])

  // Load radar frames
  useEffect(() => {
    setLoading(true)
    // Simulate API call
    setTimeout(() => {
      setRadarFrames(generateRadarFrames())
      setLoading(false)
    }, 1000)
  }, [])

  // Radar animation
  useEffect(() => {
    if (!isPlaying || radarFrames.length === 0) return

    const interval = setInterval(() => {
      setCurrentFrameIndex((prev) => 
        prev >= radarFrames.length - 1 ? 0 : prev + 1
      )
    }, 800) // 800ms per frame

    return () => clearInterval(interval)
  }, [isPlaying, radarFrames.length])

  const getCurrentConditionsIcon = (conditions: string) => {
    switch (conditions) {
      case 'sunny': return <Sun className="h-5 w-5 text-yellow-500" />
      case 'partly_cloudy': return <Cloud className="h-5 w-5 text-gray-400" />
      case 'cloudy': return <Cloud className="h-5 w-5 text-gray-600" />
      case 'light_rain': return <CloudRain className="h-5 w-5 text-blue-400" />
      case 'rain': return <CloudRain className="h-5 w-5 text-blue-600" />
      case 'heavy_rain': return <CloudRain className="h-5 w-5 text-blue-800" />
      case 'thunderstorm': return <Zap className="h-5 w-5 text-purple-600" />
      case 'snow': return <CloudSnow className="h-5 w-5 text-blue-200" />
      default: return <Cloud className="h-5 w-5 text-gray-400" />
    }
  }

  const refreshWeatherData = async () => {
    setLoading(true)
    setError(null)
    
    try {
      // Simulate API call to refresh weather data
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // Add some randomness to simulate real data updates
      const updatedData = HAWAII_WEATHER_STATIONS.map(station => ({
        ...station,
        temperature: station.temperature + Math.floor(Math.random() * 6) - 3,
        humidity: Math.max(30, Math.min(95, station.humidity + Math.floor(Math.random() * 10) - 5)),
        windSpeed: Math.max(0, station.windSpeed + Math.floor(Math.random() * 8) - 4)
      }))
      
      setWeatherData(updatedData)
      setRadarFrames(generateRadarFrames())
    } catch (err) {
      setError('Failed to refresh weather data')
    } finally {
      setLoading(false)
    }
  }

  // Fallback view if Mapbox is not available
  if (!mapboxgl || !process.env.NEXT_PUBLIC_MAPBOX_TOKEN) {
    return (
      <div className="space-y-4">
        <Alert className="border-orange-200 bg-orange-50">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            Weather radar requires Mapbox configuration. Please add your token to .env.local
          </AlertDescription>
        </Alert>
        
        {/* Show weather data cards as fallback */}
        <div className="grid gap-4 md:grid-cols-2">
          {weatherData.map((station, index) => (
            <Card key={index}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {getCurrentConditionsIcon(station.conditions)}
                  {station.location} Weather
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Thermometer className="h-4 w-4" />
                    {station.temperature}°F
                  </div>
                  <div className="flex items-center gap-2">
                    <Droplets className="h-4 w-4" />
                    {station.humidity}%
                  </div>
                  <div className="flex items-center gap-2">
                    <Wind className="h-4 w-4" />
                    {station.windSpeed} mph
                  </div>
                  <div className="flex items-center gap-2">
                    <Eye className="h-4 w-4" />
                    {station.visibility} mi
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Weather Radar Map */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Live Weather Radar
              </CardTitle>
              <CardDescription>
                Real-time precipitation and weather conditions across Hawaii
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={refreshWeatherData}
                disabled={loading}
              >
                {loading ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                Refresh
              </Button>
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <div 
              ref={mapContainer} 
              className="w-full h-[500px] rounded-lg overflow-hidden border"
            />
            
            {/* Radar Animation Controls */}
            {showAnimation && radarFrames.length > 0 && (
              <Card className="absolute bottom-4 left-4 p-3">
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setCurrentFrameIndex(0)}
                    disabled={currentFrameIndex === 0}
                  >
                    <SkipBack className="h-3 w-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setIsPlaying(!isPlaying)}
                  >
                    {isPlaying ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setCurrentFrameIndex(radarFrames.length - 1)}
                    disabled={currentFrameIndex === radarFrames.length - 1}
                  >
                    <SkipForward className="h-3 w-3" />
                  </Button>
                  <div className="mx-2 text-xs">
                    Frame {currentFrameIndex + 1} of {radarFrames.length}
                  </div>
                </div>
                <div className="mt-2">
                  <input
                    type="range"
                    min="0"
                    max={radarFrames.length - 1}
                    value={currentFrameIndex}
                    onChange={(e) => setCurrentFrameIndex(parseInt(e.target.value))}
                    className="w-full"
                  />
                </div>
              </Card>
            )}

            {/* Radar Legend */}
            <Card className="absolute top-4 right-4 p-3">
              <div className="space-y-2">
                <p className="text-xs font-semibold">Precipitation Intensity</p>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-2 bg-green-300" />
                    <span className="text-xs">Light</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-2 bg-yellow-400" />
                    <span className="text-xs">Moderate</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-2 bg-orange-500" />
                    <span className="text-xs">Heavy</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-2 bg-red-600" />
                    <span className="text-xs">Extreme</span>
                  </div>
                </div>
                {showAlerts && (
                  <div className="mt-3 pt-2 border-t">
                    <p className="text-xs font-semibold mb-1">Weather Alerts</p>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-yellow-400" />
                        <span className="text-xs">Advisory</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-orange-500" />
                        <span className="text-xs">Watch</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-500" />
                        <span className="text-xs">Warning</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </div>

          {error && (
            <Alert className="mt-4 border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Current Weather Conditions */}
        {weatherData.map((station, index) => (
          <Card key={index}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                {getCurrentConditionsIcon(station.conditions)}
                {station.location}
              </CardTitle>
              <CardDescription>Current conditions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2">
                    <Thermometer className="h-4 w-4 text-red-500" />
                    <span>{station.temperature}°F</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Droplets className="h-4 w-4 text-blue-500" />
                    <span>{station.humidity}%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Wind className="h-4 w-4 text-gray-600" />
                    <span>{station.windSpeed} mph</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Eye className="h-4 w-4 text-green-600" />
                    <span>{station.visibility} mi</span>
                  </div>
                </div>
                
                {/* Hourly Forecast */}
                <div className="pt-2 border-t">
                  <p className="text-xs font-semibold mb-2">4-Hour Forecast</p>
                  <div className="grid grid-cols-4 gap-2 text-xs">
                    {station.forecast.slice(0, 4).map((forecast, idx) => (
                      <div key={idx} className="text-center">
                        <div className="font-medium">{forecast.time.split(' ')[0]}</div>
                        <div className="my-1">{getCurrentConditionsIcon(forecast.conditions)}</div>
                        <div>{forecast.temperature}°</div>
                        <div className="text-blue-600">{forecast.precipitation}%</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {/* Weather Alerts */}
        {showAlerts && (
          <Card className="md:col-span-1">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
                Active Weather Alerts
              </CardTitle>
              <CardDescription>{WEATHER_ALERTS.length} active alerts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {WEATHER_ALERTS.map((alert) => (
                  <div key={alert.id} className="border rounded-lg p-3">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-semibold text-sm">{alert.title}</h4>
                      <Badge
                        variant={alert.severity === 'severe' || alert.severity === 'extreme' ? 'destructive' : 'secondary'}
                        className={`text-xs ${
                          alert.severity === 'extreme' ? 'bg-red-900' :
                          alert.severity === 'severe' ? 'bg-red-600' :
                          alert.severity === 'moderate' ? 'bg-orange-500' :
                          'bg-yellow-500'
                        }`}
                      >
                        {alert.severity}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-600 mb-2">{alert.description}</p>
                    <div className="flex justify-between items-center text-xs text-gray-500">
                      <span>Expires: {alert.expiresAt}</span>
                      <span>{alert.radius} mi radius</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}