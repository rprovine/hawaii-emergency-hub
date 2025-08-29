'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { 
  Activity, 
  Waves, 
  Wind, 
  Thermometer,
  Eye,
  AlertTriangle,
  Mountain,
  Flame,
  RefreshCw
} from "lucide-react"
import { comprehensiveApiService } from '@/lib/services/comprehensive-api'
import { CameraViewer } from '@/components/cameras/CameraViewer'

export function ComprehensiveDashboard() {
  const [data, setData] = useState<any>({
    alerts: [],
    volcanoes: [],
    tides: [],
    airQuality: [],
    fires: [],
    marineWeather: []
  })
  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState(new Date())

  useEffect(() => {
    loadAllData()
    const interval = setInterval(loadAllData, 300000) // Refresh every 5 minutes
    return () => clearInterval(interval)
  }, [])

  const loadAllData = async () => {
    try {
      setLoading(true)
      const allData = await comprehensiveApiService.getAllEmergencyData()
      setData(allData)
      setLastUpdate(new Date())
    } catch (error) {
      console.error('Error loading comprehensive data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getAQIColor = (aqi: number) => {
    if (aqi <= 50) return 'bg-green-500'
    if (aqi <= 100) return 'bg-yellow-500'
    if (aqi <= 150) return 'bg-orange-500'
    if (aqi <= 200) return 'bg-red-500'
    if (aqi <= 300) return 'bg-purple-500'
    return 'bg-purple-900'
  }

  const getVolcanoAlertColor = (level: string) => {
    switch(level) {
      case 'GREEN': return 'bg-green-500'
      case 'YELLOW': return 'bg-yellow-500'
      case 'ORANGE': return 'bg-orange-500'
      case 'RED': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Comprehensive Emergency Data</h1>
          <p className="text-gray-600">Real-time data from multiple sources</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">
            Last updated: {lastUpdate.toLocaleTimeString()}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={loadAllData}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="seismic">Seismic</TabsTrigger>
          <TabsTrigger value="ocean">Ocean</TabsTrigger>
          <TabsTrigger value="air">Air Quality</TabsTrigger>
          <TabsTrigger value="fire">Fire</TabsTrigger>
          <TabsTrigger value="cameras">Cameras</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Volcano Status */}
            {data.volcanoes.map((volcano: any) => (
              <Card key={volcano.name}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Mountain className="h-4 w-4" />
                      {volcano.name}
                    </CardTitle>
                    <Badge className={getVolcanoAlertColor(volcano.alert_level)}>
                      {volcano.alert_level}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">{volcano.activity}</p>
                </CardContent>
              </Card>
            ))}

            {/* Air Quality Summary */}
            {data.airQuality.slice(0, 2).map((aq: any) => (
              <Card key={aq.location}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Wind className="h-4 w-4" />
                      {aq.location} Air
                    </CardTitle>
                    <Badge className={getAQIColor(aq.aqi)}>
                      AQI {aq.aqi}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1">
                    <p className="text-sm text-gray-600">{aq.category}</p>
                    {aq.vog_index && (
                      <p className="text-xs text-gray-500">Vog Index: {aq.vog_index}/5</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Marine Conditions */}
          {data.marineWeather.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Waves className="h-5 w-5" />
                  Marine Conditions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {data.marineWeather.map((marine: any, idx: number) => (
                    <div key={idx} className="space-y-2">
                      <h4 className="font-medium">{marine.zone}</h4>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-gray-600">Waves:</span> {marine.waveHeight} ft
                        </div>
                        <div>
                          <span className="text-gray-600">Wind:</span> {marine.windSpeed} mph {marine.windDirection}
                        </div>
                        <div>
                          <span className="text-gray-600">Swell:</span> {marine.swellHeight} ft @ {marine.swellPeriod}s
                        </div>
                        <div>
                          <span className="text-gray-600">Direction:</span> {marine.swellDirection}
                        </div>
                      </div>
                      {marine.warnings.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {marine.warnings.map((warning: string) => (
                            <Badge key={warning} variant="destructive" className="text-xs">
                              {warning}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="seismic" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Recent Earthquakes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {data.alerts
                  .filter((alert: any) => alert.category === 'earthquake')
                  .map((quake: any) => (
                    <div key={quake.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                      <div>
                        <p className="font-medium">{quake.title}</p>
                        <p className="text-sm text-gray-600">{quake.location_name}</p>
                        <p className="text-xs text-gray-500">
                          Depth: {quake.metadata?.depth?.toFixed(1)} km
                        </p>
                      </div>
                      <Badge variant={quake.severity === 'extreme' ? 'destructive' : 'secondary'}>
                        M{quake.metadata?.magnitude?.toFixed(1)}
                      </Badge>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>

          {/* Volcano Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.volcanoes.map((volcano: any) => (
              <Card key={volcano.name}>
                <CardHeader>
                  <CardTitle>{volcano.name} Volcano</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span>Status:</span>
                      <Badge className={getVolcanoAlertColor(volcano.alert_level)}>
                        {volcano.status}
                      </Badge>
                    </div>
                    <p className="text-sm">{volcano.activity}</p>
                    <div>
                      <p className="text-sm font-medium mb-1">Live Webcams:</p>
                      <div className="flex flex-wrap gap-1">
                        {volcano.webcams?.map((cam: string, idx: number) => (
                          <Button key={idx} variant="outline" size="sm" asChild>
                            <a href={cam} target="_blank" rel="noopener noreferrer">
                              <Eye className="h-3 w-3 mr-1" />
                              Cam {idx + 1}
                            </a>
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="ocean" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Waves className="h-5 w-5" />
                Tide Predictions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {data.tides.map((tide: any) => (
                  <div key={tide.station} className="space-y-2">
                    <h4 className="font-medium">{tide.station}</h4>
                    <div className="space-y-1 text-sm">
                      {tide.predictions.slice(0, 4).map((pred: any, idx: number) => (
                        <div key={idx} className="flex justify-between">
                          <span className="text-gray-600">
                            {new Date(pred.t).toLocaleTimeString([], { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </span>
                          <Badge variant={pred.type === 'H' ? 'default' : 'secondary'}>
                            {pred.type === 'H' ? 'High' : 'Low'} {pred.v}ft
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="air" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.airQuality.map((aq: any) => (
              <Card key={aq.location}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{aq.location}</span>
                    <Badge className={getAQIColor(aq.aqi)}>
                      {aq.aqi}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-medium">Air Quality: {aq.category}</p>
                      <Progress value={(aq.aqi / 300) * 100} className="mt-1" />
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-gray-600">PM2.5:</span> {aq.pm25} μg/m³
                      </div>
                      <div>
                        <span className="text-gray-600">PM10:</span> {aq.pm10} μg/m³
                      </div>
                      <div>
                        <span className="text-gray-600">O₃:</span> {aq.o3} ppm
                      </div>
                      <div>
                        <span className="text-gray-600">SO₂:</span> {aq.so2} ppm
                      </div>
                    </div>
                    {aq.vog_index && (
                      <div>
                        <p className="text-sm font-medium">Vog Index</p>
                        <Progress value={(aq.vog_index / 5) * 100} className="mt-1" />
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="fire" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Flame className="h-5 w-5" />
                Active Fire Detections
              </CardTitle>
            </CardHeader>
            <CardContent>
              {data.fires.length > 0 ? (
                <div className="space-y-2">
                  {data.fires.map((fire: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-orange-50 rounded-md">
                      <div>
                        <p className="font-medium">Fire Detection</p>
                        <p className="text-sm text-gray-600">
                          Location: {fire.latitude.toFixed(4)}, {fire.longitude.toFixed(4)}
                        </p>
                        <p className="text-xs text-gray-500">
                          Detected: {fire.acq_date} at {fire.acq_time}
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge variant="destructive">
                          {fire.confidence}% confidence
                        </Badge>
                        <p className="text-xs text-gray-500 mt-1">
                          FRP: {fire.frp} MW
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No active fires detected</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cameras">
          <CameraViewer />
        </TabsContent>
      </Tabs>
    </div>
  )
}