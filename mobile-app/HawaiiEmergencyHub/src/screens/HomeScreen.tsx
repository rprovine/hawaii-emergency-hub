import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert as RNAlert,
  SafeAreaView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Alert, DashboardMetrics } from '../types';
import { apiService, demoData } from '../services/api';
import { COLORS, SEVERITY_COLORS, ALERT_CATEGORIES } from '../constants';

export function HomeScreen() {
  const navigation = useNavigation();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
    
    // Check for critical alerts and send notification
    const checkCriticalAlerts = async () => {
      const criticalAlert = demoData.alerts.find(alert => 
        alert.severity === 'extreme' || alert.severity === 'critical'
      );
      
      if (criticalAlert && criticalAlert.category === 'tsunami') {
        // Schedule immediate notification for tsunami warning
        const { NotificationService } = await import('../services/notifications');
        await NotificationService.scheduleEmergencyAlert(criticalAlert);
      }
    };
    
    checkCriticalAlerts();
  }, []);

  const loadData = async () => {
    try {
      // Use demo data for now, replace with actual API calls
      setAlerts(demoData.alerts);
      setMetrics(demoData.metrics);
    } catch (error) {
      console.error('Error loading data:', error);
      RNAlert.alert('Error', 'Failed to load emergency data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const getSeverityStyle = (severity: Alert['severity']) => ({
    backgroundColor: SEVERITY_COLORS[severity],
  });

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Hawaii Emergency Hub</Text>
            <Text style={styles.headerSubtitle}>Stay Safe, Stay Informed</Text>
          </View>
          <TouchableOpacity
            style={styles.settingsButton}
            onPress={() => navigation.navigate('Settings' as never)}
          >
            <Text style={styles.settingsIcon}>⚙️</Text>
          </TouchableOpacity>
        </View>

        {/* Emergency Status */}
        {metrics && (
          <View style={styles.statusCard}>
            <Text style={styles.statusTitle}>Current Status</Text>
            <View style={styles.metricsGrid}>
              <View style={styles.metricItem}>
                <Text style={styles.metricValue}>{metrics.active_alerts}</Text>
                <Text style={styles.metricLabel}>Active Alerts</Text>
              </View>
              <View style={styles.metricItem}>
                <Text style={styles.metricValue}>{metrics.critical_alerts}</Text>
                <Text style={styles.metricLabel}>Critical</Text>
              </View>
              <View style={styles.metricItem}>
                <Text style={styles.metricValue}>{metrics.system_health}%</Text>
                <Text style={styles.metricLabel}>System Health</Text>
              </View>
            </View>
          </View>
        )}

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: COLORS.danger }]}
            onPress={() => navigation.navigate('Emergency' as never)}
          >
            <Text style={styles.actionIcon}>🚨</Text>
            <Text style={styles.actionText}>Emergency</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: COLORS.primary }]}
            onPress={() => navigation.navigate('Map' as never)}
          >
            <Text style={styles.actionIcon}>🗺️</Text>
            <Text style={styles.actionText}>Alert Map</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: COLORS.warning }]}
            onPress={() => navigation.navigate('Family' as never)}
          >
            <Text style={styles.actionIcon}>👨‍👩‍👧‍👦</Text>
            <Text style={styles.actionText}>Family</Text>
          </TouchableOpacity>
        </View>

        {/* Active Alerts */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Active Alerts</Text>
          {alerts.map((alert) => (
            <TouchableOpacity
              key={alert.id}
              style={styles.alertCard}
              onPress={() => navigation.navigate('Map' as never, { alert } as never)}
            >
              <View style={styles.alertHeader}>
                <Text style={styles.alertIcon}>
                  {ALERT_CATEGORIES[alert.category as keyof typeof ALERT_CATEGORIES]?.icon || '⚠️'}
                </Text>
                <View style={styles.alertTitleContainer}>
                  <Text style={styles.alertTitle}>{alert.title}</Text>
                  <Text style={styles.alertLocation}>{alert.location_name}</Text>
                </View>
                <View style={[styles.severityBadge, getSeverityStyle(alert.severity)]}>
                  <Text style={styles.severityText}>{alert.severity.toUpperCase()}</Text>
                </View>
              </View>
              <Text style={styles.alertDescription}>{alert.description}</Text>
              <Text style={styles.alertTime}>
                {formatTime(alert.created_at)} • Expires in {alert.time_until_expiry}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: COLORS.primary,
    paddingTop: 40,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'white',
    opacity: 0.9,
    marginTop: 4,
  },
  statusCard: {
    margin: 16,
    padding: 16,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: COLORS.text,
  },
  metricsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  metricItem: {
    alignItems: 'center',
  },
  metricValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  metricLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 8,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  actionIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  actionText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 12,
    color: COLORS.text,
  },
  alertCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  alertIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  alertTitleContainer: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  alertLocation: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  severityBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  severityText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  alertDescription: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  alertTime: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingsIcon: {
    fontSize: 24,
  },
});