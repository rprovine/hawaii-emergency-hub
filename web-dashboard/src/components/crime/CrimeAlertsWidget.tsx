"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Shield, AlertTriangle, MapPin, Clock, TrendingUp } from "lucide-react"

interface CrimeIncident {
  id: string
  type: string
  description: string
  location: string
  time: string
  severity: 'low' | 'medium' | 'high'
  latitude?: number
  longitude?: number
}

export function CrimeAlertsWidget() {
  const [incidents, setIncidents] = useState<CrimeIncident[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    total: 0,
    high: 0,
    medium: 0,
    low: 0
  })

  useEffect(() => {
    // For now, use mock data since the API requires premium subscription
    const mockIncidents: CrimeIncident[] = [
      {
        id: 'crime-1',
        type: 'Theft',
        description: 'Vehicle break-in reported in parking structure',
        location: 'Ala Moana Center, Honolulu',
        time: '2 hours ago',
        severity: 'medium',
        latitude: 21.2909,
        longitude: -157.8506
      },
      {
        id: 'crime-2',
        type: 'Vandalism',
        description: 'Graffiti reported on public property',
        location: 'Kapiolani Park, Honolulu',
        time: '5 hours ago',
        severity: 'low',
        latitude: 21.2670,
        longitude: -157.8235
      },
      {
        id: 'crime-3',
        type: 'Assault',
        description: 'Physical altercation reported, suspect fled scene',
        location: 'Downtown Honolulu',
        time: '8 hours ago',
        severity: 'high',
        latitude: 21.3099,
        longitude: -157.8581
      },
      {
        id: 'crime-4',
        type: 'Burglary',
        description: 'Residential break-in, no injuries reported',
        location: 'Kailua, Oahu',
        time: '12 hours ago',
        severity: 'medium',
        latitude: 21.3985,
        longitude: -157.7405
      },
      {
        id: 'crime-5',
        type: 'Traffic Incident',
        description: 'Hit and run, vehicle description provided to HPD',
        location: 'H-1 Freeway near Pearl Harbor',
        time: '16 hours ago',
        severity: 'medium',
        latitude: 21.3489,
        longitude: -157.9517
      }
    ]

    setIncidents(mockIncidents)
    
    // Calculate stats
    const stats = mockIncidents.reduce((acc, incident) => {
      acc.total++
      acc[incident.severity]++
      return acc
    }, { total: 0, high: 0, medium: 0, low: 0 })
    
    setStats(stats)
    setLoading(false)
  }, [])

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-red-500'
      case 'medium': return 'bg-orange-500'
      case 'low': return 'bg-yellow-500'
      default: return 'bg-gray-500'
    }
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'high': return '🚨'
      case 'medium': return '⚠️'
      case 'low': return '📝'
      default: return '📋'
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Crime Alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Crime Alerts
            </CardTitle>
            <CardDescription>
              Recent crime incidents in Hawaii (Last 24 hours)
            </CardDescription>
          </div>
          <Badge variant="outline" className="text-xs">
            {stats.total} Total
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Statistics Summary */}
        <div className="grid grid-cols-3 gap-2 p-3 bg-gray-50 rounded-lg">
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{stats.high}</div>
            <div className="text-xs text-gray-600">High</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">{stats.medium}</div>
            <div className="text-xs text-gray-600">Medium</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">{stats.low}</div>
            <div className="text-xs text-gray-600">Low</div>
          </div>
        </div>

        {/* Crime Incidents List */}
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {incidents.map((incident) => (
            <div 
              key={incident.id}
              className="border rounded-lg p-3 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{getSeverityIcon(incident.severity)}</span>
                  <div>
                    <div className="font-medium">{incident.type}</div>
                    <div className="text-sm text-gray-600">{incident.description}</div>
                  </div>
                </div>
                <Badge 
                  className={`${getSeverityColor(incident.severity)} text-white`}
                >
                  {incident.severity.toUpperCase()}
                </Badge>
              </div>
              
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <div className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {incident.location}
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {incident.time}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Premium Feature Notice */}
        <Alert className="mt-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Live Crime Data</strong> - This shows sample data. Premium subscription required for real-time crime incident tracking from Honolulu Police Department.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  )
}