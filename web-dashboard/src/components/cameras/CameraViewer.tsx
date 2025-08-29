'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { RefreshCw, Camera, AlertCircle, Maximize2 } from "lucide-react"
import { trafficCameraService, TrafficCamera } from '@/lib/services/traffic-cameras-api'
import { comprehensiveApiService } from '@/lib/services/comprehensive-api'

export function CameraViewer() {
  const [cameras, setCameras] = useState<{
    traffic: TrafficCamera[]
    harbor: TrafficCamera[]
    surf: TrafficCamera[]
  }>({ traffic: [], harbor: [], surf: [] })
  const [selectedCamera, setSelectedCamera] = useState<TrafficCamera | null>(null)
  const [loading, setLoading] = useState(true)
  const [satelliteImages, setSatelliteImages] = useState<any>({})
  const [lastUpdate, setLastUpdate] = useState(new Date())

  useEffect(() => {
    loadCameras()
    loadSatelliteImages()
    const interval = setInterval(() => {
      loadCameras()
      loadSatelliteImages()
    }, 60000) // Refresh every minute
    return () => clearInterval(interval)
  }, [])

  const loadCameras = async () => {
    try {
      const cameraData = await trafficCameraService.getAllCameras()
      setCameras(cameraData)
      setLastUpdate(new Date())
    } catch (error) {
      console.error('Error loading cameras:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadSatelliteImages = async () => {
    try {
      const images = await comprehensiveApiService.getSatelliteImagery()
      setSatelliteImages(images)
    } catch (error) {
      console.error('Error loading satellite imagery:', error)
    }
  }

  const refreshCamera = (camera: TrafficCamera) => {
    // Force refresh by updating the camera object
    const updatedCamera = {
      ...camera,
      lastUpdate: new Date().toISOString()
    }
    setSelectedCamera(updatedCamera)
  }

  const CameraGrid = ({ cameras, type }: { cameras: TrafficCamera[], type: string }) => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {cameras.map((camera) => (
        <Card 
          key={camera.id} 
          className="cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => setSelectedCamera(camera)}
        >
          <CardHeader className="p-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">{camera.name}</CardTitle>
              <Badge 
                variant={camera.status === 'online' ? 'default' : 'secondary'}
                className={camera.status === 'online' ? 'bg-green-500' : 'bg-gray-500'}
              >
                {camera.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="aspect-video bg-gray-100 rounded-md overflow-hidden relative">
              <img 
                src={`/api/camera-proxy?url=${encodeURIComponent(camera.url)}&t=${Date.now()}`} 
                alt={camera.name}
                className="w-full h-full object-cover"
                loading="lazy"
                onError={(e) => {
                  const target = e.currentTarget;
                  if (!target.dataset.fallback) {
                    target.dataset.fallback = 'true';
                    target.src = 'https://via.placeholder.com/640x480/1e40af/ffffff?text=Camera+Offline';
                  }
                }}
              />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                <p className="text-white text-xs">{camera.island} • {camera.highway}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )

  const FullCameraView = ({ camera }: { camera: TrafficCamera }) => (
    <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-hidden">
        <div className="p-4 border-b flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">{camera.name}</h2>
            <p className="text-sm text-gray-600">{camera.island} • {camera.highway}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refreshCamera(camera)}
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              Refresh
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedCamera(null)}
            >
              Close
            </Button>
          </div>
        </div>
        <div className="p-4">
          <img 
            src={`/api/camera-proxy?url=${encodeURIComponent(camera.url)}&t=${Date.now()}`} 
            alt={camera.name}
            className="w-full h-auto rounded-md"
            loading="eager"
            onError={(e) => {
              const target = e.currentTarget;
              if (!target.dataset.fallback) {
                target.dataset.fallback = 'true';
                target.src = 'https://via.placeholder.com/640x480/1e40af/ffffff?text=Camera+Offline';
              }
            }}
          />
          <p className="text-sm text-gray-500 mt-2">
            Last updated: {new Date(camera.lastUpdate).toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Live Cameras</h2>
          <p className="text-gray-600">Real-time views from traffic, harbor, and surf cameras</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline">
            <Camera className="h-3 w-3 mr-1" />
            {cameras.traffic.length + cameras.harbor.length + cameras.surf.length} cameras
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              loadCameras()
              loadSatelliteImages()
            }}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Tabs defaultValue="traffic" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="traffic">Traffic</TabsTrigger>
          <TabsTrigger value="harbor">Harbor/Port</TabsTrigger>
          <TabsTrigger value="surf">Beach/Surf</TabsTrigger>
          <TabsTrigger value="satellite">Satellite</TabsTrigger>
        </TabsList>

        <TabsContent value="traffic" className="space-y-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-yellow-800">
              <strong>Note:</strong> Camera feeds are showing placeholder images. 
              Real-time feeds require API authentication from Hawaii DOT. 
              Satellite imagery below shows actual NOAA weather data.
            </p>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Traffic Cameras</CardTitle>
              <p className="text-sm text-gray-600">
                Live views of major highways and roads across Hawaii
              </p>
            </CardHeader>
            <CardContent>
              <CameraGrid cameras={cameras.traffic} type="traffic" />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="harbor" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Harbor & Port Cameras</CardTitle>
              <p className="text-sm text-gray-600">
                Critical for tsunami monitoring and maritime safety
              </p>
            </CardHeader>
            <CardContent>
              <CameraGrid cameras={cameras.harbor} type="harbor" />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="surf" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Beach & Surf Cameras</CardTitle>
              <p className="text-sm text-gray-600">
                Monitor ocean conditions and beach safety
              </p>
            </CardHeader>
            <CardContent>
              <CameraGrid cameras={cameras.surf} type="surf" />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="satellite" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Satellite Imagery</CardTitle>
              <p className="text-sm text-gray-600">
                GOES-18 satellite views of Hawaii - Updated every 10 minutes
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-medium mb-2">Visible Light</h3>
                  <img 
                    src={satelliteImages.visible} 
                    alt="Visible satellite"
                    className="w-full rounded-md"
                  />
                </div>
                <div>
                  <h3 className="font-medium mb-2">Infrared</h3>
                  <img 
                    src={satelliteImages.infrared} 
                    alt="Infrared satellite"
                    className="w-full rounded-md"
                  />
                </div>
                <div>
                  <h3 className="font-medium mb-2">Water Vapor</h3>
                  <img 
                    src={satelliteImages.water_vapor} 
                    alt="Water vapor satellite"
                    className="w-full rounded-md"
                  />
                </div>
                <div>
                  <h3 className="font-medium mb-2">Animated (Last 3 Hours)</h3>
                  <img 
                    src={satelliteImages.animated} 
                    alt="Animated satellite"
                    className="w-full rounded-md"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {selectedCamera && <FullCameraView camera={selectedCamera} />}
    </div>
  )
}