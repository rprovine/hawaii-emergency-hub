import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ActivityIndicator, TouchableOpacity } from 'react-native';
import MapView, { Marker, Circle, PROVIDER_GOOGLE } from 'react-native-maps';
import { COLORS, SEVERITY_COLORS, ALERT_CATEGORIES } from '../constants';
import { demoData } from '../services/api';
import { Alert } from '../types';

export function MapScreen() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [loading, setLoading] = useState(true);

  // Hawaii center coordinates
  const initialRegion = {
    latitude: 20.7984,
    longitude: -156.3319,
    latitudeDelta: 8.0,
    longitudeDelta: 8.0,
  };

  useEffect(() => {
    // Load alert data
    setAlerts(demoData.alerts);
    setLoading(false);
  }, []);

  const getMarkerColor = (severity: string) => {
    return SEVERITY_COLORS[severity as keyof typeof SEVERITY_COLORS] || COLORS.warning;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading map...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={initialRegion}
        provider={PROVIDER_GOOGLE}
        showsUserLocation
        showsMyLocationButton
      >
        {alerts.map((alert) => {
          const lat = alert.latitude || (alert.coordinates ? alert.coordinates[1] : 0);
          const lng = alert.longitude || (alert.coordinates ? alert.coordinates[0] : 0);
          const radius = (alert.affected_radius_km || alert.radius_miles || 10) * 1000;
          
          if (!lat || !lng) return null;
          
          return (
            <React.Fragment key={alert.id}>
              <Marker
                coordinate={{
                  latitude: lat,
                  longitude: lng,
                }}
                title={alert.title}
                description={alert.description}
                onPress={() => setSelectedAlert(alert)}
                pinColor={getMarkerColor(alert.severity)}
              />
              <Circle
                center={{
                  latitude: lat,
                  longitude: lng,
                }}
                radius={radius}
                fillColor={`${getMarkerColor(alert.severity)}20`}
                strokeColor={getMarkerColor(alert.severity)}
                strokeWidth={2}
              />
            </React.Fragment>
          );
        })}
      </MapView>

      {selectedAlert && (
        <View style={styles.alertDetails}>
          <View style={styles.alertHeader}>
            <Text style={styles.alertIcon}>
              {ALERT_CATEGORIES[selectedAlert.category as keyof typeof ALERT_CATEGORIES]?.icon || '⚠️'}
            </Text>
            <View style={styles.alertInfo}>
              <Text style={styles.alertTitle}>{selectedAlert.title}</Text>
              <Text style={styles.alertLocation}>{selectedAlert.location_name}</Text>
            </View>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setSelectedAlert(null)}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.alertDescription}>{selectedAlert.description}</Text>
          <View style={[styles.severityBadge, { backgroundColor: getMarkerColor(selectedAlert.severity) }]}>
            <Text style={styles.severityText}>{selectedAlert.severity.toUpperCase()}</Text>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  map: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  alertDetails: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.surface,
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  alertIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  alertInfo: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
  },
  alertLocation: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  alertDescription: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 12,
  },
  severityBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  severityText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 18,
    color: COLORS.text,
    fontWeight: '600',
  },
});