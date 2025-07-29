"use client"

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  AlertTriangle, 
  Activity, 
  Cloud, 
  Waves, 
  Mountain, 
  Shield,
  Radio,
  Flame,
  Droplets,
  Wind,
  Users,
  Heart,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Eye,
  ExternalLink
} from 'lucide-react'

interface MonitoredSystem {
  id: string
  name: string
  category: string
  status: 'active' | 'inactive' | 'warning'
  lastChecked: string
  activeAlerts: number
  icon: React.ReactNode
  description: string
  subcategories?: {
    name: string
    status: 'active' | 'inactive' | 'warning'
    value?: string
  }[]
}

interface AlertStatusMonitorProps {
  onNavigateToAlerts?: () => void;
}

export function AlertStatusMonitor({ onNavigateToAlerts }: AlertStatusMonitorProps) {
  const [systems, setSystems] = useState<MonitoredSystem[]>([
    {
      id: 'weather',
      name: 'Weather Monitoring',
      category: 'weather',
      status: 'active',
      lastChecked: '2 min ago',
      activeAlerts: 0,
      icon: <Cloud className="h-5 w-5" />,
      description: 'National Weather Service alerts',
      subcategories: [
        { name: 'Hurricanes', status: 'inactive' },
        { name: 'Tropical Storms', status: 'inactive' },
        { name: 'High Surf', status: 'inactive', value: '4-6 ft' },
        { name: 'Flash Floods', status: 'inactive' }
      ]
    },
    {
      id: 'ocean',
      name: 'Ocean & Beach Safety',
      category: 'ocean',
      status: 'active',
      lastChecked: '5 min ago',
      activeAlerts: 0,
      icon: <Waves className="h-5 w-5" />,
      description: 'NOAA buoy data and beach conditions',
      subcategories: [
        { name: 'Wave Height', status: 'inactive', value: '3-5 ft' },
        { name: 'Rip Currents', status: 'inactive' },
        { name: 'Water Temp', status: 'inactive', value: '78°F' },
        { name: 'Shark Activity', status: 'inactive' }
      ]
    },
    {
      id: 'earthquake',
      name: 'Seismic Activity',
      category: 'earthquake',
      status: 'active',
      lastChecked: '1 min ago',
      activeAlerts: 0,
      icon: <Activity className="h-5 w-5" />,
      description: 'USGS earthquake monitoring',
      subcategories: [
        { name: 'Magnitude 2.5+', status: 'inactive' },
        { name: 'Tsunami Risk', status: 'inactive' },
        { name: 'Aftershocks', status: 'inactive' }
      ]
    },
    {
      id: 'volcano',
      name: 'Volcanic Activity',
      category: 'volcano',
      status: 'warning',
      lastChecked: '3 min ago',
      activeAlerts: 3,
      icon: <Mountain className="h-5 w-5" />,
      description: 'Hawaiian Volcano Observatory',
      subcategories: [
        { name: 'Kilauea', status: 'warning', value: 'Watch' },
        { name: 'Mauna Loa', status: 'warning', value: 'Watch' },
        { name: 'Hualalai', status: 'warning', value: 'Watch' },
        { name: 'Mauna Kea', status: 'inactive' }
      ]
    },
    {
      id: 'crime',
      name: 'Public Safety',
      category: 'security',
      status: 'warning',
      lastChecked: '10 min ago',
      activeAlerts: 2,
      icon: <Shield className="h-5 w-5" />,
      description: 'Crime data and security alerts',
      subcategories: [
        { name: 'Active Incidents', status: 'warning', value: '2' },
        { name: 'Traffic Incidents', status: 'inactive' },
        { name: 'Missing Persons', status: 'inactive' },
        { name: 'Road Closures', status: 'inactive' }
      ]
    },
    {
      id: 'wildfire',
      name: 'Fire Monitoring',
      category: 'wildfire',
      status: 'active',
      lastChecked: '7 min ago',
      activeAlerts: 0,
      icon: <Flame className="h-5 w-5" />,
      description: 'Wildfire detection and spread',
      subcategories: [
        { name: 'Active Fires', status: 'inactive' },
        { name: 'Fire Weather', status: 'inactive' },
        { name: 'Burn Bans', status: 'inactive' }
      ]
    },
    {
      id: 'air',
      name: 'Air Quality',
      category: 'health',
      status: 'active',
      lastChecked: '15 min ago',
      activeAlerts: 0,
      icon: <Wind className="h-5 w-5" />,
      description: 'VOG and air quality monitoring',
      subcategories: [
        { name: 'VOG Levels', status: 'inactive', value: 'Low' },
        { name: 'PM2.5', status: 'inactive', value: '12' },
        { name: 'Pollen Count', status: 'inactive', value: 'Low' }
      ]
    },
    {
      id: 'civil',
      name: 'Civil Defense',
      category: 'civil',
      status: 'active',
      lastChecked: '30 sec ago',
      activeAlerts: 0,
      icon: <Radio className="h-5 w-5" />,
      description: 'Emergency broadcasts and sirens',
      subcategories: [
        { name: 'Siren Tests', status: 'inactive' },
        { name: 'Evacuations', status: 'inactive' },
        { name: 'Shelters', status: 'inactive', value: '0 Open' }
      ]
    }
  ])

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setSystems(prevSystems => 
        prevSystems.map(system => ({
          ...system,
          lastChecked: `${Math.floor(Math.random() * 30) + 1} ${Math.random() > 0.5 ? 'sec' : 'min'} ago`
        }))
      )
    }, 30000) // Update every 30 seconds

    return () => clearInterval(interval)
  }, [])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-orange-500" />
      case 'inactive':
        return <XCircle className="h-4 w-4 text-gray-400" />
      default:
        return null
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'border-green-500 bg-green-50'
      case 'warning':
        return 'border-orange-500 bg-orange-50'
      case 'inactive':
        return 'border-gray-300 bg-gray-50'
      default:
        return 'border-gray-300'
    }
  }

  const totalActiveAlerts = systems.reduce((sum, system) => sum + system.activeAlerts, 0)

  return (
    <div className="space-y-4">
      {/* Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle>Emergency Monitoring System Status</CardTitle>
          <CardDescription>
            Real-time status of all monitored emergency systems across Hawaii
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-green-500" />
              <span className="text-lg font-semibold">
                All Systems Operational
              </span>
            </div>
            {totalActiveAlerts > 0 ? (
              <Button
                variant="destructive"
                size="sm"
                onClick={onNavigateToAlerts}
                className="gap-2"
              >
                <Eye className="h-4 w-4" />
                {totalActiveAlerts} Active Alert{totalActiveAlerts !== 1 ? 's' : ''}
                <ExternalLink className="h-3 w-3" />
              </Button>
            ) : (
              <Badge variant="secondary">
                {totalActiveAlerts} Active Alert{totalActiveAlerts !== 1 ? 's' : ''}
              </Badge>
            )}
          </div>
          
          {/* Quick Stats */}
          <div className="grid grid-cols-4 gap-4 text-center">
            <div className="p-3 rounded-lg bg-green-50">
              <p className="text-2xl font-bold text-green-600">
                {systems.filter(s => s.status === 'active' && s.activeAlerts === 0).length}
              </p>
              <p className="text-xs text-gray-600">Clear</p>
            </div>
            <div className="p-3 rounded-lg bg-orange-50">
              <p className="text-2xl font-bold text-orange-600">
                {systems.filter(s => s.status === 'warning').length}
              </p>
              <p className="text-xs text-gray-600">Warning</p>
            </div>
            <div 
              className={`p-3 rounded-lg bg-red-50 transition-all ${
                totalActiveAlerts > 0 ? 'hover:shadow-md cursor-pointer hover:bg-red-100' : ''
              }`}
              onClick={totalActiveAlerts > 0 ? onNavigateToAlerts : undefined}
            >
              <p className="text-2xl font-bold text-red-600">
                {totalActiveAlerts}
              </p>
              <p className="text-xs text-gray-600 flex items-center gap-1">
                Active
                {totalActiveAlerts > 0 && <ExternalLink className="h-3 w-3" />}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-blue-50">
              <p className="text-2xl font-bold text-blue-600">
                {systems.length}
              </p>
              <p className="text-xs text-gray-600">Monitored</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Individual System Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {systems.map((system) => (
          <Card
            key={system.id}
            className={`transition-all hover:shadow-lg ${getStatusColor(system.status)}`}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  {system.icon}
                  <div>
                    <CardTitle className="text-base">{system.name}</CardTitle>
                    <p className="text-xs text-gray-500">{system.description}</p>
                  </div>
                </div>
                {getStatusIcon(system.status)}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {/* Active Alerts Badge */}
                {system.activeAlerts > 0 && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={onNavigateToAlerts}
                    className="mb-2 h-6 text-xs gap-1"
                  >
                    <Eye className="h-3 w-3" />
                    {system.activeAlerts} Active Alert{system.activeAlerts !== 1 ? 's' : ''}
                    <ExternalLink className="h-2 w-2" />
                  </Button>
                )}
                
                {/* Subcategories */}
                <div className="space-y-1">
                  {system.subcategories?.map((sub, idx) => (
                    <div key={idx} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${
                          sub.status === 'active' ? 'bg-green-500' :
                          sub.status === 'warning' ? 'bg-orange-500' :
                          'bg-gray-300'
                        }`} />
                        <span className="text-gray-600">{sub.name}</span>
                      </div>
                      {sub.value && (
                        <span className="text-xs font-medium">{sub.value}</span>
                      )}
                    </div>
                  ))}
                </div>
                
                {/* Last Checked */}
                <div className="pt-2 mt-2 border-t">
                  <p className="text-xs text-gray-500">
                    Last checked: {system.lastChecked}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}