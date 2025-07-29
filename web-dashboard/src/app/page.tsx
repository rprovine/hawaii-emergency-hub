"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { api, DashboardMetrics, Alert as AlertType, AlertTrend } from "@/lib/api"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
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
  Radio
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
  extreme: "hsl(0, 62.8%, 30.6%)"
}

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [alerts, setAlerts] = useState<AlertType[]>([])
  const [trends, setTrends] = useState<AlertTrend[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [systemHealth, setSystemHealth] = useState(98)

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

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Emergency Operations Dashboard</h2>
        <div className="flex items-center space-x-2">
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

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="active">Active Alerts</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="system">System Health</TabsTrigger>
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
                        variant={alert.severity === 'severe' ? 'destructive' : 'secondary'}
                        className={
                          alert.severity === 'severe' ? 'bg-emergency-severe' : 
                          alert.severity === 'moderate' ? 'bg-emergency-moderate' : 
                          'bg-emergency-minor'
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
                          variant={alert.severity === 'severe' || alert.severity === 'extreme' ? 'destructive' : 'secondary'}
                          className={
                            alert.severity === 'extreme' ? 'bg-red-900' :
                            alert.severity === 'severe' ? 'bg-red-600' : 
                            alert.severity === 'moderate' ? 'bg-orange-500' : 
                            'bg-yellow-500'
                          }
                        >
                          {alert.severity.toUpperCase()}
                        </Badge>
                      </div>
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
      </Tabs>
    </div>
  )
}