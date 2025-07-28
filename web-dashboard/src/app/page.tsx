"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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

// Sample data - replace with real API calls
const alertsData = [
  { hour: "00:00", count: 2 },
  { hour: "04:00", count: 1 },
  { hour: "08:00", count: 5 },
  { hour: "12:00", count: 8 },
  { hour: "16:00", count: 12 },
  { hour: "20:00", count: 6 },
]

const severityData = [
  { name: "Minor", value: 45, color: "hsl(47.9, 95.8%, 53.1%)" },
  { name: "Moderate", value: 30, color: "hsl(32.6, 94.6%, 43.7%)" },
  { name: "Severe", value: 20, color: "hsl(0, 84.2%, 60.2%)" },
  { name: "Extreme", value: 5, color: "hsl(0, 62.8%, 30.6%)" },
]

export default function DashboardPage() {
  const [activeAlerts, setActiveAlerts] = useState(23)
  const [responseTime, setResponseTime] = useState(1.2)
  const [systemHealth, setSystemHealth] = useState(98)
  const [connectedUsers, setConnectedUsers] = useState(15420)

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setConnectedUsers(prev => prev + Math.floor(Math.random() * 100 - 50))
      setSystemHealth(prev => Math.min(100, Math.max(90, prev + Math.random() * 2 - 1)))
    }, 5000)

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
      <Alert className="border-green-200 bg-green-50">
        <Radio className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-green-800">
          All systems operational. Last alert successfully delivered to {connectedUsers.toLocaleString()} users.
        </AlertDescription>
      </Alert>

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
                <div className="text-2xl font-bold">{activeAlerts}</div>
                <p className="text-xs text-muted-foreground">
                  <span className="text-red-500">+5</span> from last hour
                </p>
                <Progress value={75} className="mt-2 h-2" />
              </CardContent>
              <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-red-500 to-orange-500" />
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{responseTime}m</div>
                <p className="text-xs text-muted-foreground">
                  <span className="text-green-500">-0.3m</span> vs last week
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
                <div className="text-2xl font-bold">{connectedUsers.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  Real-time WebSocket connections
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
                  <AreaChart data={alertsData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="hour" />
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
                <ResponsiveContainer width="100%" height={350}>
                  <PieChart>
                    <Pie
                      data={severityData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {severityData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-4 space-y-2">
                  {severityData.map((item) => (
                    <div key={item.name} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div 
                          className="h-3 w-3 rounded-full mr-2" 
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="text-sm">{item.name}</span>
                      </div>
                      <span className="text-sm font-medium">{item.value}%</span>
                    </div>
                  ))}
                </div>
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
                {[
                  { 
                    id: 1, 
                    title: "Flash Flood Warning", 
                    severity: "severe", 
                    location: "Honolulu County", 
                    time: "2 minutes ago",
                    recipients: 45230 
                  },
                  { 
                    id: 2, 
                    title: "High Wind Advisory", 
                    severity: "moderate", 
                    location: "Maui County", 
                    time: "15 minutes ago",
                    recipients: 23150 
                  },
                  { 
                    id: 3, 
                    title: "Earthquake Alert", 
                    severity: "minor", 
                    location: "Hawaii County", 
                    time: "1 hour ago",
                    recipients: 12450 
                  },
                ].map((alert) => (
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
                          {alert.location} • {alert.time}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{alert.recipients.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">recipients</p>
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
              {/* Add alert management table here */}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          {/* Analytics content */}
          <Card>
            <CardHeader>
              <CardTitle>Performance Analytics</CardTitle>
              <CardDescription>
                Detailed metrics and insights
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Add detailed analytics here */}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system" className="space-y-4">
          {/* System health content */}
          <Card>
            <CardHeader>
              <CardTitle>System Health Monitor</CardTitle>
              <CardDescription>
                Real-time system performance and status
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Add system monitoring here */}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}