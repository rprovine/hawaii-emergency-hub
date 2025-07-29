"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { usePWA } from '@/hooks/usePWA'
import { 
  Download, 
  Bell, 
  BellOff, 
  Smartphone, 
  Wifi, 
  WifiOff,
  X,
  Shield,
  Zap
} from 'lucide-react'

export function PWABanner() {
  const { 
    isInstallable, 
    isInstalled, 
    isOffline, 
    pushSubscription,
    installApp,
    enableNotifications,
    disableNotifications
  } = usePWA()

  const [showInstallBanner, setShowInstallBanner] = useState(false)
  const [showNotificationBanner, setShowNotificationBanner] = useState(false)
  const [isEnablingNotifications, setIsEnablingNotifications] = useState(false)
  const [dismissed, setDismissed] = useState({
    install: false,
    notifications: false
  })

  useEffect(() => {
    // Show install banner if installable and not dismissed
    if (isInstallable && !isInstalled && !dismissed.install) {
      setShowInstallBanner(true)
    }

    // Show notification banner if not subscribed and not dismissed
    if (!pushSubscription && !dismissed.notifications && isInstalled) {
      // Delay notification prompt until after install
      setTimeout(() => setShowNotificationBanner(true), 2000)
    }
  }, [isInstallable, isInstalled, pushSubscription, dismissed])

  const handleInstall = async () => {
    try {
      await installApp()
      setShowInstallBanner(false)
    } catch (error) {
      console.error('Install failed:', error)
    }
  }

  const handleEnableNotifications = async () => {
    setIsEnablingNotifications(true)
    try {
      const success = await enableNotifications()
      if (success) {
        setShowNotificationBanner(false)
      }
    } catch (error) {
      console.error('Enable notifications failed:', error)
    } finally {
      setIsEnablingNotifications(false)
    }
  }

  const handleDisableNotifications = async () => {
    try {
      await disableNotifications()
    } catch (error) {
      console.error('Disable notifications failed:', error)
    }
  }

  const dismissBanner = (type: 'install' | 'notifications') => {
    setDismissed(prev => ({ ...prev, [type]: true }))
    if (type === 'install') setShowInstallBanner(false)
    if (type === 'notifications') setShowNotificationBanner(false)
  }

  return (
    <div className="space-y-2">
      {/* Offline Indicator */}
      {isOffline && (
        <Alert className="border-yellow-200 bg-yellow-50">
          <WifiOff className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800">
            <div className="flex items-center justify-between">
              <span>You're offline. Some features may be limited.</span>
              <Badge variant="outline" className="text-yellow-700 border-yellow-600">
                Cached Data Available
              </Badge>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Install App Banner */}
      {showInstallBanner && (
        <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Smartphone className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-blue-900">Install Hawaii Emergency Hub</h4>
                  <p className="text-sm text-blue-700">
                    Get faster access and offline emergency alerts
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  onClick={handleInstall}
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Install
                </Button>
                <Button
                  onClick={() => dismissBanner('install')}
                  variant="ghost"
                  size="sm"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            {/* Benefits */}
            <div className="mt-3 flex gap-4 text-xs text-blue-600">
              <div className="flex items-center gap-1">
                <Zap className="h-3 w-3" />
                Instant Loading
              </div>
              <div className="flex items-center gap-1">
                <WifiOff className="h-3 w-3" />
                Works Offline
              </div>
              <div className="flex items-center gap-1">
                <Shield className="h-3 w-3" />
                Secure
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Enable Notifications Banner */}
      {showNotificationBanner && (
        <Card className="border-green-200 bg-gradient-to-r from-green-50 to-emerald-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Bell className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-green-900">Enable Emergency Alerts</h4>
                  <p className="text-sm text-green-700">
                    Get instant notifications for critical emergencies
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  onClick={handleEnableNotifications}
                  disabled={isEnablingNotifications}
                  size="sm"
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Bell className="h-4 w-4 mr-2" />
                  {isEnablingNotifications ? 'Enabling...' : 'Enable'}
                </Button>
                <Button
                  onClick={() => dismissBanner('notifications')}
                  variant="ghost"
                  size="sm"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            {/* Critical Alert Info */}
            <div className="mt-3 p-2 bg-green-100 rounded text-xs text-green-700">
              <div className="flex items-center gap-1">
                <Shield className="h-3 w-3" />
                You'll only receive notifications for severe and extreme emergencies
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* PWA Status Indicators */}
      {(isInstalled || pushSubscription) && (
        <div className="flex gap-2 text-sm">
          {isInstalled && (
            <Badge variant="secondary" className="bg-blue-100 text-blue-700">
              <Smartphone className="h-3 w-3 mr-1" />
              App Installed
            </Badge>
          )}
          {pushSubscription && (
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-green-100 text-green-700">
                <Bell className="h-3 w-3 mr-1" />
                Notifications On
              </Badge>
              <Button
                onClick={handleDisableNotifications}
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs"
              >
                <BellOff className="h-3 w-3 mr-1" />
                Disable
              </Button>
            </div>
          )}
          {!isOffline && (
            <Badge variant="secondary" className="bg-green-100 text-green-700">
              <Wifi className="h-3 w-3 mr-1" />
              Online
            </Badge>
          )}
        </div>
      )}
    </div>
  )
}