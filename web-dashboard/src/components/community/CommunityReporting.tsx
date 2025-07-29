"use client"

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { 
  MessageSquare,
  Camera,
  FileText,
  MapPin,
  AlertTriangle,
  CheckCircle,
  Clock,
  Eye,
  ThumbsUp,
  MessageCircle,
  Filter,
  Search,
  Plus,
  Upload,
  Flag,
  Users,
  TrendingUp,
  BarChart3,
  Activity,
  Star,
  Shield,
  Zap,
  Phone,
  Navigation
} from 'lucide-react'

interface CommunityReport {
  id: string
  title: string
  description: string
  category: 'incident' | 'hazard' | 'infrastructure' | 'weather' | 'traffic' | 'other'
  severity: 'low' | 'medium' | 'high' | 'critical'
  status: 'submitted' | 'reviewing' | 'verified' | 'false_report' | 'resolved'
  location: {
    lat: number
    lng: number
    address: string
    area: string
  }
  submittedBy: {
    id: string
    name: string
    trustScore: number
    reportCount: number
  }
  submittedAt: Date
  images?: string[]
  attachments?: string[]
  upvotes: number
  comments: number
  assignedTo?: string
  estimatedResolution?: Date
  verifiedBy?: string
  tags: string[]
}

interface TrustScore {
  userId: string
  userName: string
  score: number
  reportCount: number
  verificationRate: number
  responseTime: string
  badges: string[]
}

interface CommunityReportingProps {
  onReportSubmitted?: (report: CommunityReport) => void
  onEmergencyEscalation?: (report: CommunityReport) => void
}

// Sample community reports
const SAMPLE_REPORTS: CommunityReport[] = [
  {
    id: 'report-001',
    title: 'Fallen tree blocking Pali Highway',
    description: 'Large banyan tree has fallen across both lanes of Pali Highway near the Nuuanu Pali Lookout. Traffic is completely stopped.',
    category: 'infrastructure',
    severity: 'high',
    status: 'reviewing',
    location: {
      lat: 21.3647,
      lng: -157.7900,
      address: 'Pali Highway, Honolulu, HI',
      area: 'Nuuanu'
    },
    submittedBy: {
      id: 'user-123',
      name: 'Maria Santos',
      trustScore: 92,
      reportCount: 15
    },
    submittedAt: new Date(Date.now() - 15 * 60 * 1000), // 15 minutes ago
    images: ['pali-tree-1.jpg', 'pali-tree-2.jpg'],
    upvotes: 8,
    comments: 3,
    assignedTo: 'Highways Division',
    estimatedResolution: new Date(Date.now() + 2 * 60 * 60 * 1000),
    tags: ['traffic', 'road_closure', 'urgent']
  },
  {
    id: 'report-002',
    title: 'Flash flooding in Kalihi area',
    description: 'Heavy rainfall has caused flash flooding on Kalihi Street near the school. Water is approximately 2 feet deep.',
    category: 'weather',
    severity: 'critical',
    status: 'verified',
    location: {
      lat: 21.3320,
      lng: -157.9110,
      address: 'Kalihi Street, Honolulu, HI',
      area: 'Kalihi'
    },
    submittedBy: {
      id: 'user-456',
      name: 'David Kim',
      trustScore: 87,
      reportCount: 22
    },
    submittedAt: new Date(Date.now() - 45 * 60 * 1000), // 45 minutes ago
    images: ['kalihi-flood-1.jpg'],
    upvotes: 15,
    comments: 7,
    verifiedBy: 'Emergency Management',
    tags: ['flood', 'weather', 'school_zone']
  },
  {
    id: 'report-003',
    title: 'Suspicious package at bus stop',
    description: 'Unattended backpack at TheBus stop on King Street. Has been there for over an hour.',
    category: 'incident',
    severity: 'medium',
    status: 'resolved',
    location: {
      lat: 21.3045,
      lng: -157.8556,
      address: 'King Street Bus Stop, Honolulu, HI',
      area: 'Downtown'
    },
    submittedBy: {
      id: 'user-789',
      name: 'Jennifer Wong',
      trustScore: 78,
      reportCount: 8
    },
    submittedAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    upvotes: 4,
    comments: 2,
    assignedTo: 'HPD Bomb Squad',
    tags: ['security', 'public_transport']
  },
  {
    id: 'report-004',
    title: 'Power outage affecting entire neighborhood',
    description: 'Power has been out in the Manoa area for the past 3 hours. Affects approximately 200 homes.',
    category: 'infrastructure',
    severity: 'medium',
    status: 'reviewing',
    location: {
      lat: 21.3156,
      lng: -158.0000,
      address: 'Manoa Valley, Honolulu, HI',
      area: 'Manoa'
    },
    submittedBy: {
      id: 'user-012',
      name: 'Robert Chen',
      trustScore: 95,
      reportCount: 31
    },
    submittedAt: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 hours ago
    upvotes: 12,
    comments: 5,
    assignedTo: 'Hawaiian Electric',
    estimatedResolution: new Date(Date.now() + 4 * 60 * 60 * 1000),
    tags: ['power', 'utilities', 'residential']
  }
]

