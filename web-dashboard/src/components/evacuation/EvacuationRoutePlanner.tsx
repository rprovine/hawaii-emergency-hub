"use client"

import { useEffect, useRef, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Route, 
  Navigation, 
  MapPin, 
  Clock, 
  AlertTriangle, 
  Shield,
  Car,
  Users,
  Phone,
  RefreshCw,
  Zap,
  Home,
  Building
} from 'lucide-react'

// Dynamic import for Mapbox to avoid SSR issues
let mapboxgl: any;
if (typeof window !== 'undefined') {
  mapboxgl = require('mapbox-gl');
  require('mapbox-gl/dist/mapbox-gl.css');
  mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';
}

interface EvacuationRoute {
  id: string
  name: string
  distance: number
  duration: number
  traffic_delay: number
  coordinates: [number, number][]
  instructions: RouteInstruction[]
  shelters: EmergencyShelter[]
  status: 'clear' | 'congested' | 'blocked'
  difficulty: 'easy' | 'moderate' | 'difficult'
}

interface RouteInstruction {
  step: number
  instruction: string
  distance: number
  duration: number
  maneuver: string
}

interface EmergencyShelter {
  id: string
  name: string
  type: 'school' | 'community_center' | 'hospital' | 'government'
  address: string
  capacity: number
  occupied: number
  coordinates: [number, number]
  contact: string
  amenities: string[]
  status: 'open' | 'full' | 'closed'
}

interface EvacuationRoutesPlannerProps {
  currentLocation?: [number, number]
  emergencyType?: string
  onRouteSelect?: (route: EvacuationRoute) => void
}

// Accurate Hawaii Emergency Shelters based on actual DOE and emergency management facilities
const EMERGENCY_SHELTERS: EmergencyShelter[] = [
  {
    id: 'shelter-1',
    name: 'McKinley High School',
    type: 'school',
    address: '1039 S King St, Honolulu, HI 96814',
    capacity: 1500,
    occupied: 0,
    coordinates: [-157.8267, 21.2905],
    contact: '(808) 594-0100',
    amenities: ['Gymnasium', 'Cafeteria', 'Restrooms', 'Parking'],
    status: 'open'
  },
  {
    id: 'shelter-2',
    name: 'Farrington High School',
    type: 'school',
    address: '1564 N King St, Honolulu, HI 96817',
    capacity: 2000,
    occupied: 0,
    coordinates: [-157.8890, 21.3361],
    contact: '(808) 832-3600',
    amenities: ['Multi-Purpose Room', 'Kitchen Facilities', 'Medical Room', 'Generator'],
    status: 'open' 
  },
  {
    id: 'shelter-3',
    name: 'Kailua High School',
    type: 'school',
    address: '451 Ulumanu Dr, Kailua, HI 96734',
    capacity: 1200,
    occupied: 0,
    coordinates: [-157.7394, 21.4025],
    contact: '(808) 266-7900',
    amenities: ['Cafeteria', 'Gymnasium', 'Library', 'First Aid Station'],
    status: 'open'
  },
  {
    id: 'shelter-4',
    name: 'Pearl City High School',
    type: 'school',
    address: '1460 Kamehameha Hwy, Pearl City, HI 96782',
    capacity: 1800,
    occupied: 0,
    coordinates: [-157.9753, 21.3975],
    contact: '(808) 453-6700',
    amenities: ['Large Gymnasium', 'Dining Hall', 'Medical Station', 'ADA Accessible'],
    status: 'open'
  },
  {
    id: 'shelter-5',
    name: 'Waipahu High School',
    type: 'school',
    address: '94-1211 Farrington Hwy, Waipahu, HI 96797',
    capacity: 1600,
    occupied: 0,
    coordinates: [-158.0097, 21.3856],
    contact: '(808) 675-0200',
    amenities: ['Cafeteria', 'Multipurpose Room', 'Restrooms', 'Emergency Supplies'],
    status: 'open'
  },
  {
    id: 'shelter-6',
    name: 'Hilo High School',
    type: 'school',
    address: '556 Waianuenue Ave, Hilo, HI 96720',
    capacity: 1400,
    occupied: 0,
    coordinates: [-155.0868, 19.7297],
    contact: '(808) 974-4021',
    amenities: ['Gymnasium', 'Cafeteria', 'Student Center', 'Medical Office'],
    status: 'open'
  },
  {
    id: 'shelter-7',
    name: 'Kauai High School',
    type: 'school',
    address: '3577 Lala Rd, Lihue, HI 96766',
    capacity: 1000,
    occupied: 0,
    coordinates: [-159.3728, 21.9891],
    contact: '(808) 274-3150',
    amenities: ['Multi-Purpose Building', 'Kitchen', 'Restrooms', 'Parking'],
    status: 'open'
  },
  {
    id: 'shelter-8',
    name: 'Maui High School',
    type: 'school',
    address: '660 Lono Ave, Kahului, HI 96732',
    capacity: 1300,
    occupied: 0,
    coordinates: [-156.4500, 20.8783],
    contact: '(808) 727-3000',
    amenities: ['Cafeteria', 'Gymnasium', 'Library', 'First Aid'],
    status: 'open'
  }
]

