import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, SafeAreaView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Alert } from '../types';
import { demoData } from '../services/api';
import { COLORS, SEVERITY_COLORS, ALERT_CATEGORIES } from '../constants';
import { AlertDetailModal } from '../components/AlertDetailModal';

export function AlertsScreen() {
  const navigation = useNavigation();
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const alerts = demoData.alerts;

  const handleAlertPress = (alert: Alert) => {
    setSelectedAlert(alert);
    setModalVisible(true);
  };

  const renderAlert = ({ item }: { item: Alert }) => (
    <TouchableOpacity
      style={styles.alertCard}
      onPress={() => handleAlertPress(item)}
    >
      <View style={styles.alertHeader}>
        <Text style={styles.alertIcon}>
          {ALERT_CATEGORIES[item.category as keyof typeof ALERT_CATEGORIES]?.icon || '⚠️'}
        </Text>
        <View style={styles.alertContent}>
          <Text style={styles.alertTitle}>{item.title}</Text>
          <Text style={styles.alertLocation}>{item.location_name}</Text>
          <Text style={styles.alertDescription}>{item.description}</Text>
        </View>
      </View>
      <View style={styles.alertFooter}>
        <View style={[styles.severityBadge, { backgroundColor: SEVERITY_COLORS[item.severity] }]}>
          <Text style={styles.severityText}>{item.severity.toUpperCase()}</Text>
        </View>
        <Text style={styles.alertTime}>Expires in {item.time_until_expiry}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={alerts}
        keyExtractor={(item) => item.id}
        renderItem={renderAlert}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No active alerts</Text>
          </View>
        }
      />
      
      <AlertDetailModal
        alert={selectedAlert}
        visible={modalVisible}
        onClose={() => {
          setModalVisible(false);
          setSelectedAlert(null);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  listContent: {
    padding: 16,
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
    marginBottom: 12,
  },
  alertIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  alertContent: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  alertLocation: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  alertDescription: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  alertFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  alertTime: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 100,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
});