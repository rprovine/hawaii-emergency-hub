import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
} from 'react-native';
import { COLORS, EMERGENCY_CONTACTS } from '../constants';

export function EmergencyScreen() {
  const makePhoneCall = (number: string, name: string) => {
    const phoneNumber = `tel:${number}`;
    Linking.canOpenURL(phoneNumber)
      .then((supported) => {
        if (supported) {
          return Linking.openURL(phoneNumber);
        } else {
          Alert.alert('Error', 'Phone calls are not supported on this device');
        }
      })
      .catch((err) => console.error('Error opening phone app:', err));
  };

  const openWebsite = (url: string) => {
    Linking.canOpenURL(url)
      .then((supported) => {
        if (supported) {
          return Linking.openURL(url);
        } else {
          Alert.alert('Error', 'Cannot open this website');
        }
      })
      .catch((err) => console.error('Error opening website:', err));
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Emergency Alert */}
        <View style={styles.emergencyBanner}>
          <Text style={styles.emergencyIcon}>🚨</Text>
          <Text style={styles.emergencyTitle}>Emergency Resources</Text>
          <Text style={styles.emergencySubtitle}>
            Tap any number below to call directly
          </Text>
        </View>

        {/* Quick Emergency Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={[styles.quickActionButton, styles.emergencyButton]}
            onPress={() => makePhoneCall('911', 'Emergency Services')}
          >
            <Text style={styles.quickActionIcon}>📞</Text>
            <Text style={styles.quickActionText}>Call 911</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.quickActionButton, styles.tsunamiButton]}
            onPress={() => openWebsite('https://tsunami.gov')}
          >
            <Text style={styles.quickActionIcon}>🌊</Text>
            <Text style={styles.quickActionText}>Tsunami Info</Text>
          </TouchableOpacity>
        </View>

        {/* Emergency Contacts */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Emergency Contacts</Text>
          {EMERGENCY_CONTACTS.map((contact, index) => (
            <TouchableOpacity
              key={index}
              style={styles.contactCard}
              onPress={() => makePhoneCall(contact.phone, contact.name)}
            >
              <View style={styles.contactInfo}>
                <Text style={styles.contactIcon}>{contact.icon}</Text>
                <View style={styles.contactDetails}>
                  <Text style={styles.contactName}>{contact.name}</Text>
                  <Text style={styles.contactPhone}>{contact.phone}</Text>
                  {contact.description && (
                    <Text style={styles.contactDescription}>{contact.description}</Text>
                  )}
                </View>
              </View>
              <Text style={styles.callIcon}>📞</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Emergency Kit Checklist */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Emergency Kit Essentials</Text>
          <View style={styles.checklistCard}>
            <Text style={styles.checklistItem}>💧 Water (1 gallon per person per day)</Text>
            <Text style={styles.checklistItem}>🥫 Non-perishable food (3-day supply)</Text>
            <Text style={styles.checklistItem}>📻 Battery-powered radio</Text>
            <Text style={styles.checklistItem}>🔦 Flashlight and extra batteries</Text>
            <Text style={styles.checklistItem}>🏥 First aid kit</Text>
            <Text style={styles.checklistItem}>💊 Medications (7-day supply)</Text>
            <Text style={styles.checklistItem}>📄 Important documents</Text>
            <Text style={styles.checklistItem}>💵 Cash and credit cards</Text>
          </View>
        </View>

        {/* Evacuation Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Evacuation Guidelines</Text>
          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>When to Evacuate</Text>
            <Text style={styles.infoText}>
              • Follow official evacuation orders immediately{'\n'}
              • Don't wait for conditions to worsen{'\n'}
              • Have your emergency kit ready to go
            </Text>
          </View>
          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>Evacuation Routes</Text>
            <Text style={styles.infoText}>
              • Know multiple routes from your location{'\n'}
              • Avoid low-lying areas during tsunamis{'\n'}
              • Follow official traffic directions
            </Text>
          </View>
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
  content: {
    paddingBottom: 20,
  },
  emergencyBanner: {
    backgroundColor: COLORS.danger,
    padding: 20,
    alignItems: 'center',
  },
  emergencyIcon: {
    fontSize: 48,
    marginBottom: 10,
  },
  emergencyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  emergencySubtitle: {
    fontSize: 16,
    color: 'white',
    opacity: 0.9,
  },
  quickActions: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  quickActionButton: {
    flex: 1,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  emergencyButton: {
    backgroundColor: COLORS.danger,
  },
  tsunamiButton: {
    backgroundColor: COLORS.primary,
  },
  quickActionIcon: {
    fontSize: 40,
    marginBottom: 8,
  },
  quickActionText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 12,
  },
  contactCard: {
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
  contactInfo: {
    flexDirection: 'row',
    flex: 1,
  },
  contactIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  contactDetails: {
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  contactPhone: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginTop: 2,
  },
  contactDescription: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  callIcon: {
    fontSize: 24,
  },
  checklistCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  checklistItem: {
    fontSize: 16,
    color: COLORS.text,
    marginBottom: 12,
    lineHeight: 22,
  },
  infoCard: {
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
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
});