export function EvacuationRoutePlanner({ 
  currentLocation = [-157.8167, 21.4667], 
  emergencyType = 'general',
  onRouteSelect 
}: EvacuationRoutesPlannerProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<mapboxgl.Map | null>(null)
  const [routes, setRoutes] = useState<EvacuationRoute[]>([])
  const [selectedRoute, setSelectedRoute] = useState<EvacuationRoute | null>(null)
  const [startLocation, setStartLocation] = useState('')
  const [destinationType, setDestinationType] = useState<'nearest' | 'specific'>('nearest')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current || !mapboxgl) return

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: currentLocation,
      zoom: 11
    })

    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right')

    // Add current location marker
    new mapboxgl.Marker({ color: '#3b82f6', scale: 1.2 })
      .setLngLat(currentLocation)
      .setPopup(new mapboxgl.Popup().setHTML('<h3>Your Location</h3>'))
      .addTo(map.current)

    // Add shelter markers
    EMERGENCY_SHELTERS.forEach((shelter) => {
      const el = document.createElement('div')
      el.className = 'shelter-marker'
      el.style.backgroundColor = shelter.status === 'open' ? '#10b981' : 
                                shelter.status === 'full' ? '#f59e0b' : '#ef4444'
      el.style.width = '20px'
      el.style.height = '20px'
      el.style.borderRadius = '50%'
      el.style.border = '3px solid white'
      el.style.cursor = 'pointer'
      el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)'

      const popup = new mapboxgl.Popup({
        offset: 25,
        closeButton: false
      }).setHTML(`
        <div class="shelter-popup" style="min-width: 250px;">
          <h3 style="font-weight: bold; margin-bottom: 4px;">${shelter.name}</h3>
          <p style="font-size: 12px; color: #666; margin-bottom: 8px;">${shelter.address}</p>
          <div style="margin-bottom: 8px;">
            <span style="
              background-color: ${shelter.status === 'open' ? '#10b981' : shelter.status === 'full' ? '#f59e0b' : '#ef4444'};
              color: white;
              padding: 2px 8px;
              border-radius: 4px;
              font-size: 10px;
              font-weight: bold;
            ">${shelter.status.toUpperCase()}</span>
          </div>
          <p style="font-size: 12px; margin-bottom: 4px;">Capacity: ${shelter.occupied}/${shelter.capacity}</p>
          <p style="font-size: 12px; margin-bottom: 4px;">Contact: ${shelter.contact}</p>
          <div style="font-size: 11px; color: #666;">
            ${shelter.amenities.slice(0, 3).join(' • ')}
          </div>
        </div>
      `)

      new mapboxgl.Marker(el)
        .setLngLat(shelter.coordinates)
        .setPopup(popup)
        .addTo(map.current!)
    })

    return () => {
      if (map.current) {
        map.current.remove()
        map.current = null
      }
    }
  }, [currentLocation])

  // Generate evacuation routes
  const generateRoutes = async () => {
    setLoading(true)
    setError(null)

    try {
      // Simulate route calculation with realistic data
      const simulatedRoutes: EvacuationRoute[] = [
        {
          id: 'route-1',
          name: 'Primary Route - H1 West to Honolulu Convention Center',
          distance: 8.2,
          duration: 22,
          traffic_delay: 8,
          coordinates: [
            currentLocation,
            [-157.8200, 21.3100],
            [-157.8267, 21.2905]
          ],
          instructions: [
            {
              step: 1,
              instruction: 'Head north on Kalakaua Ave',
              distance: 1.2,
              duration: 4,
              maneuver: 'straight'
            },
            {
              step: 2,
              instruction: 'Turn left onto H1 West',
              distance: 5.5,
              duration: 12,
              maneuver: 'left'
            },
            {
              step: 3,
              instruction: 'Take exit 22B toward Convention Center',
              distance: 1.5,
              duration: 6,
              maneuver: 'right'
            }
          ],
          shelters: [EMERGENCY_SHELTERS[0]],
          status: 'congested',
          difficulty: 'moderate'
        },
        {
          id: 'route-2',
          name: 'Secondary Route - University Ave to UH Manoa',
          distance: 6.1,
          duration: 18,
          traffic_delay: 3,
          coordinates: [
            currentLocation,
            [-157.8100, 21.3000],
            [-157.8170, 21.2969]
          ],
          instructions: [
            {
              step: 1,
              instruction: 'Head northwest on University Ave',
              distance: 3.2,
              duration: 8,
              maneuver: 'straight'
            },
            {
              step: 2,
              instruction: 'Continue to UH Manoa Campus',
              distance: 2.9,
              duration: 10,
              maneuver: 'straight'
            }
          ],
          shelters: [EMERGENCY_SHELTERS[1]],
          status: 'clear',
          difficulty: 'easy'
        },
        {
          id: 'route-3',
          name: 'Emergency Route - Direct to Queen\'s Medical',
          distance: 4.8,
          duration: 15,
          traffic_delay: 5,
          coordinates: [
            currentLocation,
            [-157.8400, 21.3050],
            [-157.8478, 21.3099]
          ],
          instructions: [
            {
              step: 1,
              instruction: 'Head directly north on Punchbowl St',
              distance: 4.8,
              duration: 15,
              maneuver: 'straight'
            }
          ],
          shelters: [EMERGENCY_SHELTERS[2]],
          status: 'clear',
          difficulty: 'easy'
        }
      ]

      setRoutes(simulatedRoutes)

      // Add routes to map
      if (map.current) {
        simulatedRoutes.forEach((route, index) => {
          const routeColor = route.status === 'clear' ? '#10b981' :
                            route.status === 'congested' ? '#f59e0b' : '#ef4444'

          map.current!.addSource(`route-${route.id}`, {
            type: 'geojson',
            data: {
              type: 'Feature',
              properties: {},
              geometry: {
                type: 'LineString',
                coordinates: route.coordinates
              }
            }
          })

          map.current!.addLayer({
            id: `route-${route.id}`,
            type: 'line',
            source: `route-${route.id}`,
            layout: {
              'line-join': 'round',
              'line-cap': 'round'
            },
            paint: {
              'line-color': routeColor,
              'line-width': 6,
              'line-opacity': 0.8
            }
          })
        })
      }

    } catch (err) {
      setError('Failed to generate evacuation routes')
      console.error('Route generation error:', err)
    } finally {
      setLoading(false)
    }
  }

  const selectRoute = (route: EvacuationRoute) => {
    setSelectedRoute(route)
    onRouteSelect?.(route)

    // Highlight selected route on map
    if (map.current) {
      routes.forEach((r) => {
        map.current!.setPaintProperty(`route-${r.id}`, 'line-opacity', r.id === route.id ? 1 : 0.3)
        map.current!.setPaintProperty(`route-${r.id}`, 'line-width', r.id === route.id ? 8 : 4)
      })

      // Fit map to selected route
      const coordinates = route.coordinates
      const bounds = coordinates.reduce((bounds, coord) => {
        return bounds.extend(coord)
      }, new mapboxgl.LngLatBounds(coordinates[0], coordinates[0]))

      map.current.fitBounds(bounds, { padding: 50 })
    }
  }

  const handleEmergencyContact = () => {
    // In a real app, this would connect to emergency services
    const emergencyNumbers = [
      '911 - Police/Fire/EMS',
      '(808) 733-4300 - Honolulu Emergency Management',
      '(808) 935-0031 - Hawaii County Civil Defense',
      '(808) 270-7285 - Maui Emergency Management',
      '(808) 241-1800 - Kauai Emergency Management'
    ]
    
    const message = `Emergency Contact Numbers:\n\n${emergencyNumbers.join('\n')}\n\nFor immediate life-threatening emergencies, call 911.`
    
    if (confirm(`${message}\n\nWould you like to call 911 now?`)) {
      window.location.href = 'tel:911'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'clear': return 'bg-green-500'
      case 'congested': return 'bg-yellow-500'
      case 'blocked': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'text-green-600'
      case 'moderate': return 'text-yellow-600'
      case 'difficult': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  // Fallback view if Mapbox is not available
  if (!mapboxgl || !process.env.NEXT_PUBLIC_MAPBOX_TOKEN) {
    return (
      <div className="space-y-4">
        <Alert className="border-orange-200 bg-orange-50">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            Evacuation route mapping requires Mapbox configuration. Please add your token to .env.local
          </AlertDescription>
        </Alert>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Route className="h-5 w-5" />
              Emergency Evacuation Routes
            </CardTitle>
            <CardDescription>
              Pre-planned evacuation routes to emergency shelters
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {EMERGENCY_SHELTERS.slice(0, 3).map((shelter) => (
                <div key={shelter.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-semibold">{shelter.name}</h4>
                      <p className="text-sm text-gray-600">{shelter.address}</p>
                      <p className="text-sm text-gray-500">Capacity: {shelter.occupied}/{shelter.capacity}</p>
                    </div>
                    <Badge variant={shelter.status === 'open' ? 'default' : 'secondary'}>
                      {shelter.status}
                    </Badge>
                  </div>
                  <div className="mt-2 text-xs text-gray-500">
                    {shelter.amenities.join(' • ')}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Route Planning Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Route className="h-5 w-5" />
            Evacuation Route Planner
          </CardTitle>
          <CardDescription>
            Plan your emergency evacuation route to the nearest safe shelter
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="start-location" className="block text-sm font-medium mb-2 text-gray-700">Starting Location</label>
              <input
                id="start-location"
                type="text"
                placeholder="Enter your current address"
                value={startLocation}
                onChange={(e) => setStartLocation(e.target.value)}
                className="w-full p-3 border-2 border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 placeholder-gray-500 shadow-sm hover:border-gray-400 transition-colors"
              />
            </div>
            <div>
              <label htmlFor="destination-type" className="block text-sm font-medium mb-2 text-gray-700">Evacuation Destination</label>
              <select
                id="destination-type"
                className="w-full p-3 border-2 border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 shadow-sm hover:border-gray-400 transition-colors"
                value={destinationType}
                onChange={(e) => setDestinationType(e.target.value as 'nearest' | 'specific')}
              >
                <option value="nearest" className="py-2 text-gray-900 bg-white">Nearest Available Shelter</option>
                <option value="specific" className="py-2 text-gray-900 bg-white">Specific Shelter Location</option>
              </select>
            </div>
          </div>

          <div className="flex gap-2">
            <Button 
              onClick={generateRoutes}
              disabled={loading}
              className="flex items-center gap-2"
            >
              {loading ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Navigation className="h-4 w-4" />
              )}
              Generate Routes
            </Button>
            <Button 
              variant="outline" 
              onClick={handleEmergencyContact}
              className="bg-red-50 border-red-200 text-red-700 hover:bg-red-100 hover:border-red-300"
            >
              <Phone className="h-4 w-4 mr-2" />
              Emergency Contact
            </Button>
          </div>

          {error && (
            <Alert className="border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Interactive Map */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Route Map</CardTitle>
            <CardDescription>
              Interactive map showing evacuation routes and emergency shelters
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div 
              ref={mapContainer} 
              className="w-full h-[500px] rounded-lg overflow-hidden border"
            />
          </CardContent>
        </Card>

        {/* Routes List */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Available Routes</CardTitle>
            <CardDescription>
              Choose the best evacuation route based on current conditions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {routes.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Route className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Generate routes to see evacuation options</p>
                </div>
              ) : (
                routes.map((route) => (
                  <div
                    key={route.id}
                    className={`border rounded-lg p-4 cursor-pointer transition-all ${
                      selectedRoute?.id === route.id ? 'border-blue-500 bg-blue-50' : 'hover:border-gray-300'
                    }`}
                    onClick={() => selectRoute(route)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-semibold text-sm">{route.name}</h4>
                      <div className="flex gap-1">
                        <div className={`w-3 h-3 rounded-full ${getStatusColor(route.status)}`} />
                        <Badge variant="outline" className="text-xs">
                          {route.difficulty}
                        </Badge>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 text-sm text-gray-600 mb-3">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {route.distance} mi
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {route.duration + route.traffic_delay} min
                      </div>
                      <div className="flex items-center gap-1">
                        <Car className="h-3 w-3" />
                        {route.traffic_delay}min delay
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="text-xs text-gray-500">
                        To: {route.shelters[0]?.name}
                      </div>
                      <Button
                        size="sm"
                        variant={selectedRoute?.id === route.id ? "default" : "outline"}
                        className="text-xs"
                      >
                        {selectedRoute?.id === route.id ? "Selected" : "Select Route"}
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Route Instructions */}
      {selectedRoute && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Navigation className="h-5 w-5" />
              Turn-by-Turn Directions
            </CardTitle>
            <CardDescription>
              Follow these directions to reach {selectedRoute.shelters[0]?.name}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {selectedRoute.instructions.map((instruction, index) => (
                <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center font-bold">
                    {instruction.step}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{instruction.instruction}</p>
                    <div className="flex gap-4 text-sm text-gray-500 mt-1">
                      <span>{instruction.distance} mi</span>
                      <span>{instruction.duration} min</span>
                    </div>
                  </div>
                </div>
              ))}

              <div className="flex items-start gap-3 p-3 border rounded-lg bg-green-50 border-green-200">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-500 text-white text-xs flex items-center justify-center">
                  <Shield className="h-3 w-3" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-green-800">Arrival at Emergency Shelter</p>
                  <p className="text-sm text-green-600 mt-1">
                    You have reached {selectedRoute.shelters[0]?.name}. 
                    Report to the registration desk for assistance.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Emergency Shelters Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Emergency Shelter Status
          </CardTitle>
          <CardDescription>
            Current capacity and status of emergency shelters in your area
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {EMERGENCY_SHELTERS.map((shelter) => {
              const occupancyRate = (shelter.occupied / shelter.capacity) * 100
              return (
                <div key={shelter.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {shelter.type === 'hospital' ? <Shield className="h-4 w-4" /> :
                       shelter.type === 'school' ? <Users className="h-4 w-4" /> :
                       <Building className="h-4 w-4" />}
                      <h4 className="font-semibold text-sm">{shelter.name}</h4>
                    </div>
                    <Badge 
                      variant={shelter.status === 'open' ? 'default' : 'secondary'}
                      className={
                        shelter.status === 'open' ? 'bg-green-500' :
                        shelter.status === 'full' ? 'bg-yellow-500' : 'bg-red-500'
                      }
                    >
                      {shelter.status}
                    </Badge>
                  </div>
                  
                  <p className="text-xs text-gray-600 mb-2">{shelter.address}</p>
                  
                  <div className="mb-3">
                    <div className="flex justify-between text-sm mb-1">
                      <span>Capacity</span>
                      <span>{shelter.occupied}/{shelter.capacity}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${
                          occupancyRate < 70 ? 'bg-green-500' :
                          occupancyRate < 90 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${Math.min(occupancyRate, 100)}%` }}
                      />
                    </div>
                  </div>

                  <div className="space-y-1 text-xs text-gray-500">
                    <p className="flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      {shelter.contact}
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {shelter.amenities.slice(0, 2).map((amenity, idx) => (
                        <span key={idx} className="bg-gray-100 px-2 py-1 rounded text-xs">
                          {amenity}
                        </span>
                      ))}
                      {shelter.amenities.length > 2 && (
                        <span className="text-gray-400">+{shelter.amenities.length - 2} more</span>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}