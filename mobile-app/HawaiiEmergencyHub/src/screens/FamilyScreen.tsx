import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { COLORS } from '../constants';

export function FamilyScreen() {
  const [myStatus, setMyStatus] = useState<'safe' | 'unsafe' | 'needs_help'>('safe');

  const familyMembers = [
    { id: '1', name: 'John Doe', status: 'safe', lastUpdate: '5 minutes ago' },
    { id: '2', name: 'Jane Doe', status: 'unknown', lastUpdate: '2 hours ago' },
    { id: '3', name: 'Bob Smith', status: 'safe', lastUpdate: '30 minutes ago' },
  ];

  const updateStatus = (status: typeof myStatus) => {
    setMyStatus(status);
    Alert.alert('Status Updated', `Your status has been updated to: ${status.toUpperCase()}`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'safe':
        return COLORS.success;
      case 'unsafe':
      case 'needs_help':
        return COLORS.danger;
      default:
        return COLORS.textSecondary;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* My Status */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>My Status</Text>
          <View style={styles.statusButtons}>
            <TouchableOpacity
              style={[
                styles.statusButton,
                myStatus === 'safe' && { backgroundColor: COLORS.success },
              ]}
              onPress={() => updateStatus('safe')}
            >
              <Text style={styles.statusIcon}>✅</Text>
              <Text style={[styles.statusText, myStatus === 'safe' && { color: 'white' }]}>
                I'm Safe
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.statusButton,
                myStatus === 'needs_help' && { backgroundColor: COLORS.warning },
              ]}
              onPress={() => updateStatus('needs_help')}
            >
              <Text style={styles.statusIcon}>⚠️</Text>
              <Text style={[styles.statusText, myStatus === 'needs_help' && { color: 'white' }]}>
                Need Help
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.statusButton,
                myStatus === 'unsafe' && { backgroundColor: COLORS.danger },
              ]}
              onPress={() => updateStatus('unsafe')}
            >
              <Text style={styles.statusIcon}>🆘</Text>
              <Text style={[styles.statusText, myStatus === 'unsafe' && { color: 'white' }]}>
                Emergency
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Family Members */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Family Members</Text>
          {familyMembers.map((member) => (
            <View key={member.id} style={styles.memberCard}>
              <View style={styles.memberInfo}>
                <View style={[styles.statusDot, { backgroundColor: getStatusColor(member.status) }]} />
                <View>
                  <Text style={styles.memberName}>{member.name}</Text>
                  <Text style={styles.memberStatus}>
                    {member.status.charAt(0).toUpperCase() + member.status.slice(1)} • {member.lastUpdate}
                  </Text>
                </View>
              </View>
              <TouchableOpacity style={styles.checkButton}>
                <Text style={styles.checkButtonText}>Check In</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* Add Family Member */}
        <TouchableOpacity style={styles.addButton}>
          <Text style={styles.addButtonIcon}>➕</Text>
          <Text style={styles.addButtonText}>Add Family Member</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 12,
  },
  statusButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statusButton: {
    flex: 1,
    marginHorizontal: 4,
    padding: 16,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  statusIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  memberCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  memberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  memberStatus: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  checkButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: COLORS.primary,
    borderRadius: 20,
  },
  checkButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
  },
  addButtonIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
});