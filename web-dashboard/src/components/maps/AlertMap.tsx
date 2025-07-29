"use client"

import { useEffect, useRef, useState } from 'react'
import { Alert as AlertType } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

// Dynamic import for Mapbox to avoid SSR issues
let mapboxgl: any;
if (typeof window !== 'undefined') {
  mapboxgl = require('mapbox-gl');
  require('mapbox-gl/dist/mapbox-gl.css');
  // You'll need to add your Mapbox token to .env.local
  mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';
}

interface AlertMapProps {
  alerts: AlertType[]
  center?: [number, number]
  zoom?: number
  showClustering?: boolean
  showHeatMap?: boolean
  selectedAlert?: AlertType | null
  onAlertSelect?: (alert: AlertType | null) => void
}

const severityColors = {
  minor: '#facc15',
  moderate: '#fb923c',
  severe: '#ef4444',
  extreme: '#7f1d1d'
}

export function AlertMap({ 
  alerts, 
  center = [-157.8167, 21.4667], 
  zoom = 7,
  showClustering = true,
  showHeatMap = false,
  selectedAlert: externalSelectedAlert,
  onAlertSelect
}: AlertMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<mapboxgl.Map | null>(null)
  const [selectedAlert, setSelectedAlert] = useState<AlertType | null>(externalSelectedAlert || null)
  
  console.log('AlertMap component rendered')

  // Function to add clustering layers
  const addClusteringLayers = () => {
    if (!map.current || !mapboxgl) return

    // Create GeoJSON data for clustering
    const geojsonData = {
      type: 'FeatureCollection' as const,
      features: alerts
        .filter(alert => alert.latitude && alert.longitude)
        .map(alert => ({
          type: 'Feature' as const,
          properties: {
            id: alert.id,
            title: alert.title,
            severity: alert.severity,
            description: alert.description,
            location_name: alert.location_name
          },
          geometry: {
            type: 'Point' as const,
            coordinates: [alert.longitude!, alert.latitude!]
          }
        }))
    }

    // Add clustering source
    map.current.addSource('alerts-cluster', {
      type: 'geojson',
      data: geojsonData,
      cluster: true,
      clusterMaxZoom: 14,
      clusterRadius: 50
    })

    // Add cluster circles
    map.current.addLayer({
      id: 'clusters',
      type: 'circle',
      source: 'alerts-cluster',
      filter: ['has', 'point_count'],
      paint: {
        'circle-color': [
          'step',
          ['get', 'point_count'],
          '#51bbd6',  // Blue for small clusters
          5,
          '#f1c40f',  // Yellow for medium clusters
          10,
          '#e74c3c'   // Red for large clusters
        ],
        'circle-radius': [
          'step',
          ['get', 'point_count'],
          20,   // 20px for small clusters
          5,
          30,   // 30px for medium clusters
          10,
          40    // 40px for large clusters
        ],
        'circle-stroke-width': 2,
        'circle-stroke-color': '#fff'
      }
    })

    // Add cluster count labels
    map.current.addLayer({
      id: 'cluster-count',
      type: 'symbol',
      source: 'alerts-cluster',
      filter: ['has', 'point_count'],
      layout: {
        'text-field': '{point_count_abbreviated}',
        'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
        'text-size': 12
      },
      paint: {
        'text-color': '#ffffff'
      }
    })

    // Add unclustered points
    map.current.addLayer({
      id: 'unclustered-point',
      type: 'circle',
      source: 'alerts-cluster',
      filter: ['!', ['has', 'point_count']],
      paint: {
        'circle-color': [
          'match',
          ['get', 'severity'],
          'minor', '#facc15',
          'moderate', '#fb923c',
          'severe', '#ef4444',
          'extreme', '#7f1d1d',
          '#666666'
        ],
        'circle-radius': 8,
        'circle-stroke-width': 2,
        'circle-stroke-color': '#fff'
      }
    })

    // Add click handlers for clusters
    map.current.on('click', 'clusters', (e) => {
      if (!map.current) return
      
      const features = map.current.queryRenderedFeatures(e.point, {
        layers: ['clusters']
      })

      const clusterId = features[0].properties?.cluster_id
      if (clusterId !== undefined) {
        const source = map.current.getSource('alerts-cluster') as mapboxgl.GeoJSONSource
        source.getClusterExpansionZoom(clusterId, (err, zoom) => {
          if (err || !map.current) return

          map.current.easeTo({
            center: (features[0].geometry as any).coordinates,
            zoom: zoom || 10
          })
        })
      }
    })

    // Add click handlers for unclustered points
    map.current.on('click', 'unclustered-point', (e) => {
      if (!map.current || !e.features?.[0]) return
      
      const feature = e.features[0]
      const alert = alerts.find(a => a.id === feature.properties?.id)
      
      if (alert) {
        setSelectedAlert(alert)
        onAlertSelect?.(alert)
        map.current.flyTo({
          center: [alert.longitude!, alert.latitude!],
          zoom: 12
        })
      }
    })

    // Change cursor on hover
    map.current.on('mouseenter', 'clusters', () => {
      if (map.current) map.current.getCanvas().style.cursor = 'pointer'
    })
    map.current.on('mouseleave', 'clusters', () => {
      if (map.current) map.current.getCanvas().style.cursor = ''
    })
    map.current.on('mouseenter', 'unclustered-point', () => {
      if (map.current) map.current.getCanvas().style.cursor = 'pointer'
    })
    map.current.on('mouseleave', 'unclustered-point', () => {
      if (map.current) map.current.getCanvas().style.cursor = ''
    })
  }

  // Function to add heat map layer
  const addHeatMapLayer = () => {
    if (!map.current || !mapboxgl) return

    // Create heat map data with intensity based on severity
    const heatmapData = {
      type: 'FeatureCollection' as const,
      features: alerts
        .filter(alert => alert.latitude && alert.longitude)
        .map(alert => {
          // Assign intensity based on severity
          const intensity = {
            'minor': 1,
            'moderate': 2,
            'severe': 3,
            'extreme': 4
          }[alert.severity] || 1

          return {
            type: 'Feature' as const,
            properties: {
              intensity,
              severity: alert.severity
            },
            geometry: {
              type: 'Point' as const,
              coordinates: [alert.longitude!, alert.latitude!]
            }
          }
        })
    }

    // Add heat map source
    map.current.addSource('alerts-heatmap', {
      type: 'geojson',
      data: heatmapData
    })

    // Add heat map layer
    map.current.addLayer({
      id: 'alerts-heat',
      type: 'heatmap',
      source: 'alerts-heatmap',
      maxzoom: 15,
      paint: {
        // Increase the heatmap weight based on intensity
        'heatmap-weight': [
          'interpolate',
          ['linear'],
          ['get', 'intensity'],
          0, 0,
          4, 1
        ],
        // Increase the heatmap color intensity by zoom level
        'heatmap-intensity': [
          'interpolate',
          ['linear'],
          ['zoom'],
          0, 1,
          15, 3
        ],
        // Color ramp for heatmap
        'heatmap-color': [
          'interpolate',
          ['linear'],
          ['heatmap-density'],
          0, 'rgba(33,102,172,0)',
          0.2, 'rgb(103,169,207)',
          0.4, 'rgb(209,229,240)',
          0.6, 'rgb(253,219,199)',
          0.8, 'rgb(239,138,98)',
          1, 'rgb(178,24,43)'
        ],
        // Adjust the heatmap radius by zoom level
        'heatmap-radius': [
          'interpolate',
          ['linear'],
          ['zoom'],
          0, 2,
          15, 20
        ],
        // Transition from heatmap to circle layer by zoom level
        'heatmap-opacity': [
          'interpolate',
          ['linear'],
          ['zoom'],
          7, 1,
          15, 0
        ]
      }
    }, 'waterway-label')
  }

  // Function to add markers that can be called from multiple places
  const addMarkersForAlerts = () => {
    if (!map.current || !mapboxgl) {
      console.log('Cannot add markers - no map or mapboxgl')
      return
    }

    console.log('Adding markers for', alerts.length, 'alerts')
    
    // Remove existing markers
    const markers = document.getElementsByClassName('mapboxgl-marker')
    while (markers[0]) {
      markers[0].remove()
    }

    // Add alert markers
    alerts.forEach((alert, index) => {
      console.log(`Alert ${index}:`, {
        id: alert.id,
        title: alert.title,
        latitude: alert.latitude,
        longitude: alert.longitude,
        severity: alert.severity
      })
      
      if (!alert.latitude || !alert.longitude || !map.current) {
        console.log(`Skipping alert ${index} - missing coordinates or map`)
        return
      }

      // Create custom marker element
      const el = document.createElement('div')
      el.className = 'alert-marker'
      el.style.backgroundColor = severityColors[alert.severity as keyof typeof severityColors]
      el.style.width = '20px'
      el.style.height = '20px'
      el.style.borderRadius = '50%'
      el.style.border = '2px solid white'
      el.style.cursor = 'pointer'
      el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)'

      // Add pulse animation for severe/extreme alerts
      if (alert.severity === 'severe' || alert.severity === 'extreme') {
        el.style.animation = 'pulse 2s infinite'
      }

      // Create marker
      const marker = new mapboxgl.Marker(el)
        .setLngLat([alert.longitude, alert.latitude])
        .addTo(map.current)

      console.log(`Added marker for alert ${index} at [${alert.longitude}, ${alert.latitude}]`)

      // Add popup and other interactions...
      const popup = new mapboxgl.Popup({
        offset: 25,
        closeButton: false
      }).setHTML(`
        <div class="alert-popup" style="min-width: 200px;">
          <h3 style="font-weight: bold; margin-bottom: 4px;">${alert.title}</h3>
          <p style="font-size: 12px; color: #666; margin-bottom: 8px;">${alert.location_name}</p>
          <span style="
            background-color: ${severityColors[alert.severity as keyof typeof severityColors]};
            color: white;
            padding: 2px 8px;
            border-radius: 4px;
            font-size: 10px;
            font-weight: bold;
          ">${alert.severity.toUpperCase()}</span>
        </div>
      `)

      marker.setPopup(popup)

      // Show popup on hover
      el.addEventListener('mouseenter', () => {
        if (map.current) popup.addTo(map.current)
      })

      el.addEventListener('mouseleave', () => {
        popup.remove()
      })

      // Select alert on click
      el.addEventListener('click', () => {
        setSelectedAlert(alert)
        onAlertSelect?.(alert)
        if (map.current) {
          map.current.flyTo({
            center: [alert.longitude!, alert.latitude!],
            zoom: 12,
            duration: 1000
          })
        }
      })
    })
  }

  useEffect(() => {
    // Add a small delay to ensure container is mounted
    const initMap = () => {
      console.log('Checking map init conditions:', {
        container: !!mapContainer.current,
        existing: !!map.current,
        mapboxgl: !!mapboxgl,
        containerElement: mapContainer.current
      })
      
      if (!mapContainer.current || map.current || !mapboxgl) {
        console.log('Map init skipped:', {
          container: !!mapContainer.current,
          existing: !!map.current,
          mapboxgl: !!mapboxgl
        })
        return
      }

      console.log('Initializing map with container:', mapContainer.current)
      console.log('Container dimensions:', mapContainer.current.offsetWidth, 'x', mapContainer.current.offsetHeight)

      try {
        // Initialize map
        map.current = new mapboxgl.Map({
          container: mapContainer.current,
          style: 'mapbox://styles/mapbox/dark-v11',
          center,
          zoom
        })

        console.log('Map initialized successfully')

        // Add navigation controls
        if (map.current) {
          map.current.addControl(new mapboxgl.NavigationControl(), 'top-right')
          
          // Add fullscreen control
          map.current.addControl(new mapboxgl.FullscreenControl(), 'top-right')
          
          map.current.on('load', () => {
            console.log('Map loaded successfully')
            
            // Add clustering and heat map sources if enabled
            if (showClustering) {
              addClusteringLayers()
            }
            
            if (showHeatMap) {
              addHeatMapLayer()
            }
            
            // Trigger markers update after map loads
            addMarkersForAlerts()
          })

          map.current.on('error', (e) => {
            console.error('Map error:', e)
          })
        }

      } catch (error) {
        console.error('Failed to initialize map:', error)
      }
    }

    // Call initMap with a small delay
    const timer = setTimeout(initMap, 100)
    
    return () => {
      clearTimeout(timer)
      if (map.current) {
        console.log('Cleaning up map')
        try {
          map.current.remove()
          map.current = null
        } catch (error) {
          console.log('Error during map cleanup:', error)
        }
      }
    }
  }, [center, zoom])

  // Update markers when alerts change
  useEffect(() => {
    console.log('Alerts effect running with', alerts.length, 'alerts')
    console.log('Map exists:', !!map.current)
    console.log('Mapbox GL available:', !!mapboxgl)
    
    if (!map.current || !mapboxgl) {
      console.log('Alerts effect skipped - no map or mapboxgl')
      return
    }

    // Check if map is loaded, if so add markers immediately
    if (map.current.loaded()) {
      console.log('Map already loaded, adding markers immediately')
      addMarkersForAlerts()
    } else {
      console.log('Map not loaded yet, will add markers on load event')
      // Markers will be added when map load event fires
    }
  }, [alerts])

  // Handle external selected alert changes
  useEffect(() => {
    if (externalSelectedAlert && map.current) {
      console.log('AlertMap: Received external selected alert:', {
        id: externalSelectedAlert.id,
        title: externalSelectedAlert.title,
        location_name: externalSelectedAlert.location_name,
        latitude: externalSelectedAlert.latitude,
        longitude: externalSelectedAlert.longitude,
        coordinates: (externalSelectedAlert as any).coordinates
      })
      
      setSelectedAlert(externalSelectedAlert)
      
      // Get coordinates from either lat/lng properties or coordinates array
      let targetCoords: [number, number] | null = null
      
      if (externalSelectedAlert.latitude && externalSelectedAlert.longitude) {
        targetCoords = [externalSelectedAlert.longitude, externalSelectedAlert.latitude]
        console.log('AlertMap: Using latitude/longitude properties:', targetCoords)
      } else if ((externalSelectedAlert as any).coordinates && Array.isArray((externalSelectedAlert as any).coordinates) && (externalSelectedAlert as any).coordinates.length >= 2) {
        targetCoords = [(externalSelectedAlert as any).coordinates[0], (externalSelectedAlert as any).coordinates[1]]
        console.log('AlertMap: Using coordinates array:', targetCoords)
      }
      
      if (targetCoords) {
        console.log('AlertMap: Flying to coordinates:', targetCoords)
        console.log('AlertMap: Current map center before flyTo:', map.current.getCenter())
        
        // Ensure map is loaded before flying to location
        if (map.current.isStyleLoaded()) {
          console.log('AlertMap: Map style loaded, flying to coordinates')
          map.current.flyTo({
            center: targetCoords,
            zoom: 12,
            duration: 1500
          })
        } else {
          console.log('AlertMap: Map style not loaded, waiting for style to load')
          map.current.once('styledata', () => {
            console.log('AlertMap: Style loaded, now flying to coordinates')
            if (map.current && targetCoords) {
              map.current.flyTo({
                center: targetCoords,
                zoom: 12,
                duration: 1500
              })
            }
          })
        }
        
        // Log the center after flyTo is called
        setTimeout(() => {
          if (map.current) {
            console.log('AlertMap: Map center after flyTo:', map.current.getCenter())
          }
        }, 2000)
      } else {
        console.log('AlertMap: No coordinates available for alert, staying at current location')
      }
    }
  }, [externalSelectedAlert])

  // Log for debugging
  console.log('AlertMap rendered with', alerts.length, 'alerts')
  console.log('Mapbox GL available:', !!mapboxgl)
  console.log('Token exists:', !!process.env.NEXT_PUBLIC_MAPBOX_TOKEN)
  console.log('Token length:', process.env.NEXT_PUBLIC_MAPBOX_TOKEN?.length)
  console.log('Token value:', process.env.NEXT_PUBLIC_MAPBOX_TOKEN)

  // Fallback view if Mapbox is not available
  if (!mapboxgl || !process.env.NEXT_PUBLIC_MAPBOX_TOKEN) {
    return (
      <div className="relative w-full h-[600px] rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
        <div className="text-center p-8 max-w-md">
          <h3 className="text-lg font-semibold mb-2">Map Configuration Required</h3>
          <p className="text-gray-600 mb-4">
            To view the interactive alert map, please add your Mapbox access token to the .env.local file.
          </p>
          <div className="bg-gray-50 p-4 rounded-md text-left">
            <p className="text-sm font-mono text-gray-700">
              NEXT_PUBLIC_MAPBOX_TOKEN=your-mapbox-token
            </p>
          </div>
          <p className="text-sm text-gray-500 mt-4">
            Get a free token at <a href="https://mapbox.com" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">mapbox.com</a>
          </p>
          
          {/* Show alert list as fallback */}
          <div className="mt-6 text-left">
            <h4 className="font-semibold mb-2">Active Alerts ({alerts.length})</h4>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {alerts.map((alert) => (
                <div key={alert.id} className="border rounded p-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">{alert.title}</span>
                    <Badge
                      variant="secondary"
                      className={`text-xs ${
                        alert.severity === 'extreme' ? 'bg-red-900 text-white' : 
                        alert.severity === 'severe' ? 'bg-red-600 text-white' : 
                        alert.severity === 'moderate' ? 'bg-orange-500 text-white' : 
                        'bg-yellow-500'
                      }`}
                    >
                      {alert.severity}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-600">{alert.location_name}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <style jsx global>{`
        @keyframes pulse {
          0% {
            box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7);
          }
          70% {
            box-shadow: 0 0 0 10px rgba(239, 68, 68, 0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(239, 68, 68, 0);
          }
        }
      `}</style>
      
      <div className="relative w-full h-[600px] rounded-lg overflow-hidden">
        <div 
          ref={mapContainer} 
          className="w-full h-full" 
          style={{ minHeight: '600px', width: '100%' }}
        />
        
        {/* Alert Details Panel */}
        {selectedAlert && (
          <Card className="absolute top-4 left-4 w-80 shadow-lg">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <CardTitle className="text-lg">{selectedAlert.title}</CardTitle>
                <button
                  onClick={() => {
                    setSelectedAlert(null)
                    onAlertSelect?.(null)
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm text-gray-600">{selectedAlert.description}</p>
              <div className="flex items-center gap-2">
                <Badge
                  variant={selectedAlert.severity === 'severe' || selectedAlert.severity === 'extreme' ? 'destructive' : 'secondary'}
                  className={`
                    ${selectedAlert.severity === 'extreme' ? 'bg-red-900' : ''}
                    ${selectedAlert.severity === 'severe' ? 'bg-red-600' : ''}
                    ${selectedAlert.severity === 'moderate' ? 'bg-orange-500' : ''}
                    ${selectedAlert.severity === 'minor' ? 'bg-yellow-500' : ''}
                  `}
                >
                  {selectedAlert.severity.toUpperCase()}
                </Badge>
                <span className="text-sm text-gray-500">
                  {selectedAlert.affected_counties.join(', ')}
                </span>
              </div>
              <div className="text-sm text-gray-500">
                <p>Location: {selectedAlert.location_name}</p>
                <p>Expires: {selectedAlert.time_until_expiry}</p>
                {selectedAlert.radius_miles && (
                  <p>Affected Area: {selectedAlert.radius_miles} mile radius</p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Map Controls */}
        <Card className="absolute top-4 right-4 p-3">
          <div className="space-y-2">
            <p className="text-xs font-semibold mb-2">View Mode</p>
            <div className="flex flex-col gap-1">
              <button
                onClick={() => window.location.reload()} // Simple toggle for now
                className={`text-xs px-2 py-1 rounded ${showClustering ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
              >
                Clustering
              </button>
              <button
                onClick={() => window.location.reload()} // Simple toggle for now
                className={`text-xs px-2 py-1 rounded ${showHeatMap ? 'bg-red-500 text-white' : 'bg-gray-200'}`}
              >
                Heat Map
              </button>
            </div>
          </div>
        </Card>

        {/* Map Legend */}
        <Card className="absolute bottom-4 right-4 p-3">
          <div className="space-y-2">
            <p className="text-xs font-semibold">Alert Severity</p>
            {Object.entries(severityColors).map(([severity, color]) => (
              <div key={severity} className="flex items-center gap-2">
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: color }}
                />
                <span className="text-xs capitalize">{severity}</span>
              </div>
            ))}
            {showClustering && (
              <div className="mt-3 pt-2 border-t">
                <p className="text-xs font-semibold mb-1">Clusters</p>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-blue-400" />
                    <span className="text-xs">1-4 alerts</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-yellow-400" />
                    <span className="text-xs">5-9 alerts</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-red-400" />
                    <span className="text-xs">10+ alerts</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>
    </>
  )
}