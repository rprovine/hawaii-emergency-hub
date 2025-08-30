"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  AlertTriangle, 
  Shield, 
  Map, 
  Users, 
  Waves, 
  Cloud, 
  Radio, 
  Activity,
  Bell,
  Smartphone,
  Globe,
  CheckCircle,
  ArrowRight,
  Zap,
  Eye,
  MapPin,
  Siren,
  Heart,
  Home,
  Phone,
  Wifi,
  Mountain,
  Navigation,
  Timer
} from "lucide-react"

export default function LandingPage() {

  const features = [
    {
      icon: <AlertTriangle className="h-8 w-8 text-red-500" />,
      title: "Real-Time Alerts",
      description: "Instant notifications for tsunamis, hurricanes, volcanic activity, and severe weather",
      badge: "24/7 Monitoring"
    },
    {
      icon: <Map className="h-8 w-8 text-blue-500" />,
      title: "Interactive Alert Map",
      description: "Visual tracking of all emergency events across Hawaiian islands with live updates",
      badge: "Mapbox Powered"
    },
    {
      icon: <Waves className="h-8 w-8 text-cyan-500" />,
      title: "Ocean Conditions",
      description: "Surf heights, tide charts, water temperatures, and marine hazard warnings",
      badge: "NOAA Data"
    },
    {
      icon: <Shield className="h-8 w-8 text-purple-500" />,
      title: "Crime Tracking",
      description: "Real-time crime incidents and safety scores for your location",
      badge: "HPD Integration"
    },
    {
      icon: <Users className="h-8 w-8 text-pink-500" />,
      title: "Family Safety",
      description: "Check-in system and location sharing during emergencies",
      badge: "Peace of Mind"
    },
    {
      icon: <Radio className="h-8 w-8 text-teal-500" />,
      title: "Emergency Communications",
      description: "HAM radio frequencies, emergency contacts, and shelter information",
      badge: "Offline Ready"
    }
  ]

  const dataSources = [
    { name: "National Weather Service", type: "Weather & Marine", status: "live" },
    { name: "USGS Earthquake", type: "Seismic Activity", status: "live" },
    { name: "HVO Volcano Watch", type: "Volcanic Activity", status: "live" },
    { name: "Pacific Tsunami Warning Center", type: "Tsunami Alerts", status: "live" },
    { name: "Honolulu Police Department", type: "Crime Data", status: "live" },
    { name: "Hawaii DOT", type: "Traffic Cameras", status: "live" }
  ]


  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50 to-white">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-8 w-8 text-red-600" />
              <span className="text-xl font-bold text-gray-900">Hawaii Emergency Hub</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="#features" className="text-gray-600 hover:text-gray-900">Features</Link>
              <Link href="#data" className="text-gray-600 hover:text-gray-900">Data Sources</Link>
              <Link href="#resources" className="text-gray-600 hover:text-gray-900">Resources</Link>
              <Link href="/dashboard">
                <Button className="bg-red-600 hover:bg-red-700 text-white">
                  Open Dashboard
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-20 pb-32 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <Badge className="mb-4 bg-red-100 text-red-700 border-red-200">
            <Zap className="h-3 w-3 mr-1" />
            Protecting Hawaii 24/7
          </Badge>
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Stay Safe with Real-Time
            <span className="text-red-600"> Emergency Alerts</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Comprehensive emergency monitoring for Hawaii residents. Get instant alerts for tsunamis, 
            hurricanes, volcanic activity, and more. Your complete safety companion.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/dashboard">
              <Button size="lg" className="bg-red-600 hover:bg-red-700 text-white px-8">
                <Bell className="mr-2 h-5 w-5" />
                Access Emergency Dashboard
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="px-8">
              <Smartphone className="mr-2 h-5 w-5" />
              Download Mobile App
            </Button>
          </div>
          
          {/* Live Status Bar */}
          <div className="mt-12 inline-flex items-center space-x-6 p-4 bg-white rounded-lg shadow-lg">
            <div className="flex items-center space-x-2">
              <div className="h-3 w-3 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium">System Online</span>
            </div>
            <div className="text-sm text-gray-600">
              <span className="font-semibold">3</span> Active Alerts
            </div>
            <div className="text-sm text-gray-600">
              <span className="font-semibold">24,847</span> Users Protected
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Complete Emergency Management Platform
            </h2>
            <p className="text-lg text-gray-600">
              Everything you need to stay informed and safe during emergencies
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    {feature.icon}
                    <Badge variant="secondary" className="text-xs">
                      {feature.badge}
                    </Badge>
                  </div>
                  <CardTitle className="mt-4">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Alert Types */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Monitor Every Type of Emergency
            </h2>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: "🌊", name: "Tsunami", time: "< 1 min" },
              { icon: "🌀", name: "Hurricane", time: "Real-time" },
              { icon: "🌋", name: "Volcanic", time: "Live" },
              { icon: "🌊", name: "Flash Flood", time: "Instant" },
              { icon: "🔥", name: "Wildfire", time: "< 2 min" },
              { icon: "⚡", name: "Severe Storm", time: "Real-time" },
              { icon: "🌊", name: "High Surf", time: "Hourly" },
              { icon: "💨", name: "High Wind", time: "Live" }
            ].map((alert, index) => (
              <div key={index} className="bg-white p-6 rounded-lg border hover:border-red-300 transition-colors text-center">
                <div className="text-4xl mb-2">{alert.icon}</div>
                <div className="font-semibold">{alert.name}</div>
                <div className="text-sm text-gray-500">{alert.time}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Data Sources */}
      <section id="data" className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Powered by Official Data Sources
            </h2>
            <p className="text-lg text-gray-600">
              Real-time integration with government and scientific agencies
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {dataSources.map((source, index) => (
              <div key={index} className="bg-white p-4 rounded-lg border flex items-center justify-between">
                <div>
                  <div className="font-semibold">{source.name}</div>
                  <div className="text-sm text-gray-600">{source.type}</div>
                </div>
                <Badge className='bg-green-100 text-green-700'>
                  <Activity className="h-3 w-3 mr-1" />
                  Live
                </Badge>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Emergency Resources */}
      <section id="resources" className="py-20 px-4 sm:px-6 lg:px-8 bg-red-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Emergency Preparedness Resources
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <Home className="h-8 w-8 text-orange-500 mb-2" />
                <CardTitle>Emergency Kit Checklist</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">Interactive checklist to ensure your emergency supplies are ready</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <Navigation className="h-8 w-8 text-blue-500 mb-2" />
                <CardTitle>Evacuation Routes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">Pre-planned evacuation routes for every district and hazard type</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <Phone className="h-8 w-8 text-green-500 mb-2" />
                <CardTitle>Emergency Contacts</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">Quick access to all emergency services and disaster assistance</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-red-600 to-red-700">
        <div className="max-w-4xl mx-auto text-center text-white">
          <h2 className="text-4xl font-bold mb-4">
            Don't Wait for Disaster to Strike
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Join thousands of Hawaii residents who trust our platform for their safety
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/dashboard">
              <Button size="lg" className="bg-white text-red-600 hover:bg-gray-100">
                Start Protecting Your Family
                <Shield className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
              Schedule Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <AlertTriangle className="h-6 w-6 text-red-500" />
                <span className="font-bold">Hawaii Emergency Hub</span>
              </div>
              <p className="text-sm text-gray-400">
                Your trusted partner for emergency preparedness and real-time alerts in Hawaii.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link href="#features" className="hover:text-white">Features</Link></li>
                <li><Link href="/dashboard" className="hover:text-white">Dashboard</Link></li>
                <li><a href="#" className="hover:text-white">Mobile App</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Resources</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white">Emergency Guide</a></li>
                <li><a href="#" className="hover:text-white">API Documentation</a></li>
                <li><a href="#" className="hover:text-white">System Status</a></li>
                <li><a href="#" className="hover:text-white">Contact Support</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Emergency Contacts</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>Emergency: <span className="text-white font-bold">911</span></li>
                <li>Tsunami Warning: <span className="text-white">1-808-725-6382</span></li>
                <li>Red Cross Hawaii: <span className="text-white">1-808-734-2101</span></li>
              </ul>
            </div>
          </div>
          
          <div className="mt-12 pt-8 border-t border-gray-800 text-center text-sm text-gray-400">
            <p>&copy; 2024 Hawaii Emergency Hub. All rights reserved. Keeping Hawaii Safe.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}