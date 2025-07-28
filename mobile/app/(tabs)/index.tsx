import React, { useEffect } from 'react';
import { ScrollView, View, Text, RefreshControl } from 'react-native';
import { styled } from 'nativewind';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AlertTriangle, MapPin, Shield, ChevronRight } from 'lucide-react-native';
import { useQuery } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { useAlertStore } from '../../lib/stores/alertStore';
import { fetchNearbyAlerts, fetchAlertStats } from '../../services/api';

const StyledView = styled(View);
const StyledText = styled(Text);
const StyledScrollView = styled(ScrollView);
const StyledSafeAreaView = styled(SafeAreaView);

export default function HomeScreen() {
  const [refreshing, setRefreshing] = React.useState(false);
  const { location, setLocation } = useAlertStore();

  // Fetch nearby alerts
  const { data: alerts, refetch: refetchAlerts } = useQuery({
    queryKey: ['nearbyAlerts', location],
    queryFn: () => fetchNearbyAlerts(location),
    enabled: !!location,
  });

  // Fetch alert statistics
  const { data: stats } = useQuery({
    queryKey: ['alertStats'],
    queryFn: fetchAlertStats,
    refetchInterval: 60000, // Refresh every minute
  });

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    try {
      await refetchAlerts();
    } finally {
      setRefreshing(false);
    }
  }, [refetchAlerts]);

  const getStatusColor = () => {
    if (!alerts || alerts.length === 0) return ['#10b981', '#059669']; // Green
    
    const severities = alerts.map(a => a.severity);
    if (severities.includes('extreme')) return ['#dc2626', '#991b1b']; // Red
    if (severities.includes('severe')) return ['#f59e0b', '#d97706']; // Orange
    return ['#eab308', '#ca8a04']; // Yellow
  };

  const getStatusText = () => {
    if (!alerts || alerts.length === 0) return 'All Clear';
    
    const severities = alerts.map(a => a.severity);
    if (severities.includes('extreme')) return 'Emergency';
    if (severities.includes('severe')) return 'Severe Alert';
    return 'Active Alerts';
  };

  return (
    <StyledSafeAreaView className="flex-1 bg-background">
      <StyledScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Hero Status Card */}
        <LinearGradient
          colors={getStatusColor()}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="mx-4 mt-4 rounded-2xl p-6"
        >
          <StyledView className="items-center">
            <StyledView className="w-20 h-20 bg-white/20 rounded-full items-center justify-center mb-4">
              {getStatusText() === 'All Clear' ? (
                <Shield size={40} color="white" />
              ) : (
                <AlertTriangle size={40} color="white" />
              )}
            </StyledView>
            <StyledText className="text-3xl font-bold text-white mb-2">
              {getStatusText()}
            </StyledText>
            <StyledText className="text-white/90 text-center">
              {alerts?.length || 0} active alerts in your area
            </StyledText>
          </StyledView>
        </LinearGradient>

        {/* Quick Actions */}
        <StyledView className="px-4 mt-6">
          <StyledText className="text-lg font-semibold text-foreground mb-3">
            Quick Actions
          </StyledText>
          <StyledView className="flex-row justify-between">
            <Button 
              variant="outline" 
              size="default"
              className="flex-1 mr-2"
              onPress={() => {/* Handle emergency contacts */}}
            >
              <StyledView className="items-center">
                <StyledText className="text-sm">Emergency</StyledText>
                <StyledText className="text-xs text-muted-foreground">Contacts</StyledText>
              </StyledView>
            </Button>
            <Button 
              variant="outline" 
              size="default"
              className="flex-1 mx-2"
              onPress={() => {/* Handle shelters */}}
            >
              <StyledView className="items-center">
                <StyledText className="text-sm">Nearby</StyledText>
                <StyledText className="text-xs text-muted-foreground">Shelters</StyledText>
              </StyledView>
            </Button>
            <Button 
              variant="outline" 
              size="default"
              className="flex-1 ml-2"
              onPress={() => {/* Handle resources */}}
            >
              <StyledView className="items-center">
                <StyledText className="text-sm">Emergency</StyledText>
                <StyledText className="text-xs text-muted-foreground">Resources</StyledText>
              </StyledView>
            </Button>
          </StyledView>
        </StyledView>

        {/* Recent Alerts */}
        {alerts && alerts.length > 0 && (
          <StyledView className="px-4 mt-6">
            <StyledView className="flex-row justify-between items-center mb-3">
              <StyledText className="text-lg font-semibold text-foreground">
                Recent Alerts
              </StyledText>
              <Button variant="ghost" size="sm">
                <StyledText className="text-primary">View All</StyledText>
                <ChevronRight size={16} color="#006B96" />
              </Button>
            </StyledView>

            {alerts.slice(0, 3).map((alert) => (
              <Card key={alert.id} className="mb-3">
                <CardHeader>
                  <StyledView className="flex-row justify-between items-start">
                    <Badge severity={alert.severity}>
                      {alert.severity.toUpperCase()}
                    </Badge>
                    <StyledText className="text-xs text-muted-foreground">
                      {alert.timeAgo}
                    </StyledText>
                  </StyledView>
                  <CardTitle>{alert.title}</CardTitle>
                  <CardDescription>{alert.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <StyledView className="flex-row items-center">
                    <MapPin size={14} color="#64748b" />
                    <StyledText className="text-xs text-muted-foreground ml-1">
                      {alert.location}
                    </StyledText>
                  </StyledView>
                </CardContent>
              </Card>
            ))}
          </StyledView>
        )}

        {/* Statistics */}
        {stats && (
          <StyledView className="px-4 mt-6 mb-8">
            <StyledText className="text-lg font-semibold text-foreground mb-3">
              24-Hour Summary
            </StyledText>
            <StyledView className="flex-row justify-between">
              <Card className="flex-1 mr-2">
                <CardContent className="items-center py-4">
                  <StyledText className="text-2xl font-bold text-foreground">
                    {stats.totalAlerts}
                  </StyledText>
                  <StyledText className="text-xs text-muted-foreground">
                    Total Alerts
                  </StyledText>
                </CardContent>
              </Card>
              <Card className="flex-1 mx-2">
                <CardContent className="items-center py-4">
                  <StyledText className="text-2xl font-bold text-foreground">
                    {stats.responseTime}
                  </StyledText>
                  <StyledText className="text-xs text-muted-foreground">
                    Avg Response
                  </StyledText>
                </CardContent>
              </Card>
              <Card className="flex-1 ml-2">
                <CardContent className="items-center py-4">
                  <StyledText className="text-2xl font-bold text-foreground">
                    {stats.activeUsers}
                  </StyledText>
                  <StyledText className="text-xs text-muted-foreground">
                    Active Users
                  </StyledText>
                </CardContent>
              </Card>
            </StyledView>
          </StyledView>
        )}
      </StyledScrollView>
    </StyledSafeAreaView>
  );
}