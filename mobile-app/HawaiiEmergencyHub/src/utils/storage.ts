import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
  FAMILY_MEMBERS: '@hawaii_emergency/family_members',
  MY_STATUS: '@hawaii_emergency/my_status',
  EMERGENCY_KIT: '@hawaii_emergency/emergency_kit',
  SETTINGS: '@hawaii_emergency/settings',
};

export const storage = {
  // Family Members
  async saveFamilyMembers(members: any[]) {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.FAMILY_MEMBERS, JSON.stringify(members));
    } catch (error) {
      console.error('Error saving family members:', error);
    }
  },

  async getFamilyMembers() {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.FAMILY_MEMBERS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting family members:', error);
      return [];
    }
  },

  // Status
  async saveMyStatus(status: string) {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.MY_STATUS, status);
    } catch (error) {
      console.error('Error saving status:', error);
    }
  },

  async getMyStatus() {
    try {
      const status = await AsyncStorage.getItem(STORAGE_KEYS.MY_STATUS);
      return status || 'safe';
    } catch (error) {
      console.error('Error getting status:', error);
      return 'safe';
    }
  },

  // Emergency Kit
  async saveEmergencyKit(items: any[]) {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.EMERGENCY_KIT, JSON.stringify(items));
    } catch (error) {
      console.error('Error saving emergency kit:', error);
    }
  },

  async getEmergencyKit() {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.EMERGENCY_KIT);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting emergency kit:', error);
      return [];
    }
  },

  // Settings
  async saveSettings(settings: any) {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  },

  async getSettings() {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.SETTINGS);
      return data ? JSON.parse(data) : {};
    } catch (error) {
      console.error('Error getting settings:', error);
      return {};
    }
  },
};