// Sample top contributors
const SAMPLE_CONTRIBUTORS: TrustScore[] = [
  {
    userId: 'user-012',
    userName: 'Robert Chen',
    score: 95,
    reportCount: 31,
    verificationRate: 87,
    responseTime: '< 15 min',
    badges: ['Gold Contributor', 'Quick Response', 'Verification Expert']
  },
  {
    userId: 'user-123',
    userName: 'Maria Santos',
    score: 92,
    reportCount: 15,
    verificationRate: 93,
    responseTime: '< 20 min',
    badges: ['Silver Contributor', 'Photo Pro']
  },
  {
    userId: 'user-456',
    userName: 'David Kim',
    score: 87,
    reportCount: 22,
    verificationRate: 82,
    responseTime: '< 30 min',
    badges: ['Bronze Contributor', 'Weather Spotter']
  }
]

export function CommunityReporting({
  onReportSubmitted,
  onEmergencyEscalation
}: CommunityReportingProps) {
  const [reports, setReports] = useState<CommunityReport[]>(SAMPLE_REPORTS)
  const [contributors, setContributors] = useState<TrustScore[]>(SAMPLE_CONTRIBUTORS)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')  
  const [searchTerm, setSearchTerm] = useState('')
  const [showSubmissionForm, setShowSubmissionForm] = useState(false)

  // Filter reports based on selected filters
  const filteredReports = reports.filter(report => {
    const matchesCategory = selectedCategory === 'all' || report.category === selectedCategory
    const matchesStatus = selectedStatus === 'all' || report.status === selectedStatus
    const matchesSearch = report.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         report.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         report.location.area.toLowerCase().includes(searchTerm.toLowerCase())
    
    return matchesCategory && matchesStatus && matchesSearch
  })

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'incident': return 'bg-red-100 text-red-800 border-red-300'
      case 'hazard': return 'bg-orange-100 text-orange-800 border-orange-300'
      case 'infrastructure': return 'bg-blue-100 text-blue-800 border-blue-300'
      case 'weather': return 'bg-green-100 text-green-800 border-green-300'
      case 'traffic': return 'bg-purple-100 text-purple-800 border-purple-300'
      default: return 'bg-gray-100 text-gray-800 border-gray-300'
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-600 text-white'
      case 'high': return 'bg-orange-500 text-white'
      case 'medium': return 'bg-yellow-500 text-black'  
      case 'low': return 'bg-green-500 text-white'
      default: return 'bg-gray-400 text-white'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'submitted': return 'bg-blue-100 text-blue-800'
      case 'reviewing': return 'bg-yellow-100 text-yellow-800'
      case 'verified': return 'bg-green-100 text-green-800'
      case 'resolved': return 'bg-gray-100 text-gray-800'
      case 'false_report': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'submitted': return <Clock className="h-3 w-3" />
      case 'reviewing': return <Eye className="h-3 w-3" />
      case 'verified': return <CheckCircle className="h-3 w-3" />
      case 'resolved': return <CheckCircle className="h-3 w-3" />
      case 'false_report': return <Flag className="h-3 w-3" />
      default: return <Clock className="h-3 w-3" />
    }
  }

  const upvoteReport = (reportId: string) => {
    setReports(prev => prev.map(report => 
      report.id === reportId 
        ? { ...report, upvotes: report.upvotes + 1 }
        : report
    ))
  }

  const escalateToEmergency = (report: CommunityReport) => {
    onEmergencyEscalation?.(report)
    
    // Update report status to indicate emergency escalation
    setReports(prev => prev.map(r => 
      r.id === report.id 
        ? { ...r, status: 'verified', tags: [...r.tags, 'emergency_escalated'] }
        : r
    ))
  }

  const categoryStats = {
    total: reports.length,
    submitted: reports.filter(r => r.status === 'submitted').length,
    reviewing: reports.filter(r => r.status === 'reviewing').length,
    verified: reports.filter(r => r.status === 'verified').length,
    resolved: reports.filter(r => r.status === 'resolved').length
  }

  return (
    <div className="space-y-4">
      {/* Header Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="text-center p-3 bg-blue-50 rounded-lg border border-blue-200">
          <div className="text-2xl font-bold text-blue-600">{categoryStats.total}</div>
          <div className="text-sm text-blue-700">Total Reports</div>
        </div>
        <div className="text-center p-3 bg-yellow-50 rounded-lg border border-yellow-200">
          <div className="text-2xl font-bold text-yellow-600">{categoryStats.submitted}</div>
          <div className="text-sm text-yellow-700">Submitted</div>
        </div>
        <div className="text-center p-3 bg-orange-50 rounded-lg border border-orange-200">
          <div className="text-2xl font-bold text-orange-600">{categoryStats.reviewing}</div>
          <div className="text-sm text-orange-700">Reviewing</div>
        </div>
        <div className="text-center p-3 bg-green-50 rounded-lg border border-green-200">
          <div className="text-2xl font-bold text-green-600">{categoryStats.verified}</div>
          <div className="text-sm text-green-700">Verified</div>
        </div>
        <div className="text-center p-3 bg-gray-50 rounded-lg border border-gray-200">
          <div className="text-2xl font-bold text-gray-600">{categoryStats.resolved}</div>
          <div className="text-sm text-gray-700">Resolved</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Main Reports Feed */}
        <div className="lg:col-span-2 space-y-4">
          {/* Filters and Search */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    Community Reports
                  </CardTitle>
                  <CardDescription>
                    Citizen-submitted incident reports and community feedback
                  </CardDescription>
                </div>
                <Button onClick={() => setShowSubmissionForm(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Submit Report
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search reports, locations, descriptions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border-2 border-gray-400 rounded-md bg-white text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
                  />
                </div>

                {/* Filters */}
                <div className="flex flex-wrap gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Category</label>
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="px-3 py-2 border-2 border-gray-400 rounded-md bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
                    >
                      <option value="all">All Categories</option>
                      <option value="incident">Incident</option>
                      <option value="hazard">Hazard</option>
                      <option value="infrastructure">Infrastructure</option>
                      <option value="weather">Weather</option>
                      <option value="traffic">Traffic</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Status</label>
                    <select
                      value={selectedStatus}
                      onChange={(e) => setSelectedStatus(e.target.value)}
                      className="px-3 py-2 border-2 border-gray-400 rounded-md bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
                    >
                      <option value="all">All Status</option>
                      <option value="submitted">Submitted</option>
                      <option value="reviewing">Reviewing</option>
                      <option value="verified">Verified</option>
                      <option value="resolved">Resolved</option>
                    </select>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Reports List */}
          <div className="space-y-4">
            {filteredReports.map((report) => (
              <Card key={report.id}>
                <CardContent className="p-4">
                  <div className="space-y-3">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <h4 className="font-semibold">{report.title}</h4>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          {report.location.area} • {report.submittedAt.toLocaleString()}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <Badge className={getSeverityColor(report.severity)}>
                          {report.severity.toUpperCase()}
                        </Badge>
                        <Badge className={getStatusColor(report.status)}>
                          {getStatusIcon(report.status)}
                          <span className="ml-1">{report.status.replace('_', ' ').toUpperCase()}</span>
                        </Badge>
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-sm text-muted-foreground">{report.description}</p>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1">
                      <Badge className={getCategoryColor(report.category)} variant="outline">
                        {report.category}
                      </Badge>
                      {report.tags.map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag.replace('_', ' ')}
                        </Badge>
                      ))}
                    </div>

                    {/* Meta Information */}
                    <div className="flex items-center justify-between pt-2 border-t">
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {report.submittedBy.name}
                          <span className="text-xs">({report.submittedBy.trustScore}% trust)</span>
                        </div>
                        {report.images && (
                          <div className="flex items-center gap-1">
                            <Camera className="h-3 w-3" />
                            {report.images.length} photos
                          </div>
                        )}
                        {report.assignedTo && (
                          <div className="flex items-center gap-1">
                            <Shield className="h-3 w-3" />
                            {report.assignedTo}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => upvoteReport(report.id)}
                          className="gap-1"
                        >
                          <ThumbsUp className="h-3 w-3" />
                          {report.upvotes}
                        </Button>
                        <Button variant="outline" size="sm" className="gap-1">
                          <MessageCircle className="h-3 w-3" />
                          {report.comments}
                        </Button>
                        {report.severity === 'critical' && report.status !== 'resolved' && (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => escalateToEmergency(report)}
                          >
                            <Zap className="h-3 w-3 mr-1" />
                            Escalate
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Resolution Info */}
                    {report.estimatedResolution && (
                      <Alert className="border-blue-200 bg-blue-50">
                        <Clock className="h-4 w-4 text-blue-600" />
                        <AlertDescription className="text-blue-800">
                          Estimated resolution: {report.estimatedResolution.toLocaleString()}
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}

            {filteredReports.length === 0 && (
              <Card>
                <CardContent className="p-8 text-center">
                  <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">No Reports Found</h3>
                  <p className="text-muted-foreground">
                    No community reports match your current filters.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Top Contributors */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5" />
                Top Contributors
              </CardTitle>
              <CardDescription>
                Most trusted community reporters
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {contributors.map((contributor, index) => (
                  <div key={contributor.userId} className="flex items-center gap-3 p-2 border rounded">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                      <span className="text-sm font-bold text-blue-600">#{index + 1}</span>
                    </div>
                    
                    <div className="flex-1">
                      <div className="font-medium text-sm">{contributor.userName}</div>
                      <div className="text-xs text-muted-foreground">
                        {contributor.reportCount} reports • {contributor.verificationRate}% verified
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-sm font-bold text-green-600">{contributor.score}%</div>
                      <div className="text-xs text-muted-foreground">{contributor.responseTime}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Button variant="outline" className="w-full justify-start">
                  <Camera className="h-4 w-4 mr-2" />
                  Report with Photo
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Navigation className="h-4 w-4 mr-2" />
                  Location-based Report
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Phone className="h-4 w-4 mr-2" />
                  Emergency Hotline
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Report Analytics
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Report Categories */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Report Categories
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {[
                  { category: 'incident', count: reports.filter(r => r.category === 'incident').length, color: 'text-red-600' },
                  { category: 'infrastructure', count: reports.filter(r => r.category === 'infrastructure').length, color: 'text-blue-600' },
                  { category: 'weather', count: reports.filter(r => r.category === 'weather').length, color: 'text-green-600' },
                  { category: 'traffic', count: reports.filter(r => r.category === 'traffic').length, color: 'text-purple-600' },
                  { category: 'hazard', count: reports.filter(r => r.category === 'hazard').length, color: 'text-orange-600' },
                  { category: 'other', count: reports.filter(r => r.category === 'other').length, color: 'text-gray-600' }
                ].map(({ category, count, color }) => (
                  <div key={category} className="flex items-center justify-between">
                    <span className="text-sm capitalize">{category}</span>
                    <Badge variant="outline" className={color}>
                      {count}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Submission Form Modal */}
      {showSubmissionForm && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <Card className="w-full max-w-lg">
            <CardHeader>
              <CardTitle>Submit Community Report</CardTitle>
              <CardDescription>
                Report incidents, hazards, or issues in your community
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Report Title</label>
                <input
                  type="text"
                  placeholder="Brief description of the issue"
                  className="w-full p-2 border-2 border-gray-400 rounded-md bg-white text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Category</label>
                <select className="w-full p-2 border-2 border-gray-400 rounded-md bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none">
                  <option value="">Select category</option>
                  <option value="incident">Incident</option>
                  <option value="hazard">Hazard</option>
                  <option value="infrastructure">Infrastructure</option>
                  <option value="weather">Weather</option>
                  <option value="traffic">Traffic</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <textarea
                  rows={4}
                  placeholder="Detailed description of the issue..."
                  className="w-full p-2 border-2 border-gray-400 rounded-md bg-white text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Location</label>
                <input
                  type="text"
                  placeholder="Address or location description"
                  className="w-full p-2 border-2 border-gray-400 rounded-md bg-white text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="flex gap-2">
                <Button className="flex-1">
                  <Upload className="h-4 w-4 mr-2" />
                  Submit Report
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowSubmissionForm(false)}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}