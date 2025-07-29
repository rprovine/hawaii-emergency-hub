"use client"

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Users, 
  Shield, 
  CheckCircle, 
  AlertTriangle, 
  Clock, 
  MapPin, 
  Phone, 
  MessageCircle,
  Plus,
  UserPlus,
  Heart,
  HelpCircle,
  RefreshCw,
  Bell,
  Settings
} from 'lucide-react'

interface FamilyMember {
  id: string
  name: string
  email: string
  phone?: string
  role: 'owner' | 'admin' | 'member'
  status: 'safe' | 'needs_help' | 'no_response' | 'unknown'
  lastCheckIn?: string
  location?: {
    lat: number
    lng: number
    address?: string
  }
  isEmergencyContact: boolean
  profileImage?: string
}

interface CheckInRequest {
  id: string
  alertId?: string
  alertTitle?: string
  sentAt: string
  responses: number
  totalMembers: number
  urgency: 'low' | 'medium' | 'high' | 'critical'
}

interface FamilySafetyWidgetProps {
  familyGroupId?: string
  currentAlertId?: string
}

// Sample family data - in real app this would come from API
const SAMPLE_FAMILY: FamilyMember[] = [
  {
    id: '1',
    name: 'John Provine',
    email: 'john@example.com',
    phone: '(808) 555-0123',
    role: 'owner',
    status: 'safe',
    lastCheckIn: '2 minutes ago',
    location: {
      lat: 21.4667,
      lng: -157.8167,
      address: 'Honolulu, HI'
    },
    isEmergencyContact: true
  },
  {
    id: '2', 
    name: 'Sarah Provine',
    email: 'sarah@example.com',
    phone: '(808) 555-0124',
    role: 'admin',
    status: 'safe',
    lastCheckIn: '5 minutes ago',
    location: {
      lat: 21.4667,
      lng: -157.8167,
      address: 'Honolulu, HI'
    },
    isEmergencyContact: true
  },
  {
    id: '3',
    name: 'Emma Provine',
    email: 'emma@example.com',
    role: 'member',
    status: 'no_response',
    lastCheckIn: '2 hours ago',
    isEmergencyContact: false
  },
  {
    id: '4',
    name: 'Michael Provine', 
    email: 'michael@example.com',
    phone: '(808) 555-0126',
    role: 'member',
    status: 'needs_help',
    lastCheckIn: '15 minutes ago',
    location: {
      lat: 21.3099,
      lng: -157.8478,
      address: 'Downtown Honolulu, HI'
    },
    isEmergencyContact: false
  }
]

const SAMPLE_CHECK_IN_REQUESTS: CheckInRequest[] = [
  {
    id: 'req-1',
    alertId: 'alert-tsunami-001',
    alertTitle: 'Tsunami Warning - North Shore',
    sentAt: '3 minutes ago',
    responses: 2,
    totalMembers: 4,
    urgency: 'critical'
  },
  {
    id: 'req-2',
    sentAt: '1 hour ago',
    responses: 4,
    totalMembers: 4,
    urgency: 'medium'
  }
]

