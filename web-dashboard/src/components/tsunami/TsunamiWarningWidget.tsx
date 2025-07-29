"use client"

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { 
  Waves,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Clock,
  MapPin,
  Activity,
  Gauge,
  Navigation,
  Eye,
  RefreshCw,
  Zap,
  Timer,
  Mountain,
  Route
} from 'lucide-react'
import { 
  LineChart, 
  Line, 
  AreaChart,
  Area,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer
} from "recharts"

interface TsunamiBuoy {
  id: string
  name: string
  location: string
  latitude: number
  longitude: number
  status: 'operational' | 'maintenance' | 'offline'
  lastUpdate: Date
  waveHeight: number
  pressure: number
  temperature: number
  trend: 'rising' | 'falling' | 'stable'
}

interface WaveHeightPrediction {
  timestamp: Date
  location: string
  predictedHeight: number
  confidence: number
  arrivalTime?: Date
  source: 'NOAA' | 'PTWC' | 'JMA' | 'Model'
}

interface TsunamiAlert {
  id: string
  level: 'watch' | 'advisory' | 'warning' | 'major'
  title: string
  description: string
  affectedAreas: string[]
  estimatedArrival: Date
  maxWaveHeight: number
  source: string
  issued: Date
  expires?: Date
  evacuationRequired: boolean
}

interface TsunamiWarningWidgetProps {
  location?: [number, number] // [longitude, latitude]
  showPredictions?: boolean
  onEvacuationAlert?: (alert: TsunamiAlert) => void
}

// Sample buoy data (in real app would come from NOAA/NDBC API)
const SAMPLE_BUOYS: TsunamiBuoy[] = [
  {
    id: 'DART-51406',
    name: 'Deep-ocean Assessment and Reporting of Tsunamis Buoy',
    location: 'North Pacific - 152.5°W, 19.6°N',
    latitude: 19.6,
    longitude: -152.5,
    status: 'operational',
    lastUpdate: new Date(Date.now() - 2 * 60 * 1000), // 2 minutes ago
    waveHeight: 2.1,
    pressure: 1013.2,
    temperature: 24.5,
    trend: 'stable'
  },
  {
    id: 'DART-51407',
    name: 'Deep-ocean Assessment and Reporting of Tsunamis Buoy',
    location: 'Northeast Pacific - 147.1°W, 25.1°N',
    latitude: 25.1,
    longitude: -147.1,
    status: 'operational',
    lastUpdate: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
    waveHeight: 1.8,
    pressure: 1014.8,
    temperature: 22.1,
    trend: 'falling'
  },
  {
    id: 'DART-46404',
    name: 'Deep-ocean Assessment and Reporting of Tsunamis Buoy',
    location: 'Southwest Pacific - 162.0°W, 11.9°N',
    latitude: 11.9,
    longitude: -162.0,
    status: 'operational',
    lastUpdate: new Date(Date.now() - 1 * 60 * 1000), // 1 minute ago
    waveHeight: 3.2,
    pressure: 1012.1,
    temperature: 26.8,
    trend: 'rising'
  },
  {
    id: 'DART-21419',
    name: 'Deep-ocean Assessment and Reporting of Tsunamis Buoy',
    location: 'Southeast Pacific - 130.2°W, 15.0°N',
    latitude: 15.0,
    longitude: -130.2,
    status: 'maintenance',
    lastUpdate: new Date(Date.now() - 45 * 60 * 1000), // 45 minutes ago
    waveHeight: 2.5,
    pressure: 1015.3,
    temperature: 25.2,
    trend: 'stable'
  }
]

// Sample wave height prediction data
const generateWaveHeightPredictions = (): WaveHeightPrediction[] => {
  const predictions: WaveHeightPrediction[] = []
  const hawaiianLocations = [
    'Hilo Bay, Hawaii',
    'Honolulu Harbor, Oahu', 
    'Kahului Harbor, Maui',
    'Nawiliwili Harbor, Kauai'
  ]
  
  hawaiianLocations.forEach((location, index) => {
    for (let i = 0; i < 12; i++) { // 12 hour predictions
      predictions.push({
        timestamp: new Date(Date.now() + i * 60 * 60 * 1000), // hourly
        location,
        predictedHeight: 0.5 + Math.random() * 2.5 + (index * 0.2), // 0.5-3.0m variation
        confidence: 85 + Math.random() * 12, // 85-97%
        source: 'NOAA'
      })
    }
  })
  
  return predictions
}

