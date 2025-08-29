"use client"

import { Alert as AlertType } from '@/lib/api'
import { Badge } from '@/components/ui/badge'

interface SimpleAlertMapProps {
  alerts: AlertType[]
}

const severityColors = {
  minor: '#facc15',
  moderate: '#fb923c',
  severe: '#ef4444',
  extreme: '#7f1d1d',
  critical: '#7f1d1d',
  high: '#ef4444',
  low: '#facc15'
}

export function SimpleAlertMap({ alerts }: SimpleAlertMapProps) {
  // Hawaii bounds for map display
  const hawaiiBounds = {
    north: 22.2356,
    south: 18.9106,
    east: -154.8067,
    west: -160.2471
  }
  
  // Calculate normalized positions for alerts
  const normalizedAlerts = alerts.map(alert => {
    if (!alert.latitude || !alert.longitude) return null
    
    // Normalize coordinates to 0-100% range
    const x = ((alert.longitude - hawaiiBounds.west) / (hawaiiBounds.east - hawaiiBounds.west)) * 100
    const y = ((hawaiiBounds.north - alert.latitude) / (hawaiiBounds.north - hawaiiBounds.south)) * 100
    
    return {
      ...alert,
      x,
      y
    }
  }).filter(Boolean)

  return (
    <div className="relative w-full h-[600px] rounded-lg overflow-hidden bg-gradient-to-b from-blue-400 to-blue-600">
      {/* Ocean background */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-300 via-blue-500 to-blue-700" />
      </div>
      
      {/* Simple Hawaii islands representation */}
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        {/* Big Island */}
        <ellipse cx="85" cy="75" rx="8" ry="10" fill="#4a5568" opacity="0.8" />
        {/* Maui */}
        <ellipse cx="72" cy="55" rx="5" ry="4" fill="#4a5568" opacity="0.8" />
        {/* Molokai */}
        <ellipse cx="65" cy="48" rx="4" ry="2" fill="#4a5568" opacity="0.8" />
        {/* Lanai */}
        <ellipse cx="68" cy="52" rx="2" ry="2" fill="#4a5568" opacity="0.8" />
        {/* Oahu */}
        <ellipse cx="55" cy="45" rx="5" ry="5" fill="#4a5568" opacity="0.8" />
        {/* Kauai */}
        <ellipse cx="35" cy="35" rx="4" ry="4" fill="#4a5568" opacity="0.8" />
        {/* Niihau */}
        <ellipse cx="28" cy="38" rx="2" ry="3" fill="#4a5568" opacity="0.8" />
      </svg>
      
      {/* Alert markers */}
      {normalizedAlerts.map((alert, index) => {
        if (!alert) return null
        return (
          <div
            key={alert.id}
            className="absolute transform -translate-x-1/2 -translate-y-1/2 group"
            style={{
              left: `${alert.x}%`,
              top: `${alert.y}%`,
              zIndex: 10 + index
            }}
          >
            {/* Pulse animation for severe alerts */}
            {(alert.severity === 'severe' || alert.severity === 'extreme') && (
              <div 
                className="absolute inset-0 rounded-full animate-ping"
                style={{
                  backgroundColor: severityColors[alert.severity as keyof typeof severityColors],
                  width: '24px',
                  height: '24px',
                  opacity: 0.3
                }}
              />
            )}
            
            {/* Alert marker */}
            <div
              className="w-4 h-4 rounded-full border-2 border-white shadow-lg cursor-pointer hover:scale-125 transition-transform"
              style={{
                backgroundColor: severityColors[alert.severity as keyof typeof severityColors] || '#666'
              }}
            />
            
            {/* Tooltip on hover */}
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block">
              <div className="bg-white rounded-lg shadow-xl p-3 min-w-[200px]">
                <h4 className="font-semibold text-sm mb-1">{alert.title}</h4>
                <p className="text-xs text-gray-600 mb-2">{alert.location_name}</p>
                <Badge variant="outline" className="text-xs">
                  {alert.severity?.toUpperCase()}
                </Badge>
              </div>
              {/* Arrow */}
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
                <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-white" />
              </div>
            </div>
          </div>
        )
      })}
      
      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur rounded-lg p-3 shadow-lg">
        <h4 className="text-sm font-semibold mb-2">Alert Severity</h4>
        <div className="space-y-1">
          {Object.entries(severityColors).slice(0, 4).map(([severity, color]) => (
            <div key={severity} className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full border border-white"
                style={{ backgroundColor: color }}
              />
              <span className="text-xs capitalize">{severity}</span>
            </div>
          ))}
        </div>
      </div>
      
      {/* Alert count */}
      <div className="absolute top-4 right-4 bg-white/90 backdrop-blur rounded-lg px-3 py-2 shadow-lg">
        <span className="text-sm font-semibold">{alerts.length} Active Alerts</span>
      </div>
    </div>
  )
}