export function FamilySafetyWidget({ 
  familyGroupId = 'family-1',
  currentAlertId 
}: FamilySafetyWidgetProps) {
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>(SAMPLE_FAMILY)
  const [checkInRequests, setCheckInRequests] = useState<CheckInRequest[]>(SAMPLE_CHECK_IN_REQUESTS)
  const [myStatus, setMyStatus] = useState<'safe' | 'needs_help' | 'unknown'>('safe')
  const [loading, setLoading] = useState(false)
  const [showAddMember, setShowAddMember] = useState(false)
  const [newMemberEmail, setNewMemberEmail] = useState('')
  const [newMemberName, setNewMemberName] = useState('')

  const handleStatusUpdate = async (status: 'safe' | 'needs_help') => {
    setLoading(true)
    
    try {
      // In real app, this would make API call
      setMyStatus(status)
      
      // Update current user in family list
      setFamilyMembers(prev => prev.map(member => 
        member.id === '1' ? {
          ...member,
          status,
          lastCheckIn: 'just now'
        } : member
      ))
      
      // Show success feedback
      setTimeout(() => setLoading(false), 1000)
      
    } catch (error) {
      console.error('Failed to update status:', error)
      setLoading(false)
    }
  }

  const sendCheckInRequest = async (urgency: 'low' | 'medium' | 'high' | 'critical' = 'medium') => {
    try {
      const newRequest: CheckInRequest = {
        id: `req-${Date.now()}`,
        alertId: currentAlertId,
        sentAt: 'just now',
        responses: 1, // Current user auto-responds
        totalMembers: familyMembers.length,
        urgency
      }
      
      setCheckInRequests(prev => [newRequest, ...prev])
      
      // In real app, this would send push notifications to all family members
      
    } catch (error) {
      console.error('Failed to send check-in request:', error)
    }
  }

  const addFamilyMember = async () => {
    if (!newMemberEmail || !newMemberName) return
    
    try {
      const newMember: FamilyMember = {
        id: `member-${Date.now()}`,
        name: newMemberName,
        email: newMemberEmail,
        role: 'member',
        status: 'unknown',
        isEmergencyContact: false
      }
      
      setFamilyMembers(prev => [...prev, newMember])
      setNewMemberEmail('')
      setNewMemberName('')
      setShowAddMember(false)
      
      // In real app, this would send invitation email
      
    } catch (error) {
      console.error('Failed to add family member:', error)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'safe': return 'text-green-600 bg-green-50 border-green-200'
      case 'needs_help': return 'text-red-600 bg-red-50 border-red-200'
      case 'no_response': return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 'unknown': return 'text-gray-600 bg-gray-50 border-gray-200'
      default: return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'safe': return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'needs_help': return <AlertTriangle className="h-4 w-4 text-red-600" />
      case 'no_response': return <Clock className="h-4 w-4 text-yellow-600" />
      case 'unknown': return <HelpCircle className="h-4 w-4 text-gray-400" />
      default: return <HelpCircle className="h-4 w-4 text-gray-400" />
    }
  }

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'critical': return 'bg-red-600'
      case 'high': return 'bg-orange-500'
      case 'medium': return 'bg-yellow-500'
      case 'low': return 'bg-blue-500'
      default: return 'bg-gray-500'
    }
  }

  const safeCount = familyMembers.filter(m => m.status === 'safe').length
  const needsHelpCount = familyMembers.filter(m => m.status === 'needs_help').length
  const noResponseCount = familyMembers.filter(m => m.status === 'no_response').length

  return (
    <div className="space-y-4">
      {/* Quick Status Update */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-red-500" />
            My Safety Status
          </CardTitle>
          <CardDescription>
            Let your family know you're safe during emergencies
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <Button
              onClick={() => handleStatusUpdate('safe')}
              disabled={loading}
              className={`flex-1 gap-2 ${myStatus === 'safe' ? 'bg-green-600 hover:bg-green-700' : 'bg-green-500 hover:bg-green-600'}`}
            >
              {loading ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle className="h-4 w-4" />
              )}
              I'm Safe
            </Button>
            <Button
              onClick={() => handleStatusUpdate('needs_help')}
              disabled={loading}
              variant="destructive"
              className="flex-1 gap-2"
            >
              {loading ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <AlertTriangle className="h-4 w-4" />
              )}
              Need Help
            </Button>
          </div>
          
          {myStatus === 'safe' && (
            <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2 text-green-800 text-sm">
                <CheckCircle className="h-4 w-4" />
                Your family has been notified that you're safe
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Family Status Overview */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Family Safety Status
              </CardTitle>
              <CardDescription>
                {familyMembers.length} family members • Last updated just now
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => sendCheckInRequest('medium')}
              >
                <Bell className="h-4 w-4 mr-2" />
                Check In
              </Button>
              <Button
                variant="outline" 
                size="sm"
                onClick={() => setShowAddMember(true)}
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Add Member
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Status Summary */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-center p-3 bg-green-50 rounded-lg border border-green-200">
              <div className="text-2xl font-bold text-green-600">{safeCount}</div>
              <div className="text-sm text-green-700">Safe</div>
            </div>
            <div className="text-center p-3 bg-red-50 rounded-lg border border-red-200">
              <div className="text-2xl font-bold text-red-600">{needsHelpCount}</div>
              <div className="text-sm text-red-700">Need Help</div>
            </div>
            <div className="text-center p-3 bg-yellow-50 rounded-lg border border-yellow-200">
              <div className="text-2xl font-bold text-yellow-600">{noResponseCount}</div>
              <div className="text-sm text-yellow-700">No Response</div>
            </div>
          </div>

          {/* Family Members List */}
          <div className="space-y-3">
            {familyMembers.map((member) => (
              <div key={member.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                    <Users className="h-5 w-5 text-gray-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{member.name}</span>
                      {member.role === 'owner' && (
                        <Badge variant="secondary" className="text-xs">Owner</Badge>
                      )}
                      {member.isEmergencyContact && (
                        <Shield className="h-3 w-3 text-blue-500" />
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      {member.lastCheckIn && (
                        <>
                          <Clock className="h-3 w-3" />
                          {member.lastCheckIn}
                        </>
                      )}
                      {member.location && (
                        <>
                          <MapPin className="h-3 w-3" />
                          {member.location.address}
                        </>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Badge className={`gap-1 ${getStatusColor(member.status)}`}>
                    {getStatusIcon(member.status)}
                    {member.status.replace('_', ' ')}
                  </Badge>
                  {member.phone && (
                    <Button variant="outline" size="sm">
                      <Phone className="h-3 w-3" />
                    </Button>
                  )}
                  <Button variant="outline" size="sm">
                    <MessageCircle className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Check-In Requests */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Recent Check-In Requests
          </CardTitle>
          <CardDescription>
            Family safety check-ins and emergency responses
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {checkInRequests.map((request) => (
              <div key={request.id} className="border rounded-lg p-3">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${getUrgencyColor(request.urgency)}`} />
                      <span className="font-medium">
                        {request.alertTitle || 'Family Check-In Request'}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                      <Clock className="h-3 w-3" />
                      {request.sentAt}
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {request.responses}/{request.totalMembers} responded
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    Response rate: {Math.round((request.responses / request.totalMembers) * 100)}%
                  </div>
                  <Button variant="outline" size="sm">
                    View Details
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Add Family Member Modal */}
      {showAddMember && (
        <Card className="border-2 border-blue-200 bg-blue-50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Add Family Member
            </CardTitle>
            <CardDescription>
              Invite someone to join your family safety group
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Name</label>
              <input
                type="text"
                placeholder="Enter their full name"
                value={newMemberName}
                onChange={(e) => setNewMemberName(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <input
                type="email"
                placeholder="Enter their email address"
                value={newMemberEmail}
                onChange={(e) => setNewMemberEmail(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={addFamilyMember}
                disabled={!newMemberEmail || !newMemberName}
                className="flex-1"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Send Invitation
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowAddMember(false)}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Emergency Alert */}
      {needsHelpCount > 0 && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <strong>{needsHelpCount} family member{needsHelpCount > 1 ? 's' : ''} need{needsHelpCount === 1 ? 's' : ''} help!</strong>
            <div className="mt-2">
              <Button size="sm" className="bg-red-600 hover:bg-red-700">
                <Phone className="h-3 w-3 mr-2" />
                Call Emergency Services
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}