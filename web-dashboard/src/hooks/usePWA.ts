"use client"

import { useEffect, useState } from 'react'

interface PWAState {
  isInstallable: boolean
  isInstalled: boolean
  isOffline: boolean
  pushSubscription: PushSubscription | null
  isSupported: boolean
}

interface PWAActions {
  installApp: () => Promise<void>
  enableNotifications: () => Promise<boolean>
  disableNotifications: () => Promise<void>
  registerServiceWorker: () => Promise<void>
}

export function usePWA(): PWAState & PWAActions {
  const [state, setState] = useState<PWAState>({
    isInstallable: false,
    isInstalled: false,
    isOffline: false,
    pushSubscription: null,
    isSupported: typeof window !== 'undefined' && 'serviceWorker' in navigator
  })

  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)

  // Check if app is installed
  const checkInstallStatus = () => {
    if (typeof window !== 'undefined') {
      const isInstalled = window.matchMedia('(display-mode: standalone)').matches ||
                         (window.navigator as any).standalone === true ||
                         document.referrer.includes('android-app://')
      
      setState(prev => ({ ...prev, isInstalled }))
    }
  }

  // Register service worker
  const registerServiceWorker = async () => {
    if (!state.isSupported) {
      console.log('Service workers not supported')
      return
    }

    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      })

      console.log('Service Worker registered:', registration)

      // Check for updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New content available, reload
              if (confirm('New version available. Reload to update?')) {
                window.location.reload()
              }
            }
          })
        }
      })

      // Get current push subscription
      const subscription = await registration.pushManager.getSubscription()
      setState(prev => ({ ...prev, pushSubscription: subscription }))

    } catch (error) {
      console.error('Service Worker registration failed:', error)
    }
  }

  // Install app
  const installApp = async () => {
    if (!deferredPrompt) {
      console.log('No install prompt available')
      return
    }

    try {
      deferredPrompt.prompt()
      const result = await deferredPrompt.userChoice
      
      if (result.outcome === 'accepted') {
        console.log('App installed')
        setState(prev => ({ ...prev, isInstalled: true, isInstallable: false }))
      }
      
      setDeferredPrompt(null)
    } catch (error) {
      console.error('App installation failed:', error)
    }
  }

  // Enable push notifications
  const enableNotifications = async (): Promise<boolean> => {
    if (!('Notification' in window) || !('serviceWorker' in navigator)) {
      console.log('Notifications not supported')
      return false
    }

    try {
      // Request permission
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        console.log('Notification permission denied')
        return false
      }

      // Get service worker registration
      const registration = await navigator.serviceWorker.ready
      
      // Subscribe to push notifications
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || 'your-vapid-key'
      })

      // Send subscription to server
      const response = await fetch('/api/v1/push-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          subscription: subscription.toJSON(),
          endpoint: subscription.endpoint
        })
      })

      if (response.ok) {
        setState(prev => ({ ...prev, pushSubscription: subscription }))
        console.log('Push notifications enabled')
        return true
      } else {
        throw new Error('Failed to register push subscription')
      }

    } catch (error) {
      console.error('Failed to enable notifications:', error)
      return false
    }
  }

  // Disable push notifications
  const disableNotifications = async () => {
    try {
      if (state.pushSubscription) {
        await state.pushSubscription.unsubscribe()
        setState(prev => ({ ...prev, pushSubscription: null }))
        
        // Notify server
        await fetch('/api/v1/push-subscription', {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        })
        
        console.log('Push notifications disabled')
      }
    } catch (error) {
      console.error('Failed to disable notifications:', error)
    }
  }

  useEffect(() => {
    if (typeof window === 'undefined') return

    // Check install status
    checkInstallStatus()

    // Listen for install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setState(prev => ({ ...prev, isInstallable: true }))
    }

    // Listen for online/offline status
    const handleOnline = () => setState(prev => ({ ...prev, isOffline: false }))
    const handleOffline = () => setState(prev => ({ ...prev, isOffline: true }))

    // Listen for app installed
    const handleAppInstalled = () => {
      setState(prev => ({ ...prev, isInstalled: true, isInstallable: false }))
      setDeferredPrompt(null)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    window.addEventListener('appinstalled', handleAppInstalled)

    // Register service worker on mount
    registerServiceWorker()

    // Set initial offline status
    setState(prev => ({ ...prev, isOffline: !navigator.onLine }))

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  return {
    ...state,
    installApp,
    enableNotifications,
    disableNotifications,
    registerServiceWorker
  }
}