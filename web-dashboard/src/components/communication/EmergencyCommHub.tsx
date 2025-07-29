"use client"

import { useEffect, useState, useRef, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { 
  Radio,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Users,
  PhoneCall,
  MessageSquare,
  Settings,
  Headphones,
  Signal,
  AlertTriangle,
  Wifi,
  WifiOff,
  Zap,
  CheckCircle,
  Clock,
  UserCheck,
  Megaphone,
  Shield,
  Activity
} from 'lucide-react'

interface CommChannel {
  id: string
  name: string
  description: string
  frequency: string
  type: 'emergency' | 'coordination' | 'public' | 'interagency'
  priority: 'critical' | 'high' | 'medium' | 'low'
  participants: number
  maxParticipants: number
  isActive: boolean
  hasActiveTransmission: boolean
  currentSpeaker?: string
  signalStrength: number
  encryption: boolean
}

interface ActiveUser {
  id: string
  name: string
  role: string
  agency: string
  status: 'online' | 'busy' | 'away' | 'offline'
  channel?: string
  isSpeaking: boolean
  isMuted: boolean
  signalStrength: number
}

interface VoiceMessage {
  id: string
  timestamp: Date
  channel: string
  speaker: string
  duration: number
  priority: 'routine' | 'urgent' | 'emergency'
  transcription?: string
  isPlaying: boolean
}

interface EmergencyCommHubProps {
  currentUser?: {
    id: string
    name: string
    role: string
    agency: string
  }
  onEmergencyBroadcast?: (message: string) => void
}

// Sample communication channels
const SAMPLE_CHANNELS: CommChannel[] = [
  {
    id: 'emergency-primary',
    name: 'Emergency Primary',
    description: 'Primary emergency coordination channel',
    frequency: '462.125 MHz',
    type: 'emergency',
    priority: 'critical',
    participants: 12,
    maxParticipants: 50,
    isActive: true,
    hasActiveTransmission: true,
    currentSpeaker: 'Chief Williams - HPD',
    signalStrength: 95,
    encryption: true
  },
  {
    id: 'fire-ops',
    name: 'Fire Operations',
    description: 'Honolulu Fire Department operations',
    frequency: '453.850 MHz',
    type: 'coordination',
    priority: 'high',
    participants: 8,
    maxParticipants: 25,
    isActive: true,
    hasActiveTransmission: false,
    signalStrength: 87,
    encryption: true
  },
  {
    id: 'medical-dispatch',
    name: 'Medical Dispatch',
    description: 'EMS and medical coordination',
    frequency: '462.975 MHz',
    type: 'coordination',
    priority: 'high',
    participants: 15,
    maxParticipants: 30,
    isActive: true,
    hasActiveTransmission: false,
    signalStrength: 92,
    encryption: true
  },
  {
    id: 'public-info',
    name: 'Public Information',
    description: 'Public announcements and information',
    frequency: '462.550 MHz',
    type: 'public',
    priority: 'medium',
    participants: 45,
    maxParticipants: 100,
    isActive: true,
    hasActiveTransmission: false,
    signalStrength: 89,
    encryption: false
  },
  {
    id: 'interagency',
    name: 'Interagency Coordination',
    description: 'Multi-agency coordination channel',
    frequency: '458.175 MHz',
    type: 'interagency',
    priority: 'high',
    participants: 6,
    maxParticipants: 20,
    isActive: false,
    hasActiveTransmission: false,
    signalStrength: 78,
    encryption: true
  }
]

// Sample active users
const SAMPLE_USERS: ActiveUser[] = [
  {
    id: 'user-001',
    name: 'Chief Williams',
    role: 'Incident Commander',
    agency: 'HPD',
    status: 'online',
    channel: 'emergency-primary',
    isSpeaking: true,
    isMuted: false,
    signalStrength: 95
  },
  {
    id: 'user-002',
    name: 'Captain Rodriguez',
    role: 'Fire Chief',
    agency: 'HFD',
    status: 'online',
    channel: 'fire-ops',
    isSpeaking: false,
    isMuted: false,
    signalStrength: 87
  },
  {
    id: 'user-003',
    name: 'Dr. Kim',
    role: 'EMS Director',
    agency: 'EMS',
    status: 'busy',
    channel: 'medical-dispatch',
    isSpeaking: false,
    isMuted: false,
    signalStrength: 92
  },
  {
    id: 'user-004',
    name: 'Director Thompson',
    role: 'Emergency Manager',
    agency: 'HIEMA',
    status: 'online',
    channel: 'emergency-primary',
    isSpeaking: false,
    isMuted: true,
    signalStrength: 88
  }
]

export function EmergencyCommHub({
  currentUser = {
    id: 'current-user',
    name: 'Operator Jones',
    role: 'Emergency Operator',
    agency: 'EOC'
  },
  onEmergencyBroadcast
}: EmergencyCommHubProps) {
  const [channels, setChannels] = useState<CommChannel[]>(SAMPLE_CHANNELS)
  const [activeUsers, setActiveUsers] = useState<ActiveUser[]>(SAMPLE_USERS)
  const [currentChannel, setCurrentChannel] = useState<string>('emergency-primary')
  const [isPTTActive, setIsPTTActive] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [volume, setVolume] = useState(75)
  const [isRecording, setIsRecording] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'connecting' | 'disconnected'>('connected')
  const [voiceMessages, setVoiceMessages] = useState<VoiceMessage[]>([])
  const [emergencyBroadcastMode, setEmergencyBroadcastMode] = useState(false)

  const audioContextRef = useRef<AudioContext | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const pttKeyRef = useRef<string>(' ') // Spacebar for PTT

  // Initialize audio context
  useEffect(() => {
    if ('AudioContext' in window || 'webkitAudioContext' in window) {
      // @ts-ignore
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)()
    }
  }, [])

  // PTT Keyboard handling
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code === 'Space' && !isPTTActive) {
        event.preventDefault()
        startPTT()
      }
    }

    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.code === 'Space' && isPTTActive) {
        event.preventDefault()
        stopPTT()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('keyup', handleKeyUp)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('keyup', handleKeyUp)
    }
  }, [isPTTActive])

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      // Update signal strengths randomly
      setChannels(prev => prev.map(channel => ({
        ...channel,
        signalStrength: Math.max(60, Math.min(100, channel.signalStrength + (Math.random() - 0.5) * 10))
      })))

      // Randomly change active transmission status
      if (Math.random() > 0.8) {
        setChannels(prev => prev.map(channel => ({
          ...channel,
          hasActiveTransmission: Math.random() > 0.7,
          currentSpeaker: channel.hasActiveTransmission ? 
            activeUsers[Math.floor(Math.random() * activeUsers.length)].name : undefined
        })))
      }
    }, 5000)

    return () => clearInterval(interval)
  }, [activeUsers])

  const startPTT = async () => {
    if (isMuted || connectionStatus !== 'connected') return

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      
      setIsPTTActive(true)
      setIsRecording(true)
      
      mediaRecorder.start()
      
      // Update channel status
      setChannels(prev => prev.map(channel => 
        channel.id === currentChannel 
          ? { ...channel, hasActiveTransmission: true, currentSpeaker: currentUser.name }
          : channel
      ))
      
    } catch (error) {
      console.error('Failed to start PTT:', error)
    }
  }

  const stopPTT = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop())
    }
    
    setIsPTTActive(false)
    setIsRecording(false)
    
    // Update channel status
    setChannels(prev => prev.map(channel => 
      channel.id === currentChannel 
        ? { ...channel, hasActiveTransmission: false, currentSpeaker: undefined }
        : channel
    ))
  }

  const joinChannel = (channelId: string) => {
    setCurrentChannel(channelId)
    
    // Update channel participant count
    setChannels(prev => prev.map(channel => {
      if (channel.id === channelId) {
        return { ...channel, participants: Math.min(channel.participants + 1, channel.maxParticipants) }
      } else if (channel.id === currentChannel) {
        return { ...channel, participants: Math.max(0, channel.participants - 1) }
      }
      return channel
    }))
  }

  const toggleMute = () => {
    setIsMuted(!isMuted)
  }

  const adjustVolume = (newVolume: number) => {
    setVolume(newVolume)
  }

  const initiateEmergencyBroadcast = () => {
    setEmergencyBroadcastMode(true)
    onEmergencyBroadcast?.('Emergency broadcast mode activated')
  }

  const getChannelTypeColor = (type: string) => {
    switch (type) {
      case 'emergency': return 'border-red-500 bg-red-50'
      case 'coordination': return 'border-orange-500 bg-orange-50'
      case 'interagency': return 'border-blue-500 bg-blue-50'
      case 'public': return 'border-green-500 bg-green-50'
      default: return 'border-gray-500 bg-gray-50'
    }
  }

  const getPriorityBadgeColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-600 text-white'
      case 'high': return 'bg-orange-500 text-white'
      case 'medium': return 'bg-yellow-500 text-black'
      case 'low': return 'bg-gray-400 text-white'
      default: return 'bg-gray-400 text-white'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online': return <CheckCircle className="h-3 w-3 text-green-500" />
      case 'busy': return <Clock className="h-3 w-3 text-yellow-500" />
      case 'away': return <Clock className="h-3 w-3 text-orange-500" />
      case 'offline': return <Activity className="h-3 w-3 text-gray-400" />
      default: return <Activity className="h-3 w-3 text-gray-400" />
    }
  }

  const activeChannel = channels.find(c => c.id === currentChannel)
  const channelUsers = activeUsers.filter(u => u.channel === currentChannel)

  return (
    <div className="space-y-4">
      {/* Connection Status */}
      <Alert className={`border-2 ${
        connectionStatus === 'connected' ? 'border-green-200 bg-green-50' : 
        connectionStatus === 'connecting' ? 'border-yellow-200 bg-yellow-50' :
        'border-red-200 bg-red-50'
      }`}>
        <div className="flex items-center gap-2">
          {connectionStatus === 'connected' ? <Wifi className="h-4 w-4 text-green-600" /> :
           connectionStatus === 'connecting' ? <Wifi className="h-4 w-4 text-yellow-600" /> :
           <WifiOff className="h-4 w-4 text-red-600" />}
          <AlertDescription className={
            connectionStatus === 'connected' ? 'text-green-800' :
            connectionStatus === 'connecting' ? 'text-yellow-800' :
            'text-red-800'
          }>
            <div className="flex items-center justify-between">
              <span>
                Radio System Status: {connectionStatus.charAt(0).toUpperCase() + connectionStatus.slice(1)}
                {connectionStatus === 'connected' && ` • Active on ${activeChannel?.name}`}
              </span>
              {emergencyBroadcastMode && (
                <Badge className="bg-red-600 text-white animate-pulse">
                  <Megaphone className="h-3 w-3 mr-1" />
                  EMERGENCY BROADCAST
                </Badge>
              )}
            </div>
          </AlertDescription>
        </div>
      </Alert>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Communication Channels */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Radio className="h-5 w-5" />
                Communication Channels
              </CardTitle>
              <CardDescription>
                Available radio channels for emergency coordination
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {channels.map((channel) => (
                  <div 
                    key={channel.id} 
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      channel.id === currentChannel 
                        ? 'border-blue-500 bg-blue-50 shadow-md' 
                        : getChannelTypeColor(channel.type)
                    } ${!channel.isActive ? 'opacity-50' : ''}`}
                    onClick={() => channel.isActive && joinChannel(channel.id)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold">{channel.name}</h4>
                          <Badge className={getPriorityBadgeColor(channel.priority)}>
                            {channel.priority.toUpperCase()}
                          </Badge>
                          {channel.encryption && (
                            <Shield className="h-3 w-3 text-blue-500" />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{channel.description}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Frequency: {channel.frequency}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-1 mb-1">
                          <Signal className="h-3 w-3" />
                          <span className="text-sm font-medium">{channel.signalStrength}%</span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {channel.participants}/{channel.maxParticipants} users
                        </div>
                      </div>
                    </div>

                    {channel.hasActiveTransmission && (
                      <div className="flex items-center gap-2 p-2 bg-red-100 border border-red-300 rounded">
                        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                        <span className="text-sm font-medium text-red-800">
                          {channel.currentSpeaker} is transmitting
                        </span>
                      </div>
                    )}

                    <Progress 
                      value={(channel.participants / channel.maxParticipants) * 100} 
                      className="mt-2 h-2"
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* PTT Controls */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mic className="h-5 w-5" />
                Push-To-Talk Controls
              </CardTitle>
              <CardDescription>
                Voice communication controls for {activeChannel?.name}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* PTT Button */}
                <div className="flex items-center justify-center">
                  <Button
                    size="lg"
                    className={`w-32 h-32 rounded-full text-white font-bold text-lg ${
                      isPTTActive 
                        ? 'bg-red-600 hover:bg-red-700 shadow-lg animate-pulse' 
                        : 'bg-blue-600 hover:bg-blue-700'
                    }`}
                    onMouseDown={startPTT}
                    onMouseUp={stopPTT}
                    onTouchStart={startPTT}
                    onTouchEnd={stopPTT}
                    disabled={isMuted || connectionStatus !== 'connected'}
                  >
                    {isPTTActive ? (
                      <div className="flex flex-col items-center">
                        <Mic className="h-8 w-8 mb-1" />
                        <span className="text-sm">LIVE</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center">
                        <Mic className="h-8 w-8 mb-1" />
                        <span className="text-sm">PUSH</span>
                      </div>
                    )}
                  </Button>
                </div>

                <div className="text-center text-sm text-muted-foreground">
                  Hold SPACEBAR or click and hold the button to transmit
                </div>

                {/* Audio Controls */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Volume</span>
                      <span className="text-sm text-muted-foreground">{volume}%</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Volume2 className="h-4 w-4" />
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={volume}
                        onChange={(e) => adjustVolume(parseInt(e.target.value))}
                        className="flex-1"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <Button
                      variant={isMuted ? "destructive" : "outline"}
                      onClick={toggleMute}
                      className="flex-1"
                    >
                      {isMuted ? <MicOff className="h-4 w-4 mr-2" /> : <Mic className="h-4 w-4 mr-2" />}
                      {isMuted ? 'Unmute' : 'Mute'}
                    </Button>
                    
                    <Button
                      variant="destructive"
                      onClick={initiateEmergencyBroadcast}
                      disabled={emergencyBroadcastMode}
                    >
                      <Megaphone className="h-4 w-4 mr-2" />
                      Emergency Broadcast
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Active Users & Channel Info */}
        <div className="space-y-4">
          {/* Current Channel Info */}
          {activeChannel && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Headphones className="h-5 w-5" />
                  Active Channel
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <h4 className="font-semibold">{activeChannel.name}</h4>
                    <p className="text-sm text-muted-foreground">{activeChannel.description}</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Frequency:</span>
                      <div className="font-medium">{activeChannel.frequency}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Signal:</span>
                      <div className="font-medium">{activeChannel.signalStrength}%</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Users:</span>
                      <div className="font-medium">{activeChannel.participants}/{activeChannel.maxParticipants}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Type:</span>
                      <div className="font-medium capitalize">{activeChannel.type}</div>
                    </div>
                  </div>

                  <Progress value={activeChannel.signalStrength} className="h-2" />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Active Users */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Active Users ({channelUsers.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {channelUsers.map((user) => (
                  <div key={user.id} className="flex items-center gap-3 p-2 border rounded">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(user.status)}
                      <div className={`w-2 h-2 rounded-full ${
                        user.isSpeaking ? 'bg-red-500 animate-pulse' : 'bg-gray-300'
                      }`} />
                    </div>
                    
                    <div className="flex-1">
                      <div className="font-medium text-sm">{user.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {user.role} • {user.agency}
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="flex items-center gap-1">
                        {user.isMuted && <MicOff className="h-3 w-3 text-red-500" />}
                        <Signal className="h-3 w-3" />
                        <span className="text-xs">{user.signalStrength}%</span>
                      </div>
                    </div>
                  </div>
                ))}

                {channelUsers.length === 0 && (
                  <p className="text-center text-muted-foreground py-4">
                    No users in this channel
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Button variant="outline" className="w-full justify-start">
                  <PhoneCall className="h-4 w-4 mr-2" />
                  Conference Call
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Text Message
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <UserCheck className="h-4 w-4 mr-2" />
                  Roll Call
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Settings className="h-4 w-4 mr-2" />
                  Channel Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}