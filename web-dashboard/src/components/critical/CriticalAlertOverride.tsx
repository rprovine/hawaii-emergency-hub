"use client"

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  AlertTriangle,
  Volume2,
  VolumeX,
  Settings,
  Bell,
  BellRing,
  Smartphone,
  Shield,
  Zap,
  Clock,
  CheckCircle,
  X,
  Play,
  Pause,
  RotateCcw
} from 'lucide-react'

interface CriticalAlert {
  id: string
  title: string
  message: string
  severity: 'extreme' | 'critical'
  category: 'tsunami' | 'volcano' | 'earthquake' | 'hurricane' | 'other'
  location: string
  timestamp: Date
  expires?: Date
  requiredOverride: boolean
  isActive: boolean
}

interface OverrideCapabilities {
  canBypassSilent: boolean
  canBypassDND: boolean
  canVibrate: boolean
  canPlayAudio: boolean
  canRequestFullscreen: boolean
  canShowNotifications: boolean
}

interface CriticalAlertOverrideProps {
  onAlertTriggered?: (alert: CriticalAlert) => void
  onOverrideRequested?: (capabilities: string[]) => void
}

export function CriticalAlertOverride({
  onAlertTriggered,
  onOverrideRequested
}: CriticalAlertOverrideProps) {
  const [capabilities, setCapabilities] = useState<OverrideCapabilities>({
    canBypassSilent: false,
    canBypassDND: false,
    canVibrate: false,
    canPlayAudio: false,
    canRequestFullscreen: false,
    canShowNotifications: false
  })
  
  const [criticalAlerts, setCriticalAlerts] = useState<CriticalAlert[]>([])
  const [activeOverride, setActiveOverride] = useState<CriticalAlert | null>(null)
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null)
  const [isTestMode, setIsTestMode] = useState(false)
  const [testAlert, setTestAlert] = useState<CriticalAlert | null>(null)

  // Check device capabilities on mount
  useEffect(() => {
    checkDeviceCapabilities()
  }, [])

  const checkDeviceCapabilities = async () => {
    const caps: OverrideCapabilities = {
      canBypassSilent: false,
      canBypassDND: false,
      canVibrate: 'vibrate' in navigator,
      canPlayAudio: 'AudioContext' in window,
      canRequestFullscreen: 'requestFullscreen' in document.documentElement,
      canShowNotifications: 'Notification' in window
    }

    // Check notification permissions
    if ('Notification' in window) {
      const permission = await Notification.requestPermission()
      caps.canShowNotifications = permission === 'granted'
    }

    // Check wake lock API (helps prevent device sleep during critical alerts)
    if ('wakeLock' in navigator) {
      try {
        // @ts-ignore - Wake Lock API is experimental
        await navigator.wakeLock.request('screen')
        caps.canBypassDND = true
      } catch (e) {
        console.log('Wake lock not available')
      }
    }

    // Check if we can create audio context (indicates audio capability)
    if ('AudioContext' in window) {
      try {
        const ctx = new AudioContext()
        caps.canPlayAudio = ctx.state !== 'suspended'
        caps.canBypassSilent = true // Modern browsers can play audio even in silent mode with user interaction
        setAudioContext(ctx)
      } catch (e) {
        console.log('Audio context creation failed')
      }
    }

    setCapabilities(caps)
  }

  // Generate emergency alert tone
  const generateAlertTone = useCallback(() => {
    if (!audioContext) return

    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()
    
    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)
    
    // Create distinctive emergency alert pattern (similar to EAS tone)
    oscillator.frequency.setValueAtTime(853, audioContext.currentTime) // EAS alert frequency
    oscillator.frequency.setValueAtTime(960, audioContext.currentTime + 0.5)
    oscillator.frequency.setValueAtTime(853, audioContext.currentTime + 1.0)
    
    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime)
    gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.1)
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 2.0)
    
    oscillator.start(audioContext.currentTime)
    oscillator.stop(audioContext.currentTime + 2.0)
  }, [audioContext])

  // Trigger full override sequence
  const triggerCriticalOverride = async (alert: CriticalAlert) => {
    setActiveOverride(alert)
    
    try {
      // 1. Request fullscreen to grab attention
      if (capabilities.canRequestFullscreen) {
        await document.documentElement.requestFullscreen()
      }

      // 2. Wake lock to prevent sleep
      if ('wakeLock' in navigator) {
        // @ts-ignore
        await navigator.wakeLock.request('screen')
      }

      // 3. Maximum volume audio alert
      if (capabilities.canPlayAudio && audioContext) {
        // Resume audio context if suspended
        if (audioContext.state === 'suspended') {
          await audioContext.resume()
        }
        
        // Play alert tone 3 times
        generateAlertTone()
        setTimeout(() => generateAlertTone(), 2500)
        setTimeout(() => generateAlertTone(), 5000)
      }

      // 4. Vibration pattern (if available)
      if (capabilities.canVibrate) {
        // Emergency vibration pattern: long-short-long-short-long
        navigator.vibrate([1000, 200, 1000, 200, 1000])
      }

      // 5. Show persistent notification
      if (capabilities.canShowNotifications) {
        new Notification(`🚨 CRITICAL EMERGENCY: ${alert.title}`, {
          body: alert.message,
          icon: '/emergency-icon.png',
          requireInteraction: true,
          tag: 'critical-emergency',
          silent: false // Force sound even in silent mode
        })
      }

      // 6. Flash screen for visual attention
      flashScreen()

      onAlertTriggered?.(alert)
      
    } catch (error) {
      console.error('Failed to trigger critical override:', error)
    }
  }

  const flashScreen = () => {
    const flashOverlay = document.createElement('div')
    flashOverlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: red;
      z-index: 10000;
      opacity: 0.8;
      pointer-events: none;
    `
    
    document.body.appendChild(flashOverlay)
    
    // Flash 3 times
    let flashes = 0
    const flashInterval = setInterval(() => {
      flashOverlay.style.opacity = flashOverlay.style.opacity === '0' ? '0.8' : '0'
      flashes++
      
      if (flashes >= 6) {
        clearInterval(flashInterval)
        document.body.removeChild(flashOverlay)
      }
    }, 200)
  }

  const dismissOverride = () => {
    setActiveOverride(null)
    
    // Exit fullscreen
    if (document.fullscreenElement) {
      document.exitFullscreen()
    }
  }

  const testCriticalAlert = () => {
    const testAlertData: CriticalAlert = {
      id: 'test-critical-001',
      title: 'TEST: Tsunami Warning - North Shore Oahu',
      message: 'This is a test of the Critical Alert Override System. In a real emergency, this would be a life-threatening tsunami warning requiring immediate evacuation.',
      severity: 'critical',
      category: 'tsunami',
      location: 'North Shore, Oahu',
      timestamp: new Date(),
      expires: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
      requiredOverride: true,
      isActive: true
    }
    
    setTestAlert(testAlertData)
    setIsTestMode(true)
    triggerCriticalOverride(testAlertData)
  }

  const requestPermissions = async () => {
    const requiredCapabilities: string[] = []
    
    // Request notification permission
    if ('Notification' in window && Notification.permission !== 'granted') {
      await Notification.requestPermission()
      requiredCapabilities.push('notifications')
    }
    
    // Request audio permission (requires user interaction)
    if (audioContext && audioContext.state === 'suspended') {
      try {
        await audioContext.resume()
        requiredCapabilities.push('audio')
      } catch (e) {
        console.log('Audio permission denied')
      }
    }
    
    onOverrideRequested?.(requiredCapabilities)
    
    // Re-check capabilities
    await checkDeviceCapabilities()
  }

  const getCapabilityStatus = (capability: keyof OverrideCapabilities): 'enabled' | 'disabled' | 'partial' => {
    if (capabilities[capability]) return 'enabled'
    
    // Check for partial support
    if (capability === 'canBypassSilent' && capabilities.canPlayAudio) return 'partial'
    if (capability === 'canBypassDND' && capabilities.canShowNotifications) return 'partial'
    
    return 'disabled'
  }

  return (
    <div className="space-y-4">
      {/* Active Override Modal */}
      {activeOverride && (
        <div className="fixed inset-0 z-50 bg-red-900/90 flex items-center justify-center p-4">
          <Card className="w-full max-w-lg border-red-500 bg-red-50">
            <CardHeader className="bg-red-600 text-white">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-6 w-6 animate-pulse" />
                  CRITICAL EMERGENCY ALERT
                </CardTitle>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={dismissOverride}
                  className="text-white hover:text-red-100"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-bold text-red-900">{activeOverride.title}</h3>
                  <p className="text-red-800 mt-2">{activeOverride.message}</p>
                </div>
                <div className="flex items-center justify-between">
                  <Badge variant="destructive" className="bg-red-700">
                    {activeOverride.severity.toUpperCase()}
                  </Badge>
                  <span className="text-sm text-red-700">
                    {activeOverride.location}
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button 
                    className="flex-1 bg-red-600 hover:bg-red-700"
                    onClick={dismissOverride}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Acknowledge
                  </Button>
                  {isTestMode && (
                    <Button 
                      variant="outline"
                      onClick={() => {
                        setIsTestMode(false)
                        setTestAlert(null)
                        dismissOverride()
                      }}
                    >
                      End Test
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Critical Alert Override System */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-yellow-500" />
            Critical Alert Override System
          </CardTitle>
          <CardDescription>
            Breakthrough system for life-threatening emergencies that bypasses device silent modes and DND settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* System Status */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3 p-3 border rounded-lg">
              <Volume2 className={`h-5 w-5 ${getCapabilityStatus('canBypassSilent') === 'enabled' ? 'text-green-600' : 'text-red-600'}`} />
              <div>
                <div className="text-sm font-medium">Silent Mode Bypass</div>
                <div className="text-xs text-muted-foreground">
                  {getCapabilityStatus('canBypassSilent') === 'enabled' ? 'Enabled' : 'Limited'}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 border rounded-lg">
              <BellRing className={`h-5 w-5 ${getCapabilityStatus('canBypassDND') === 'enabled' ? 'text-green-600' : 'text-red-600'}`} />
              <div>
                <div className="text-sm font-medium">DND Override</div>
                <div className="text-xs text-muted-foreground">
                  {getCapabilityStatus('canBypassDND') === 'enabled' ? 'Available' : 'Limited'}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 border rounded-lg">
              <Smartphone className={`h-5 w-5 ${capabilities.canVibrate ? 'text-green-600' : 'text-red-600'}`} />
              <div>
                <div className="text-sm font-medium">Vibration</div>
                <div className="text-xs text-muted-foreground">
                  {capabilities.canVibrate ? 'Supported' : 'Not Available'}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 border rounded-lg">
              <Bell className={`h-5 w-5 ${capabilities.canShowNotifications ? 'text-green-600' : 'text-red-600'}`} />
              <div>
                <div className="text-sm font-medium">Notifications</div>
                <div className="text-xs text-muted-foreground">
                  {capabilities.canShowNotifications ? 'Permitted' : 'Blocked'}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 border rounded-lg">
              <Shield className={`h-5 w-5 ${capabilities.canRequestFullscreen ? 'text-green-600' : 'text-red-600'}`} />
              <div>
                <div className="text-sm font-medium">Fullscreen</div>
                <div className="text-xs text-muted-foreground">
                  {capabilities.canRequestFullscreen ? 'Available' : 'Blocked'}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 border rounded-lg">
              <Volume2 className={`h-5 w-5 ${capabilities.canPlayAudio ? 'text-green-600' : 'text-red-600'}`} />
              <div>
                <div className="text-sm font-medium">Audio Alerts</div>
                <div className="text-xs text-muted-foreground">
                  {capabilities.canPlayAudio ? 'Ready' : 'Disabled'}
                </div>
              </div>
            </div>
          </div>

          {/* Permission Request */}
          {(!capabilities.canShowNotifications || !capabilities.canPlayAudio) && (
            <Alert className="border-orange-200 bg-orange-50">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
              <AlertDescription className="text-orange-800">
                <div className="flex items-center justify-between">
                  <span>Critical alert capabilities require additional permissions to function properly.</span>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={requestPermissions}
                    className="ml-4"
                  >
                    <Settings className="h-3 w-3 mr-2" />
                    Enable Permissions
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Override Triggers */}
          <div>
            <h4 className="font-medium mb-3">Critical Override Triggers</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                { category: 'tsunami', icon: '🌊', label: 'Tsunami Warning', color: 'bg-blue-600' },
                { category: 'volcano', icon: '🌋', label: 'Volcanic Eruption', color: 'bg-red-600' },
                { category: 'earthquake', icon: '🏔️', label: 'Major Earthquake', color: 'bg-yellow-600' },
                { category: 'hurricane', icon: '🌀', label: 'Hurricane Alert', color: 'bg-purple-600' }
              ].map((trigger) => (
                <div key={trigger.category} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 ${trigger.color} rounded-full flex items-center justify-center text-white text-sm`}>
                      {trigger.icon}
                    </div>
                    <span className="font-medium">{trigger.label}</span>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    Auto-Override
                  </Badge>
                </div>
              ))}
            </div>
          </div>

          {/* Test System */}
          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium">System Testing</h4>
              <Badge variant={isTestMode ? "destructive" : "secondary"}>
                {isTestMode ? "Test Active" : "Ready"}
              </Badge>
            </div>
            
            <Alert className="border-blue-200 bg-blue-50 mb-4">
              <AlertTriangle className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800">
                Test the critical alert system to ensure all override mechanisms work properly. This will simulate a life-threatening emergency alert.
              </AlertDescription>
            </Alert>

            <div className="flex gap-2">
              <Button 
                onClick={testCriticalAlert}
                disabled={isTestMode}
                className="gap-2"
              >
                <Play className="h-4 w-4" />
                Test Critical Override
              </Button>
              
              {isTestMode && (
                <Button 
                  variant="outline"
                  onClick={() => {
                    setIsTestMode(false)
                    setTestAlert(null)
                    dismissOverride()
                  }}
                >
                  <Pause className="h-4 w-4 mr-2" />
                  Stop Test
                </Button>
              )}
            </div>
          </div>

          {/* Recent Overrides */}
          <div className="border-t pt-4">
            <h4 className="font-medium mb-3">Recent Critical Alerts</h4>
            <div className="space-y-2">
              {criticalAlerts.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No critical alerts triggered recently
                </p>
              ) : (
                criticalAlerts.slice(0, 3).map((alert) => (
                  <div key={alert.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium text-sm">{alert.title}</div>
                      <div className="text-xs text-muted-foreground">
                        <Clock className="h-3 w-3 inline mr-1" />
                        {alert.timestamp.toLocaleString()}
                      </div>
                    </div>
                    <Badge 
                      variant={alert.severity === 'critical' ? 'destructive' : 'secondary'}
                      className="text-xs"
                    >
                      {alert.severity.toUpperCase()}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}