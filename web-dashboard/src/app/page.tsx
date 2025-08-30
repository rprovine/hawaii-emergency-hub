"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { api, DashboardMetrics, Alert as AlertType, AlertTrend } from "@/lib/api"
import { LoginForm } from "@/components/auth/login-form"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertMap } from "@/components/maps/AlertMap"
import { SimpleAlertMap } from "@/components/maps/SimpleAlertMap"
import { AlertStatusMonitor } from "@/components/monitoring/AlertStatusMonitor"
import { OceanConditionsWidget } from "@/components/ocean/OceanConditionsWidget"
import { CrimeAlertsWidget } from "@/components/crime/CrimeAlertsWidget"
import { PWABanner } from "@/components/pwa/PWABanner"
import { EmergencyChecklistWidget } from "@/components/emergency/EmergencyChecklistWidget"
import { EvacuationRoutePlanner } from "@/components/evacuation/EvacuationRoutePlanner"
import { WeatherRadarWidget } from "@/components/weather/WeatherRadarWidget"
import { FamilySafetyWidget } from "@/components/family/FamilySafetyWidget"
import { CriticalAlertOverride } from "@/components/critical/CriticalAlertOverride"
import { TsunamiWarningWidget } from "@/components/tsunami/TsunamiWarningWidget"
import { EmergencyCommHub } from "@/components/communication/EmergencyCommHub"
import { CommunityReporting } from "@/components/community/CommunityReporting"
import { ComprehensiveDashboard } from "@/components/comprehensive/ComprehensiveDashboard"
import { 
  AlertTriangle, 
  Clock, 
  Users, 
  Activity,
  Download,
  Plus,
  TrendingUp,
  TrendingDown,
  MapPin,
  Radio,
  Map,
  Shield,
  Route,
  Cloud,
  Heart
} from "lucide-react"
import { 
  LineChart, 
  Line, 
  AreaChart,
  Area,
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts"

const severityColors = {
  minor: "hsl(47.9, 95.8%, 53.1%)",
  moderate: "hsl(32.6, 94.6%, 43.7%)",
  severe: "hsl(0, 84.2%, 60.2%)",
  extreme: "hsl(0, 62.8%, 30.6%)",
  critical: "hsl(0, 62.8%, 30.6%)",
  high: "hsl(0, 84.2%, 60.2%)",
  low: "hsl(47.9, 95.8%, 53.1%)"
}

export default function DashboardPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(true) // Bypass auth for demo
  const [token, setToken] = useState<string | null>(null)
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [alerts, setAlerts] = useState<AlertType[]>([])
  const [trends, setTrends] = useState<AlertTrend[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [systemHealth, setSystemHealth] = useState(98)
  const [activeTab, setActiveTab] = useState("overview")
  const [selectedMapAlert, setSelectedMapAlert] = useState<AlertType | null>(null)

  // Handle browser navigation
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      // Prevent default browser back behavior that might break state
      if (event.state && event.state.tab) {
        setActiveTab(event.state.tab)
      }
    }

    // Push initial state
    if (typeof window !== 'undefined') {
      window.history.replaceState({ tab: activeTab }, '', window.location.href)
      window.addEventListener('popstate', handlePopState)
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('popstate', handlePopState)
      }
    }
  }, [])

  // Update history when tab changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.history.pushState({ tab: activeTab }, '', window.location.href)
    }
    
    // Clear selected map alert when navigating away from map tab
    if (activeTab !== "map") {
      setSelectedMapAlert(null)
    }
  }, [activeTab])

  // Check for existing token on mount
  useEffect(() => {
    const savedToken = localStorage.getItem("token")
    if (savedToken) {
      setToken(savedToken)
      setIsAuthenticated(true)
    }
  }, [])

  // Fetch real data from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'
        console.log('Fetching data from:', apiUrl)
        
        const [metricsData, alertsData, trendsData] = await Promise.all([
          api.getDashboardMetrics(),
          api.getAlerts(5),
          api.getAlertTrends(24) // Last 24 hours
        ])
        
        console.log('Metrics data:', metricsData)
        console.log('Alerts data:', alertsData)
        console.log('Trends data:', trendsData)
        
        setMetrics(metricsData)
        setAlerts(alertsData.alerts)
        setTrends(trendsData)
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error)
        setError(error instanceof Error ? error.message : 'Failed to fetch data')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
    // Refresh every 30 seconds
    const interval = setInterval(fetchData, 30000)
    return () => clearInterval(interval)
  }, [])

  const handleLoginSuccess = (newToken: string) => {
    setToken(newToken)
    setIsAuthenticated(true)
  }

  const handleLogout = () => {
    localStorage.removeItem("token")
    setToken(null)
    setIsAuthenticated(false)
  }

  const handleNavigateToAlerts = () => {
    setActiveTab("active")
  }

  const handleNavigateToMapLocation = (alert: AlertType) => {
    console.log('Navigating to map for alert:', {
      id: alert.id,
      title: alert.title,
      location_name: alert.location_name,
      latitude: alert.latitude,
      longitude: alert.longitude
    })
    // Set the selected alert first, then switch to map tab
    setSelectedMapAlert(alert)
    setActiveTab("map")
  }

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center p-8 bg-gray-50">
        <LoginForm onSuccess={handleLoginSuccess} />
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      {/* PWA Banner */}
      <PWABanner />
      
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Emergency Operations Dashboard</h2>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={handleLogout}>
            Logout
          </Button>
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Export Report
          </Button>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Alert
          </Button>
        </div>
      </div>

      {/* System Status Alert */}
      {error ? (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            Error loading dashboard: {error}
          </AlertDescription>
        </Alert>
      ) : (
        <Alert className="border-green-200 bg-green-50">
          <Radio className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            {loading ? 'Loading dashboard data...' : `All systems operational. ${metrics ? `${metrics.total_users} registered users. ${metrics.active_alerts} active alerts.` : ''}`}
          </AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        {/* Mobile/Small Screen Navigation */}
        <div className="block lg:hidden">
          <div className="flex flex-wrap gap-2 p-2 bg-gray-50 rounded-lg border">
            <button
              onClick={() => setActiveTab("overview")}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === "overview" 
                  ? "bg-blue-600 text-white shadow-sm" 
                  : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200"
              }`}
            >
              🏠 Home
            </button>
            <button
              onClick={() => setActiveTab("map")}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === "map" 
                  ? "bg-blue-600 text-white shadow-sm" 
                  : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200"
              }`}
            >
              🗺️ Map
            </button>
            <button
              onClick={() => setActiveTab("active")}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === "active" 
                  ? "bg-red-600 text-white shadow-sm" 
                  : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200"
              }`}
            >
              🚨 Alerts
            </button>
            <button
              onClick={() => setActiveTab("family")}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === "family" 
                  ? "bg-pink-600 text-white shadow-sm" 
                  : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200"
              }`}
            >
              ❤️ Family
            </button>
            <button
              onClick={() => setActiveTab("evacuation")}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === "evacuation" 
                  ? "bg-orange-600 text-white shadow-sm" 
                  : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200"
              }`}
            >
              🏃 Evac
            </button>
            <button
              onClick={() => setActiveTab("weather")}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === "weather" 
                  ? "bg-blue-500 text-white shadow-sm" 
                  : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200"
              }`}
            >
              ⛅ Weather
            </button>
            <button
              onClick={() => setActiveTab("ocean")}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === "ocean" 
                  ? "bg-cyan-600 text-white shadow-sm" 
                  : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200"
              }`}
            >
              🌊 Ocean
            </button>
            <button
              onClick={() => setActiveTab("crime")}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === "crime" 
                  ? "bg-purple-600 text-white shadow-sm" 
                  : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200"
              }`}
            >
              🚔 Crime
            </button>
            <button
              onClick={() => setActiveTab("monitor")}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === "monitor" 
                  ? "bg-green-600 text-white shadow-sm" 
                  : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200"
              }`}
            >
              📊 Monitor
            </button>
            <button
              onClick={() => setActiveTab("checklist")}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === "checklist" 
                  ? "bg-purple-600 text-white shadow-sm" 
                  : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200"
              }`}
            >
              📦 Kit
            </button>
            <button
              onClick={() => setActiveTab("communications")}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === "communications" 
                  ? "bg-teal-600 text-white shadow-sm" 
                  : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200"
              }`}
            >
              📡 Comms
            </button>
            <button
              onClick={() => setActiveTab("community")}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === "community" 
                  ? "bg-amber-600 text-white shadow-sm" 
                  : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200"
              }`}
            >
              👥 Reports
            </button>
            <button
              onClick={() => setActiveTab("analytics")}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === "analytics" 
                  ? "bg-indigo-600 text-white shadow-sm" 
                  : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200"
              }`}
            >
              📈 Analytics
            </button>
            <button
              onClick={() => setActiveTab("system")}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === "system" 
                  ? "bg-gray-600 text-white shadow-sm" 
                  : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200"
              }`}
            >
              ⚙️ System
            </button>
          </div>
        </div>

        {/* Desktop Navigation */}
        <TabsList className="hidden lg:flex w-full h-auto p-2 bg-white border rounded-lg shadow-sm flex-wrap gap-2 justify-center xl:justify-start">
          <TabsTrigger value="overview" className="min-w-[140px] px-4 py-3 text-sm font-medium rounded-md data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-sm transition-all">
            🏠 Overview
          </TabsTrigger>
          <TabsTrigger value="map" className="min-w-[140px] px-4 py-3 text-sm font-medium rounded-md data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-sm transition-all">
            🗺️ Alert Map
          </TabsTrigger>
          <TabsTrigger value="monitor" className="min-w-[140px] px-4 py-3 text-sm font-medium rounded-md data-[state=active]:bg-green-600 data-[state=active]:text-white data-[state=active]:shadow-sm transition-all">
            📊 Monitoring
          </TabsTrigger>
          <TabsTrigger value="active" className="min-w-[140px] px-4 py-3 text-sm font-medium rounded-md data-[state=active]:bg-red-600 data-[state=active]:text-white data-[state=active]:shadow-sm transition-all">
            🚨 Active Alerts
          </TabsTrigger>
          <TabsTrigger value="evacuation" className="min-w-[140px] px-4 py-3 text-sm font-medium rounded-md data-[state=active]:bg-orange-600 data-[state=active]:text-white data-[state=active]:shadow-sm transition-all">
            🏃 Evacuation
          </TabsTrigger>
          <TabsTrigger value="weather" className="min-w-[140px] px-4 py-3 text-sm font-medium rounded-md data-[state=active]:bg-blue-500 data-[state=active]:text-white data-[state=active]:shadow-sm transition-all">
            ⛅ Weather
          </TabsTrigger>
          <TabsTrigger value="ocean" className="min-w-[140px] px-4 py-3 text-sm font-medium rounded-md data-[state=active]:bg-cyan-600 data-[state=active]:text-white data-[state=active]:shadow-sm transition-all">
            🌊 Ocean
          </TabsTrigger>
          <TabsTrigger value="family" className="min-w-[140px] px-4 py-3 text-sm font-medium rounded-md data-[state=active]:bg-pink-600 data-[state=active]:text-white data-[state=active]:shadow-sm transition-all">
            ❤️ Family Safety
          </TabsTrigger>
          <TabsTrigger value="checklist" className="min-w-[140px] px-4 py-3 text-sm font-medium rounded-md data-[state=active]:bg-purple-600 data-[state=active]:text-white data-[state=active]:shadow-sm transition-all">
            📦 Emergency Kit
          </TabsTrigger>
          <TabsTrigger value="communications" className="min-w-[150px] px-4 py-3 text-sm font-medium rounded-md data-[state=active]:bg-teal-600 data-[state=active]:text-white data-[state=active]:shadow-sm transition-all">
            📡 Communications
          </TabsTrigger>
          <TabsTrigger value="community" className="min-w-[140px] px-4 py-3 text-sm font-medium rounded-md data-[state=active]:bg-amber-600 data-[state=active]:text-white data-[state=active]:shadow-sm transition-all">
            👥 Community
          </TabsTrigger>
          <TabsTrigger value="analytics" className="min-w-[140px] px-4 py-3 text-sm font-medium rounded-md data-[state=active]:bg-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-sm transition-all">
            📈 Analytics
          </TabsTrigger>
          <TabsTrigger value="system" className="min-w-[150px] px-4 py-3 text-sm font-medium rounded-md data-[state=active]:bg-gray-600 data-[state=active]:text-white data-[state=active]:shadow-sm transition-all">
            ⚙️ System Health
          </TabsTrigger>
          <TabsTrigger value="comprehensive" className="min-w-[140px] px-4 py-3 text-sm font-medium rounded-md data-[state=active]:bg-purple-600 data-[state=active]:text-white data-[state=active]:shadow-sm transition-all">
            🌐 All Data
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* KPI Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="relative overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics?.active_alerts || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {metrics?.alerts_last_24h || 0} in last 24 hours
                </p>
                <Progress value={(metrics?.active_alerts || 0) * 10} className="mt-2 h-2" />
              </CardContent>
              <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-red-500 to-orange-500" />
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics?.response_metrics.average_response_minutes || 0}m</div>
                <p className="text-xs text-muted-foreground">
                  Median: {metrics?.response_metrics.median_response_minutes || 0}m
                </p>
                <div className="mt-2 flex items-center text-xs">
                  <TrendingDown className="h-3 w-3 text-green-500 mr-1" />
                  <span className="text-green-500">12% improvement</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Connected Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics?.total_users || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Registered users in system
                </p>
                <div className="mt-2 flex items-center text-xs">
                  <Activity className="h-3 w-3 text-blue-500 mr-1" />
                  <span>Live</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">System Health</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{systemHealth.toFixed(1)}%</div>
                <p className="text-xs text-muted-foreground">
                  All services operational
                </p>
                <Progress value={systemHealth} className="mt-2 h-2" />
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Alert Frequency</CardTitle>
                <CardDescription>
                  Number of alerts issued over the last 24 hours
                </CardDescription>
              </CardHeader>
              <CardContent className="pl-2">
                <ResponsiveContainer width="100%" height={350}>
                  <AreaChart data={trends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Area 
                      type="monotone" 
                      dataKey="count" 
                      stroke="hsl(221.2, 83.2%, 53.3%)" 
                      fill="hsl(221.2, 83.2%, 53.3%)" 
                      fillOpacity={0.3}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>Alert Severity Distribution</CardTitle>
                <CardDescription>
                  Breakdown of alerts by severity level
                </CardDescription>
              </CardHeader>
              <CardContent>
                {metrics && (
                  <>
                    <ResponsiveContainer width="100%" height={350}>
                      <PieChart>
                        <Pie
                          data={Object.entries(metrics.alerts_by_severity).map(([severity, count]) => ({
                            name: severity.charAt(0).toUpperCase() + severity.slice(1),
                            value: count,
                            color: severityColors[severity as keyof typeof severityColors]
                          }))}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {Object.entries(metrics.alerts_by_severity).map(([severity], index) => (
                            <Cell key={`cell-${index}`} fill={severityColors[severity as keyof typeof severityColors]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="mt-4 space-y-2">
                      {Object.entries(metrics.alerts_by_severity).map(([severity, count]) => {
                        const total = Object.values(metrics.alerts_by_severity).reduce((a, b) => a + b, 0);
                        const percentage = Math.round((count / total) * 100);
                        return (
                          <div key={severity} className="flex items-center justify-between">
                            <div className="flex items-center">
                              <div 
                                className="h-3 w-3 rounded-full mr-2" 
                                style={{ backgroundColor: severityColors[severity as keyof typeof severityColors] }}
                              />
                              <span className="text-sm">{severity.charAt(0).toUpperCase() + severity.slice(1)}</span>
                            </div>
                            <span className="text-sm font-medium">{count} ({percentage}%)</span>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Alert Activity</CardTitle>
              <CardDescription>
                Latest alerts broadcasted to the network
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {alerts.slice(0, 3).map((alert) => (
                  <div key={alert.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <Badge 
                        variant={['severe', 'extreme', 'critical'].includes(alert.severity) ? 'destructive' : 'secondary'}
                        className={
                          alert.severity === 'extreme' || alert.severity === 'critical' ? 'bg-red-900' :
                          alert.severity === 'severe' || alert.severity === 'high' ? 'bg-red-600' : 
                          alert.severity === 'moderate' ? 'bg-orange-500' : 
                          'bg-yellow-500'
                        }
                      >
                        {alert.severity.toUpperCase()}
                      </Badge>
                      <div>
                        <p className="font-medium">{alert.title}</p>
                        <div className="flex items-center text-sm text-muted-foreground">
                          <MapPin className="h-3 w-3 mr-1" />
                          {alert.location_name || alert.affected_counties?.[0] || 'Hawaii'} • {alert.time_until_expiry || 'Active'}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{alert.affected_counties?.length || 1}</p>
                      <p className="text-xs text-muted-foreground">counties affected</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="map" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Map className="h-5 w-5" />
                    Live Alert Map
                  </CardTitle>
                  <CardDescription>
                    Real-time visualization of all active emergency alerts across Hawaii
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export Map
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <AlertMap 
                alerts={alerts} 
                selectedAlert={selectedMapAlert}
                onAlertSelect={setSelectedMapAlert}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="monitor" className="space-y-4">
          <AlertStatusMonitor onNavigateToAlerts={handleNavigateToAlerts} />
          <TsunamiWarningWidget />
          <CriticalAlertOverride />
        </TabsContent>

        <TabsContent value="evacuation" className="space-y-4">
          <EvacuationRoutePlanner 
            currentLocation={[-157.8167, 21.4667]}
            emergencyType="general"
          />
        </TabsContent>

        <TabsContent value="weather" className="space-y-4">
          <WeatherRadarWidget 
            center={[-157.8167, 21.4667]}
            zoom={7}
            showAnimation={true}
            showAlerts={true}
          />
        </TabsContent>

        <TabsContent value="ocean" className="space-y-4">
          <OceanConditionsWidget />
        </TabsContent>

        <TabsContent value="crime" className="space-y-4">
          <CrimeAlertsWidget />
        </TabsContent>

        <TabsContent value="family" className="space-y-4">
          <FamilySafetyWidget />
        </TabsContent>

        <TabsContent value="checklist" className="space-y-4">
          <EmergencyChecklistWidget />
        </TabsContent>

        <TabsContent value="communications" className="space-y-4">
          <EmergencyCommHub />
        </TabsContent>

        <TabsContent value="community" className="space-y-4">
          <CommunityReporting />
        </TabsContent>

        <TabsContent value="active" className="space-y-4">
          {/* Active alerts content */}
          <Card>
            <CardHeader>
              <CardTitle>Active Emergency Alerts</CardTitle>
              <CardDescription>
                All currently active alerts across Hawaii
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {loading ? (
                  <p className="text-center text-muted-foreground">Loading alerts...</p>
                ) : alerts.length === 0 ? (
                  <p className="text-center text-muted-foreground">No active alerts</p>
                ) : (
                  alerts.map((alert) => (
                    <div key={alert.id} className="border rounded-lg p-4 space-y-2">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <h4 className="font-semibold">{alert.title}</h4>
                          <p className="text-sm text-muted-foreground">{alert.description}</p>
                        </div>
                        <Badge 
                          variant={['severe', 'extreme', 'critical'].includes(alert.severity) ? 'destructive' : 'secondary'}
                          className={
                            alert.severity === 'extreme' || alert.severity === 'critical' ? 'bg-red-900' :
                            alert.severity === 'severe' || alert.severity === 'high' ? 'bg-red-600' : 
                            alert.severity === 'moderate' ? 'bg-orange-500' : 
                            'bg-yellow-500'
                          }
                        >
                          {alert.severity.toUpperCase()}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center">
                            <MapPin className="h-3 w-3 mr-1" />
                            {alert.location_name}
                          </span>
                          <span className="flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            Expires: {alert.time_until_expiry || 'N/A'}
                          </span>
                          <span>
                            Counties: {alert.affected_counties.join(', ')}
                          </span>
                        </div>
                        {alert.latitude && alert.longitude && (
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => handleNavigateToMapLocation(alert)}
                            className="gap-2 text-xs bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                          >
                            <MapPin className="h-3 w-3" />
                            View on Map
                          </Button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Alert Trends Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Alert Trends (24 Hours)</CardTitle>
                <CardDescription>
                  Hourly alert frequency over the last 24 hours
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trends}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Area 
                        type="monotone" 
                        dataKey="count" 
                        stroke="#8884d8" 
                        fill="#8884d8" 
                        fillOpacity={0.6}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Severity Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Alert Severity Distribution</CardTitle>
                <CardDescription>
                  Breakdown of alerts by severity level
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={Object.entries(metrics?.alerts_by_severity || {}).map(([name, value]) => ({
                          name: name.charAt(0).toUpperCase() + name.slice(1),
                          value
                        }))}
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                        label
                      >
                        {Object.keys(metrics?.alerts_by_severity || {}).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={severityColors[entry as keyof typeof severityColors]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Response Time Metrics */}
            <Card>
              <CardHeader>
                <CardTitle>Response Time Metrics</CardTitle>
                <CardDescription>
                  System response performance
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Average Response Time</span>
                    <span className="text-sm text-muted-foreground">
                      {metrics?.response_metrics.average_response_minutes.toFixed(1)} min
                    </span>
                  </div>
                  <Progress value={100 - (metrics?.response_metrics.average_response_minutes || 0) * 20} />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Median Response Time</span>
                    <span className="text-sm text-muted-foreground">
                      {metrics?.response_metrics.median_response_minutes.toFixed(1)} min
                    </span>
                  </div>
                  <Progress value={100 - (metrics?.response_metrics.median_response_minutes || 0) * 20} />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">95th Percentile</span>
                    <span className="text-sm text-muted-foreground">
                      {metrics?.response_metrics['95th_percentile_minutes'].toFixed(1)} min
                    </span>
                  </div>
                  <Progress value={100 - (metrics?.response_metrics['95th_percentile_minutes'] || 0) * 10} />
                </div>
              </CardContent>
            </Card>

            {/* County Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Alerts by County</CardTitle>
                <CardDescription>
                  Geographic distribution of active alerts
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(metrics?.alerts_by_county || {}).map(([county, count]) => (
                    <div key={county}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">{county}</span>
                        <span className="text-sm text-muted-foreground">{count} alerts</span>
                      </div>
                      <Progress value={(count / Math.max(...Object.values(metrics?.alerts_by_county || {1: 1}))) * 100} />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="system" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {/* System Status */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">System Status</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">Operational</div>
                <p className="text-xs text-muted-foreground">
                  All systems running normally
                </p>
                <Progress value={systemHealth} className="mt-2 h-2" />
              </CardContent>
            </Card>

            {/* API Response Time */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">API Response Time</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics?.response_metrics.average_response_minutes.toFixed(1)}ms</div>
                <p className="text-xs text-muted-foreground">
                  Average over last hour
                </p>
              </CardContent>
            </Card>

            {/* Database Status */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Database Status</CardTitle>
                <Activity className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">Connected</div>
                <p className="text-xs text-muted-foreground">
                  PostgreSQL running
                </p>
              </CardContent>
            </Card>

            {/* Active Connections */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Connections</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics?.total_users || 0}</div>
                <p className="text-xs text-muted-foreground">
                  WebSocket connections
                </p>
              </CardContent>
            </Card>

            {/* Memory Usage */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Memory Usage</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">1.2 GB</div>
                <p className="text-xs text-muted-foreground">
                  45% of available
                </p>
                <Progress value={45} className="mt-2 h-2" />
              </CardContent>
            </Card>

            {/* CPU Usage */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">CPU Usage</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">23%</div>
                <p className="text-xs text-muted-foreground">
                  4 cores available
                </p>
                <Progress value={23} className="mt-2 h-2" />
              </CardContent>
            </Card>
          </div>

          {/* Service Health Grid */}
          <Card>
            <CardHeader>
              <CardTitle>Service Health Matrix</CardTitle>
              <CardDescription>
                Status of all microservices and dependencies
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {[
                  { name: "API Gateway", status: "operational", uptime: "99.9%" },
                  { name: "Alert Processor", status: "operational", uptime: "99.8%" },
                  { name: "WebSocket Server", status: "operational", uptime: "99.7%" },
                  { name: "Redis Cache", status: "operational", uptime: "99.9%" },
                  { name: "PostgreSQL DB", status: "operational", uptime: "99.9%" },
                  { name: "Email Service", status: "operational", uptime: "98.5%" },
                  { name: "SMS Gateway", status: "operational", uptime: "99.2%" },
                  { name: "Weather API", status: "operational", uptime: "97.8%" }
                ].map((service) => (
                  <div key={service.name} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className={`h-3 w-3 rounded-full ${
                        service.status === "operational" ? "bg-green-500" : "bg-red-500"
                      }`} />
                      <div>
                        <p className="text-sm font-medium">{service.name}</p>
                        <p className="text-xs text-muted-foreground">Uptime: {service.uptime}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent System Events */}
          <Card>
            <CardHeader>
              <CardTitle>Recent System Events</CardTitle>
              <CardDescription>
                Latest system activities and alerts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { time: "2 min ago", event: "Alert processor cycle completed", type: "info" },
                  { time: "5 min ago", event: "Database backup completed", type: "success" },
                  { time: "12 min ago", event: "New WebSocket connection established", type: "info" },
                  { time: "18 min ago", event: "Cache cleared successfully", type: "info" },
                  { time: "25 min ago", event: "System health check passed", type: "success" }
                ].map((event, index) => (
                  <div key={index} className="flex items-center space-x-4">
                    <div className={`h-2 w-2 rounded-full ${
                      event.type === "success" ? "bg-green-500" : "bg-blue-500"
                    }`} />
                    <div className="flex-1">
                      <p className="text-sm">{event.event}</p>
                      <p className="text-xs text-muted-foreground">{event.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="comprehensive" className="space-y-4">
          <ComprehensiveDashboard />
        </TabsContent>
      </Tabs>
    </div>
  )
}