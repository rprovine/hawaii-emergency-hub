"use client"

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Waves, 
  Wind, 
  Thermometer, 
  Navigation,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  MapPin
} from 'lucide-react'

interface BeachCondition {
  name: string
  island: string
  waveHeight: string
  waveDirection: string
  windSpeed: string
  windDirection: string
  waterTemp: string
  conditions: 'excellent' | 'good' | 'fair' | 'poor' | 'dangerous'
  warnings: string[]
  lastUpdated: string
}

interface BuoyData {
  id: string
  name: string
  waveHeight: number
  wavePeriod: number
  waterTemp: number
  windSpeed: number
  windDirection: number
  trend: 'rising' | 'falling' | 'steady'
}

export function OceanConditionsWidget() {
  const [selectedIsland, setSelectedIsland] = useState('Oahu')
  const [beachConditions, setBeachConditions] = useState<BeachCondition[]>([
    // OAHU BEACHES
    {
      name: "Waikiki Beach",
      island: "Oahu",
      waveHeight: "2-3 ft",
      waveDirection: "South",
      windSpeed: "10-15 mph",
      windDirection: "ENE",
      waterTemp: "78°F",
      conditions: "excellent",
      warnings: [],
      lastUpdated: "15 min ago"
    },
    {
      name: "Pipeline/Banzai",
      island: "Oahu",
      waveHeight: "8-10 ft",
      waveDirection: "NW",
      windSpeed: "15-20 mph",
      windDirection: "N",
      waterTemp: "77°F",
      conditions: "dangerous",
      warnings: ["High Surf Advisory", "Strong Currents", "Experts Only"],
      lastUpdated: "10 min ago"
    },
    {
      name: "Sunset Beach",
      island: "Oahu",
      waveHeight: "6-8 ft",
      waveDirection: "N",
      windSpeed: "12-18 mph",
      windDirection: "NE",
      waterTemp: "77°F",
      conditions: "fair",
      warnings: ["High Surf", "Experienced Swimmers Only"],
      lastUpdated: "12 min ago"
    },
    {
      name: "Hanauma Bay",
      island: "Oahu",
      waveHeight: "1-2 ft",
      waveDirection: "S",
      windSpeed: "5-10 mph",
      windDirection: "E",
      waterTemp: "79°F",
      conditions: "excellent",
      warnings: [],
      lastUpdated: "20 min ago"
    },
    {
      name: "Lanikai Beach",
      island: "Oahu",
      waveHeight: "1-2 ft",
      waveDirection: "E",
      windSpeed: "8-12 mph",
      windDirection: "ENE",
      waterTemp: "79°F",
      conditions: "excellent",
      warnings: [],
      lastUpdated: "18 min ago"
    },
    {
      name: "Sandy Beach",
      island: "Oahu",
      waveHeight: "4-6 ft",
      waveDirection: "SE",
      windSpeed: "12-16 mph",
      windDirection: "ENE",
      waterTemp: "78°F",
      conditions: "poor",
      warnings: ["Dangerous Shore Break", "Back Injuries Common"],
      lastUpdated: "22 min ago"
    },
    {
      name: "Ala Moana Beach Park",
      island: "Oahu",
      waveHeight: "1-2 ft",
      waveDirection: "S",
      windSpeed: "10-14 mph",
      windDirection: "ENE",
      waterTemp: "79°F",
      conditions: "good",
      warnings: [],
      lastUpdated: "16 min ago"
    },
    {
      name: "Waimea Bay",
      island: "Oahu",
      waveHeight: "15-20 ft",
      waveDirection: "NW",
      windSpeed: "18-25 mph",
      windDirection: "N",
      waterTemp: "76°F",
      conditions: "dangerous",
      warnings: ["Extremely High Surf", "Beach Closed", "Experts Only"],
      lastUpdated: "5 min ago"
    },

    // MAUI BEACHES
    {
      name: "Big Beach (Makena)",
      island: "Maui",
      waveHeight: "3-5 ft",
      waveDirection: "SW",
      windSpeed: "10-15 mph",
      windDirection: "N",
      waterTemp: "78°F",
      conditions: "good",
      warnings: ["Shore Break"],
      lastUpdated: "8 min ago"
    },
    {
      name: "Napili Bay",
      island: "Maui",
      waveHeight: "1-2 ft",
      waveDirection: "W",
      windSpeed: "5-10 mph",
      windDirection: "NE",
      waterTemp: "79°F",
      conditions: "excellent",
      warnings: [],
      lastUpdated: "25 min ago"
    },
    {
      name: "Ka'anapali Beach",
      island: "Maui",
      waveHeight: "2-3 ft",
      waveDirection: "W",
      windSpeed: "8-12 mph",
      windDirection: "ENE",
      waterTemp: "79°F",
      conditions: "excellent",
      warnings: [],
      lastUpdated: "14 min ago"
    },
    {
      name: "Wailea Beach",
      island: "Maui",
      waveHeight: "2-4 ft",
      waveDirection: "SW",
      windSpeed: "10-14 mph",
      windDirection: "N",
      waterTemp: "78°F",
      conditions: "good",
      warnings: [],
      lastUpdated: "19 min ago"
    },
    {
      name: "Ho'okipa Beach",
      island: "Maui",
      waveHeight: "6-8 ft",
      waveDirection: "N",
      windSpeed: "20-25 mph",
      windDirection: "ENE",
      waterTemp: "77°F",
      conditions: "fair",
      warnings: ["Strong Winds", "Windsurfing Area"],
      lastUpdated: "11 min ago"
    },
    {
      name: "Hana Bay",
      island: "Maui",
      waveHeight: "3-4 ft",
      waveDirection: "E",
      windSpeed: "12-16 mph",
      windDirection: "ENE",
      waterTemp: "78°F",
      conditions: "good",
      warnings: [],
      lastUpdated: "35 min ago"
    },

    // BIG ISLAND BEACHES
    {
      name: "Hapuna Beach",
      island: "Big Island",
      waveHeight: "3-5 ft",
      waveDirection: "NW",
      windSpeed: "12-18 mph",
      windDirection: "ENE",
      waterTemp: "78°F",
      conditions: "good",
      warnings: ["Shore Break"],
      lastUpdated: "13 min ago"
    },
    {
      name: "Mauna Kea Beach",
      island: "Big Island",
      waveHeight: "2-4 ft",
      waveDirection: "NW",
      windSpeed: "10-15 mph",
      windDirection: "ENE",
      waterTemp: "78°F",
      conditions: "excellent",
      warnings: [],
      lastUpdated: "17 min ago"
    },
    {
      name: "Punalu'u Black Sand",
      island: "Big Island",
      waveHeight: "4-6 ft",
      waveDirection: "SE",
      windSpeed: "14-18 mph",
      windDirection: "ENE",
      waterTemp: "77°F",
      conditions: "fair",
      warnings: ["Strong Currents", "Hot Sand"],
      lastUpdated: "28 min ago"
    },
    {
      name: "Green Sand Beach",
      island: "Big Island",
      waveHeight: "5-7 ft",
      waveDirection: "S",
      windSpeed: "16-22 mph",
      windDirection: "ENE",
      waterTemp: "76°F",
      conditions: "poor",
      warnings: ["Difficult Access", "Strong Currents", "Remote Location"],
      lastUpdated: "45 min ago"
    },
    {
      name: "Richardson's Beach Park",
      island: "Big Island",
      waveHeight: "2-3 ft",
      waveDirection: "E",
      windSpeed: "10-14 mph",
      windDirection: "ENE",
      waterTemp: "79°F",
      conditions: "good",
      warnings: [],
      lastUpdated: "21 min ago"
    },

    // KAUAI BEACHES
    {
      name: "Hanalei Bay",
      island: "Kauai",
      waveHeight: "4-6 ft",
      waveDirection: "N",
      windSpeed: "12-16 mph",
      windDirection: "ENE",
      waterTemp: "78°F",
      conditions: "fair",
      warnings: ["Strong Currents in Winter"],
      lastUpdated: "26 min ago"
    },
    {
      name: "Poipu Beach",
      island: "Kauai",
      waveHeight: "2-3 ft",
      waveDirection: "S",
      windSpeed: "8-12 mph",
      windDirection: "ENE",
      waterTemp: "79°F",
      conditions: "excellent",
      warnings: [],
      lastUpdated: "12 min ago"
    },
    {
      name: "Tunnels Beach",
      island: "Kauai",
      waveHeight: "3-5 ft",
      waveDirection: "N",
      windSpeed: "10-15 mph",
      windDirection: "ENE",
      waterTemp: "78°F",
      conditions: "good",
      warnings: ["Check Conditions", "Reef Protection"],
      lastUpdated: "31 min ago"
    },
    {
      name: "Lydgate Beach Park",
      island: "Kauai",
      waveHeight: "1-2 ft",
      waveDirection: "E",
      windSpeed: "8-12 mph",
      windDirection: "ENE",
      waterTemp: "79°F",
      conditions: "excellent",
      warnings: [],
      lastUpdated: "15 min ago"
    },

    // MOLOKAI BEACHES
    {
      name: "Papohaku Beach",
      island: "Molokai",
      waveHeight: "5-7 ft",
      waveDirection: "W",
      windSpeed: "15-20 mph",
      windDirection: "ENE",
      waterTemp: "77°F",
      conditions: "poor",
      warnings: ["Dangerous Currents", "No Lifeguards"],
      lastUpdated: "52 min ago"
    },
    {
      name: "Halawa Beach Park",
      island: "Molokai",
      waveHeight: "3-4 ft",
      waveDirection: "N",
      windSpeed: "12-16 mph",
      windDirection: "ENE",
      waterTemp: "78°F",
      conditions: "fair",
      warnings: ["Remote Location"],
      lastUpdated: "1 hr ago"
    },

    // LANAI BEACHES
    {
      name: "Shipwreck Beach",
      island: "Lanai",
      waveHeight: "4-6 ft",
      waveDirection: "N",
      windSpeed: "14-18 mph",
      windDirection: "ENE",
      waterTemp: "77°F",
      conditions: "poor",
      warnings: ["Strong Currents", "No Swimming"],
      lastUpdated: "1.5 hr ago"
    },
    {
      name: "Hulopoe Beach",
      island: "Lanai",
      waveHeight: "2-3 ft",
      waveDirection: "S",
      windSpeed: "10-14 mph",
      windDirection: "ENE",
      waterTemp: "78°F",
      conditions: "good",
      warnings: [],
      lastUpdated: "47 min ago"
    }
  ])

  const [buoyData, setBuoyData] = useState<BuoyData[]>([
    // OAHU BUOYS
    {
      id: "51201",
      name: "Waimea Bay, Oahu",
      waveHeight: 8.5,
      wavePeriod: 12,
      waterTemp: 77,
      windSpeed: 18,
      windDirection: 45,
      trend: "rising"
    },
    {
      id: "51202",
      name: "Mokapu Point, Oahu",
      waveHeight: 4.2,
      wavePeriod: 8,
      waterTemp: 78,
      windSpeed: 12,
      windDirection: 70,
      trend: "steady"
    },
    {
      id: "51001",
      name: "NW Hawaii, Oahu",
      waveHeight: 12.1,
      wavePeriod: 14,
      waterTemp: 76,
      windSpeed: 22,
      windDirection: 315,
      trend: "rising"
    },
    {
      id: "51003",
      name: "Honolulu Harbor, Oahu",
      waveHeight: 3.2,
      wavePeriod: 7,
      waterTemp: 79,
      windSpeed: 14,
      windDirection: 65,
      trend: "falling"
    },

    // MAUI BUOYS
    {
      id: "51004",
      name: "Haleakala, Maui",
      waveHeight: 6.8,
      wavePeriod: 10,
      waterTemp: 78,
      windSpeed: 16,
      windDirection: 75,
      trend: "steady"
    },
    {
      id: "51002",
      name: "Molokai Channel, Maui",
      waveHeight: 5.4,
      wavePeriod: 9,
      waterTemp: 77,
      windSpeed: 19,
      windDirection: 45,
      trend: "falling"
    },
    {
      id: "51026",
      name: "West Maui",
      waveHeight: 4.7,
      wavePeriod: 8,
      waterTemp: 79,
      windSpeed: 13,
      windDirection: 85,
      trend: "steady"
    },

    // BIG ISLAND BUOYS
    {
      id: "51005",
      name: "Hilo Bay, Big Island",
      waveHeight: 3.9,
      wavePeriod: 7,
      waterTemp: 78,
      windSpeed: 15,
      windDirection: 95,
      trend: "rising"
    },
    {
      id: "51022",
      name: "South Point, Big Island",
      waveHeight: 7.3,
      wavePeriod: 11,
      waterTemp: 77,
      windSpeed: 21,
      windDirection: 135,
      trend: "falling"
    },
    {
      id: "51006",
      name: "Kona Coast, Big Island",
      waveHeight: 2.8,
      wavePeriod: 6,
      waterTemp: 79,
      windSpeed: 11,
      windDirection: 225,
      trend: "steady"
    },

    // KAUAI BUOYS
    {
      id: "51027",
      name: "Hanalei Bay, Kauai",
      waveHeight: 9.2,
      wavePeriod: 13,
      waterTemp: 76,
      windSpeed: 20,
      windDirection: 15,
      trend: "rising"
    },
    {
      id: "51028",
      name: "Barking Sands, Kauai",
      waveHeight: 5.1,
      wavePeriod: 9,
      waterTemp: 78,
      windSpeed: 17,
      windDirection: 255,
      trend: "steady"
    },

    // OFFSHORE DEEP WATER BUOYS
    {
      id: "51000",
      name: "NW Hawaii Deep Water",
      waveHeight: 15.3,
      wavePeriod: 16,
      waterTemp: 75,
      windSpeed: 28,
      windDirection: 330,
      trend: "rising"
    },
    {
      id: "51023",
      name: "North Pacific High",
      waveHeight: 18.7,
      wavePeriod: 18,
      waterTemp: 74,
      windSpeed: 32,
      windDirection: 315,
      trend: "rising"
    },
    {
      id: "51101",
      name: "Central Pacific",
      waveHeight: 11.4,
      wavePeriod: 14,
      waterTemp: 76,
      windSpeed: 24,
      windDirection: 285,
      trend: "steady"
    },

    // MOLOKAI & LANAI AREA BUOYS
    {
      id: "51029",
      name: "Molokai Channel",
      waveHeight: 6.6,
      wavePeriod: 10,
      waterTemp: 77,
      windSpeed: 18,
      windDirection: 55,
      trend: "falling"
    },
    {
      id: "51030",
      name: "Lanai Passage",
      waveHeight: 4.8,
      wavePeriod: 8,
      waterTemp: 78,
      windSpeed: 15,
      windDirection: 75,
      trend: "steady"
    }
  ])

  const getConditionColor = (condition: string) => {
    switch (condition) {
      case 'excellent': return 'bg-green-500'
      case 'good': return 'bg-blue-500'
      case 'fair': return 'bg-yellow-500'
      case 'poor': return 'bg-orange-500'
      case 'dangerous': return 'bg-red-600'
      default: return 'bg-gray-500'
    }
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'rising': return <TrendingUp className="h-4 w-4 text-red-500" />
      case 'falling': return <TrendingDown className="h-4 w-4 text-green-500" />
      case 'steady': return <Minus className="h-4 w-4 text-gray-500" />
      default: return null
    }
  }

  const islands = ['Oahu', 'Maui', 'Big Island', 'Kauai', 'Molokai', 'Lanai']

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Waves className="h-5 w-5" />
          Ocean & Beach Conditions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="beaches" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="beaches">Beach Conditions</TabsTrigger>
            <TabsTrigger value="buoys">Buoy Data</TabsTrigger>
          </TabsList>

          <TabsContent value="beaches" className="space-y-4">
            {/* Island Selector */}
            <div className="flex gap-2 flex-wrap">
              {islands.map((island) => (
                <Badge
                  key={island}
                  variant={selectedIsland === island ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => setSelectedIsland(island)}
                >
                  {island}
                </Badge>
              ))}
            </div>

            {/* Beach Cards */}
            <div className="space-y-3">
              {beachConditions
                .filter(beach => beach.island === selectedIsland)
                .map((beach, idx) => (
                  <div
                    key={idx}
                    className="border rounded-lg p-4 space-y-3 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-semibold flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          {beach.name}
                        </h4>
                        <p className="text-sm text-gray-500">Updated {beach.lastUpdated}</p>
                      </div>
                      <Badge className={getConditionColor(beach.conditions)}>
                        {beach.conditions.charAt(0).toUpperCase() + beach.conditions.slice(1)}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                      <div className="flex items-center gap-2">
                        <Waves className="h-4 w-4 text-blue-500" />
                        <div>
                          <p className="font-medium">{beach.waveHeight}</p>
                          <p className="text-xs text-gray-500">{beach.waveDirection}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Wind className="h-4 w-4 text-gray-500" />
                        <div>
                          <p className="font-medium">{beach.windSpeed}</p>
                          <p className="text-xs text-gray-500">{beach.windDirection}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Thermometer className="h-4 w-4 text-orange-500" />
                        <div>
                          <p className="font-medium">{beach.waterTemp}</p>
                          <p className="text-xs text-gray-500">Water</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Navigation className="h-4 w-4 text-green-500" />
                        <div>
                          <p className="font-medium">{beach.waveDirection}</p>
                          <p className="text-xs text-gray-500">Swell</p>
                        </div>
                      </div>
                    </div>

                    {beach.warnings.length > 0 && (
                      <div className="flex items-center gap-2 p-2 bg-yellow-50 rounded-md">
                        <AlertTriangle className="h-4 w-4 text-yellow-600" />
                        <div className="text-sm">
                          {beach.warnings.map((warning, idx) => (
                            <Badge
                              key={idx}
                              variant="outline"
                              className="text-yellow-700 border-yellow-600 mr-2"
                            >
                              {warning}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
            </div>
          </TabsContent>

          <TabsContent value="buoys" className="space-y-4">
            {/* Buoy Type Selector */}
            <div className="flex gap-2 flex-wrap">
              <Badge
                variant="default"
                className="cursor-pointer"
              >
                All Buoys ({buoyData.length})
              </Badge>
              <Badge
                variant="outline"
                className="cursor-pointer"
              >
                Nearshore ({buoyData.filter(b => !b.name.includes('Deep Water') && !b.name.includes('Pacific')).length})
              </Badge>
              <Badge
                variant="outline"
                className="cursor-pointer"
              >
                Offshore ({buoyData.filter(b => b.name.includes('Deep Water') || b.name.includes('Pacific')).length})
              </Badge>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {buoyData.map((buoy) => (
                <Card key={buoy.id} className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold">Buoy {buoy.id} - {buoy.name}</h4>
                      {getTrendIcon(buoy.trend)}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-500">Wave Height</span>
                          <span className="font-medium">{buoy.waveHeight} ft</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-500">Wave Period</span>
                          <span className="font-medium">{buoy.wavePeriod} sec</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-500">Water Temp</span>
                          <span className="font-medium">{buoy.waterTemp}°F</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-500">Wind Speed</span>
                          <span className="font-medium">{buoy.windSpeed} mph</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-500">Wind Dir</span>
                          <span className="font-medium">{buoy.windDirection}°</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-500">Trend</span>
                          <span className="font-medium capitalize">{buoy.trend}</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Mini wave height chart placeholder */}
                    <div className="h-16 bg-gray-50 rounded flex items-end justify-around p-2">
                      {[4, 6, 5, 7, 8, 8.5, 9, 8.5].map((height, idx) => (
                        <div
                          key={idx}
                          className="w-3 bg-blue-400 rounded-t"
                          style={{ height: `${(height / 10) * 100}%` }}
                        />
                      ))}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
            
            {/* Legend */}
            <Card className="p-3 bg-gray-50">
              <p className="text-sm font-medium mb-2">Trend Indicators</p>
              <div className="flex gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <TrendingUp className="h-4 w-4 text-red-500" />
                  <span>Rising</span>
                </div>
                <div className="flex items-center gap-1">
                  <Minus className="h-4 w-4 text-gray-500" />
                  <span>Steady</span>
                </div>
                <div className="flex items-center gap-1">
                  <TrendingDown className="h-4 w-4 text-green-500" />
                  <span>Falling</span>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}