export function TsunamiWarningWidget({ 
  location = [-157.8167, 21.4667], // Default to Honolulu
  showPredictions = true,
  onEvacuationAlert 
}: TsunamiWarningWidgetProps) {
  const [buoys, setBuoys] = useState<TsunamiBuoy[]>(SAMPLE_BUOYS)
  const [predictions, setPredictions] = useState<WaveHeightPrediction[]>([])
  const [activeAlerts, setActiveAlerts] = useState<TsunamiAlert[]>([])
  const [loading, setLoading] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())
  const [threatLevel, setThreatLevel] = useState<'none' | 'minimal' | 'minor' | 'moderate' | 'major'>('none')

  // Initialize predictions
  useEffect(() => {
    setPredictions(generateWaveHeightPredictions())
  }, [])

  // Simulate real-time data updates
  useEffect(() => {
    const interval = setInterval(async () => {
      await updateBuoyData()
      setLastUpdate(new Date())
    }, 60000) // Update every minute

    return () => clearInterval(interval)
  }, [])

  const updateBuoyData = async () => {
    setBuoys(prevBuoys => 
      prevBuoys.map(buoy => ({
        ...buoy,
        waveHeight: Math.max(0.5, buoy.waveHeight + (Math.random() - 0.5) * 0.4),
        pressure: buoy.pressure + (Math.random() - 0.5) * 2,
        temperature: buoy.temperature + (Math.random() - 0.5) * 1,
        trend: Math.random() > 0.7 ? (Math.random() > 0.5 ? 'rising' : 'falling') : buoy.trend,
        lastUpdate: new Date(Date.now() - Math.random() * 5 * 60 * 1000) // Random last update time
      }))
    )
    
    // Update threat level based on buoy data
    const maxWaveHeight = Math.max(...buoys.map(b => b.waveHeight))
    if (maxWaveHeight > 4.0) setThreatLevel('major')
    else if (maxWaveHeight > 3.0) setThreatLevel('moderate')
    else if (maxWaveHeight > 2.5) setThreatLevel('minor')
    else if (maxWaveHeight > 2.0) setThreatLevel('minimal')
    else setThreatLevel('none')
  }

  const refreshData = async () => {
    setLoading(true)
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1500))
      await updateBuoyData()
      setPredictions(generateWaveHeightPredictions())
      setLastUpdate(new Date())
    } catch (error) {
      console.error('Failed to refresh tsunami data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getThreatLevelColor = (level: string) => {
    switch (level) {
      case 'major': return 'text-red-600 bg-red-100 border-red-300'
      case 'moderate': return 'text-orange-600 bg-orange-100 border-orange-300'
      case 'minor': return 'text-yellow-600 bg-yellow-100 border-yellow-300'
      case 'minimal': return 'text-blue-600 bg-blue-100 border-blue-300'
      default: return 'text-green-600 bg-green-100 border-green-300'
    }
  }

  const getThreatLevelDescription = (level: string) => {
    switch (level) {
      case 'major': return 'Major tsunami threat - Immediate evacuation required'
      case 'moderate': return 'Moderate tsunami threat - Prepare for evacuation'
      case 'minor': return 'Minor tsunami threat - Stay alert and informed'
      case 'minimal': return 'Minimal tsunami threat - Continue monitoring'
      default: return 'No tsunami threat detected'
    }
  }

  const getBuoyStatusIcon = (status: string) => {
    switch (status) {
      case 'operational': return <Activity className="h-4 w-4 text-green-500" />
      case 'maintenance': return <Clock className="h-4 w-4 text-yellow-500" />
      case 'offline': return <AlertTriangle className="h-4 w-4 text-red-500" />
      default: return <Activity className="h-4 w-4 text-gray-400" />
    }
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'rising': return <TrendingUp className="h-3 w-3 text-red-500" />
      case 'falling': return <TrendingDown className="h-3 w-3 text-green-500" />
      default: return <Activity className="h-3 w-3 text-gray-400" />
    }
  }

  // Prepare chart data for wave height predictions
  const chartData = predictions
    .filter(p => p.location === 'Honolulu Harbor, Oahu')
    .slice(0, 24)
    .map(p => ({
      time: p.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      height: parseFloat(p.predictedHeight.toFixed(2)),
      confidence: p.confidence
    }))

  const operationalBuoys = buoys.filter(b => b.status === 'operational').length
  const averageWaveHeight = buoys.reduce((sum, b) => sum + b.waveHeight, 0) / buoys.length
  const highestWave = Math.max(...buoys.map(b => b.waveHeight))

  return (
    <div className="space-y-4">
      {/* Threat Level Alert */}
      {threatLevel !== 'none' && (
        <Alert className={`border-2 ${getThreatLevelColor(threatLevel)}`}>
          <Waves className="h-4 w-4" />
          <AlertDescription>
            <div className="flex items-center justify-between">
              <div>
                <strong className="block">{getThreatLevelDescription(threatLevel)}</strong>
                <span className="text-sm">Current wave height: {highestWave.toFixed(1)}m</span>
              </div>
              <Button 
                size="sm" 
                className="ml-4"
                onClick={() => onEvacuationAlert?.({
                  id: 'tsunami-alert-001',
                  level: 'warning',
                  title: 'Tsunami Alert',
                  description: getThreatLevelDescription(threatLevel),
                  affectedAreas: ['All Hawaiian Islands'],
                  estimatedArrival: new Date(Date.now() + 2 * 60 * 60 * 1000),
                  maxWaveHeight: highestWave,
                  source: 'Pacific Tsunami Warning Center',
                  issued: new Date(),
                  evacuationRequired: threatLevel === 'major'
                })}
              >
                <Route className="h-3 w-3 mr-2" />
                Evacuation Info
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Main Status Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Waves className="h-5 w-5 text-blue-500" />
                Tsunami Monitoring System
              </CardTitle>
              <CardDescription>
                Real-time wave height monitoring and tsunami threat assessment for Hawaii
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={getThreatLevelColor(threatLevel)}>
                {threatLevel.toUpperCase()} THREAT
              </Badge>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={refreshData}
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                {loading ? 'Updating...' : 'Refresh'}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="text-2xl font-bold text-blue-600">{operationalBuoys}</div>
              <div className="text-sm text-blue-700">Active Buoys</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg border border-green-200">
              <div className="text-2xl font-bold text-green-600">{averageWaveHeight.toFixed(1)}m</div>
              <div className="text-sm text-green-700">Avg Wave Height</div>
            </div>
            <div className="text-center p-3 bg-orange-50 rounded-lg border border-orange-200">
              <div className="text-2xl font-bold text-orange-600">{highestWave.toFixed(1)}m</div>
              <div className="text-sm text-orange-700">Max Wave Height</div>
            </div>
            <div className="text-center p-3 bg-purple-50 rounded-lg border border-purple-200">
              <div className="text-2xl font-bold text-purple-600">98.5%</div>
              <div className="text-sm text-purple-700">System Uptime</div>
            </div>
          </div>

          {/* Wave Height Predictions Chart */}
          {showPredictions && (
            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <Gauge className="h-4 w-4" />
                Wave Height Predictions - Honolulu Harbor
              </h4>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis 
                      label={{ value: 'Wave Height (m)', angle: -90, position: 'insideLeft' }}
                    />
                    <Tooltip 
                      formatter={(value: any, name: string) => [
                        `${value}m`, 
                        name === 'height' ? 'Wave Height' : 'Confidence'
                      ]}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="height" 
                      stroke="#3b82f6" 
                      fill="#3b82f6" 
                      fillOpacity={0.3}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* DART Buoy Status */}
          <div>
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <Navigation className="h-4 w-4" />
              DART Buoy Network Status
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {buoys.map((buoy) => (
                <div key={buoy.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{buoy.id}</span>
                        {getBuoyStatusIcon(buoy.status)}
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${
                            buoy.status === 'operational' ? 'border-green-500 text-green-600' :
                            buoy.status === 'maintenance' ? 'border-yellow-500 text-yellow-600' :
                            'border-red-500 text-red-600'
                          }`}
                        >
                          {buoy.status.toUpperCase()}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        <MapPin className="h-3 w-3 inline mr-1" />
                        {buoy.location}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1 text-sm font-medium">
                        {buoy.waveHeight.toFixed(1)}m
                        {getTrendIcon(buoy.trend)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {buoy.lastUpdate.toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-muted-foreground">Pressure:</span>
                      <span className="ml-1 font-medium">{buoy.pressure.toFixed(1)} hPa</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Temp:</span>
                      <span className="ml-1 font-medium">{buoy.temperature.toFixed(1)}°C</span>
                    </div>
                  </div>
                  
                  {/* Wave Height Progress */}
                  <div className="mt-3">
                    <div className="flex justify-between text-xs mb-1">
                      <span>Wave Height</span>
                      <span>{buoy.waveHeight.toFixed(1)}m / 5.0m</span>
                    </div>
                    <Progress 
                      value={Math.min((buoy.waveHeight / 5.0) * 100, 100)} 
                      className="h-2"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Prediction Locations */}
          {showPredictions && (
            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Wave Height Predictions by Location
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {['Hilo Bay, Hawaii', 'Honolulu Harbor, Oahu', 'Kahului Harbor, Maui', 'Nawiliwili Harbor, Kauai'].map((location) => {
                  const locationPredictions = predictions.filter(p => p.location === location).slice(0, 6)
                  const nextPrediction = locationPredictions[0]
                  const maxPrediction = Math.max(...locationPredictions.map(p => p.predictedHeight))
                  
                  return (
                    <div key={location} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h5 className="font-medium text-sm">{location}</h5>
                        <Badge variant="outline" className="text-xs">
                          {nextPrediction?.confidence.toFixed(0)}% confidence
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 mb-3">
                        <div>
                          <div className="text-xs text-muted-foreground">Next Hour</div>
                          <div className="text-lg font-bold text-blue-600">
                            {nextPrediction?.predictedHeight.toFixed(1)}m
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground">6hr Peak</div>
                          <div className="text-lg font-bold text-orange-600">
                            {maxPrediction.toFixed(1)}m
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-1">
                        {locationPredictions.slice(0, 3).map((pred, index) => (
                          <div key={index} className="flex justify-between text-xs">
                            <span>{pred.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            <span className="font-medium">{pred.predictedHeight.toFixed(1)}m</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* System Status */}
          <div className="border-t pt-4">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Timer className="h-3 w-3" />
                Last updated: {lastUpdate.toLocaleString()}
              </div>
              <div className="flex items-center gap-4">
                <span>Data source: NOAA/NDBC & PTWC</span>
                <span>Update frequency: 1 minute</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}