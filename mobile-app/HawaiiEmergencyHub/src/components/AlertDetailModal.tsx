import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { Alert } from '../types';
import { COLORS, SEVERITY_COLORS, ALERT_CATEGORIES } from '../constants';

interface AlertDetailModalProps {
  alert: Alert | null;
  visible: boolean;
  onClose: () => void;
}

export function AlertDetailModal({ alert, visible, onClose }: AlertDetailModalProps) {
  if (!alert) return null;

  const getSeverityColor = () => {
    return SEVERITY_COLORS[alert.severity as keyof typeof SEVERITY_COLORS] || COLORS.warning;
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.iconContainer}>
            <Text style={styles.alertIcon}>
              {ALERT_CATEGORIES[alert.category as keyof typeof ALERT_CATEGORIES]?.icon || '⚠️'}
            </Text>
          </View>

          <Text style={styles.title}>{alert.title}</Text>
          <Text style={styles.location}>{alert.location_name}</Text>

          <View style={[styles.severityBadge, { backgroundColor: getSeverityColor() }]}>
            <Text style={styles.severityText}>{alert.severity.toUpperCase()}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.description}>{alert.description}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Affected Areas</Text>
            <Text style={styles.sectionContent}>
              {alert.affected_counties?.join(', ') || 'All areas'}
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Time Until Expiry</Text>
            <Text style={styles.timeText}>{alert.time_until_expiry}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recommended Actions</Text>
            <View style={styles.actionsList}>
              <Text style={styles.actionItem}>• Monitor official channels for updates</Text>
              <Text style={styles.actionItem}>• Follow evacuation orders if issued</Text>
              <Text style={styles.actionItem}>• Prepare emergency supplies</Text>
              <Text style={styles.actionItem}>• Check on family and neighbors</Text>
            </View>
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.primaryButton}>
              <Text style={styles.primaryButtonText}>View on Map</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryButton}>
              <Text style={styles.secondaryButtonText}>Share Alert</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 16,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 24,
    color: COLORS.text,
  },
  content: {
    padding: 20,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  alertIcon: {
    fontSize: 80,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  location: {
    fontSize: 18,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
  },
  severityBadge: {
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginBottom: 30,
  },
  severityText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  sectionContent: {
    fontSize: 16,
    color: COLORS.textSecondary,
    lineHeight: 24,
  },
  description: {
    fontSize: 16,
    color: COLORS.textSecondary,
    lineHeight: 24,
  },
  timeText: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.warning,
  },
  actionsList: {
    marginTop: 8,
  },
  actionItem: {
    fontSize: 16,
    color: COLORS.textSecondary,
    lineHeight: 28,
  },
  buttonContainer: {
    marginTop: 30,
    gap: 12,
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: COLORS.surface,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  secondaryButtonText: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '600',
  },
});