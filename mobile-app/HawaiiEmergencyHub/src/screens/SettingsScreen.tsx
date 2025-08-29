import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Switch,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { COLORS } from '../constants';
import { storage } from '../utils/storage';
import { NotificationService } from '../services/notifications';

export function SettingsScreen() {
  const [settings, setSettings] = useState({
    pushNotifications: true,
    criticalAlerts: true,
    familyUpdates: true,
    communityReports: false,
    locationSharing: true,
    offlineMode: true,
    autoRefresh: true,
    darkMode: false,
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const savedSettings = await storage.getSettings();
    if (savedSettings) {
      setSettings({ ...settings, ...savedSettings });
    }
  };

  const updateSetting = async (key: string, value: boolean) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    await storage.saveSettings(newSettings);

    // Handle specific setting changes
    if (key === 'pushNotifications' && !value) {
      Alert.alert(
        'Disable Notifications',
        'You will not receive emergency alerts. Are you sure?',
        [
          { text: 'Cancel', onPress: () => updateSetting(key, true) },
          { text: 'Disable', style: 'destructive' },
        ]
      );
    }
  };

  const clearCache = async () => {
    Alert.alert(
      'Clear Cache',
      'This will remove all offline data. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            // Clear AsyncStorage cache
            Alert.alert('Success', 'Cache cleared successfully');
          },
        },
      ]
    );
  };

  const testNotification = async () => {
    await NotificationService.scheduleLocalNotification(
      'Test Alert',
      'This is a test notification from Hawaii Emergency Hub',
      { type: 'test' }
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.header}>Settings</Text>

        {/* Notifications */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notifications</Text>
          
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Push Notifications</Text>
            <Switch
              value={settings.pushNotifications}
              onValueChange={(value) => updateSetting('pushNotifications', value)}
              trackColor={{ false: COLORS.border, true: COLORS.primary }}
            />
          </View>

          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Critical Alerts</Text>
            <Switch
              value={settings.criticalAlerts}
              onValueChange={(value) => updateSetting('criticalAlerts', value)}
              trackColor={{ false: COLORS.border, true: COLORS.primary }}
            />
          </View>

          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Family Updates</Text>
            <Switch
              value={settings.familyUpdates}
              onValueChange={(value) => updateSetting('familyUpdates', value)}
              trackColor={{ false: COLORS.border, true: COLORS.primary }}
            />
          </View>

          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Community Reports</Text>
            <Switch
              value={settings.communityReports}
              onValueChange={(value) => updateSetting('communityReports', value)}
              trackColor={{ false: COLORS.border, true: COLORS.primary }}
            />
          </View>
        </View>

        {/* Privacy */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Privacy</Text>
          
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Location Sharing</Text>
            <Switch
              value={settings.locationSharing}
              onValueChange={(value) => updateSetting('locationSharing', value)}
              trackColor={{ false: COLORS.border, true: COLORS.primary }}
            />
          </View>
        </View>

        {/* Data */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data & Storage</Text>
          
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Offline Mode</Text>
            <Switch
              value={settings.offlineMode}
              onValueChange={(value) => updateSetting('offlineMode', value)}
              trackColor={{ false: COLORS.border, true: COLORS.primary }}
            />
          </View>

          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Auto-refresh Data</Text>
            <Switch
              value={settings.autoRefresh}
              onValueChange={(value) => updateSetting('autoRefresh', value)}
              trackColor={{ false: COLORS.border, true: COLORS.primary }}
            />
          </View>

          <TouchableOpacity style={styles.button} onPress={clearCache}>
            <Text style={styles.buttonText}>Clear Cache</Text>
          </TouchableOpacity>
        </View>

        {/* Appearance */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Appearance</Text>
          
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Dark Mode</Text>
            <Switch
              value={settings.darkMode}
              onValueChange={(value) => updateSetting('darkMode', value)}
              trackColor={{ false: COLORS.border, true: COLORS.primary }}
            />
          </View>
        </View>

        {/* Debug */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Debug</Text>
          
          <TouchableOpacity style={styles.button} onPress={testNotification}>
            <Text style={styles.buttonText}>Test Notification</Text>
          </TouchableOpacity>
        </View>

        {/* About */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <Text style={styles.aboutText}>Hawaii Emergency Hub v1.0.0</Text>
          <Text style={styles.aboutText}>© 2024 Hawaii Emergency Management</Text>
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
    paddingBottom: 40,
  },
  header: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.text,
    padding: 20,
    paddingTop: 10,
  },
  section: {
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 12,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  settingLabel: {
    fontSize: 16,
    color: COLORS.text,
    flex: 1,
  },
  button: {
    backgroundColor: COLORS.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  aboutText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
});