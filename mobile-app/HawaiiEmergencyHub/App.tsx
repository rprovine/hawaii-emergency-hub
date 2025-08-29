import React, { useEffect } from 'react';
import { StatusBar } from 'react-native';
import { AppNavigator } from './src/navigation/AppNavigator';
import { COLORS } from './src/constants';
import { NotificationService } from './src/services/notifications';
import { apiService } from './src/services/api';
import NetInfo from '@react-native-community/netinfo';

export default function App() {
  useEffect(() => {
    // Register for push notifications
    NotificationService.registerForPushNotificationsAsync();

    // Set up notification listeners
    const notificationListener = NotificationService.addNotificationReceivedListener(notification => {
      console.log('Notification received:', notification);
    });

    const responseListener = NotificationService.addNotificationResponseReceivedListener(response => {
      console.log('Notification response:', response);
    });

    // Set up network state listener for offline sync
    const unsubscribe = NetInfo.addEventListener(state => {
      if (state.isConnected) {
        apiService.syncOfflineData();
      }
    });

    // Cleanup
    return () => {
      notificationListener.remove();
      responseListener.remove();
      unsubscribe();
    };
  }, []);

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      <AppNavigator />
    </>
  );
}
