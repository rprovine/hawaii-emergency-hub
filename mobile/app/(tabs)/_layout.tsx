import React from 'react';
import { Tabs } from 'expo-router';
import { Home, AlertTriangle, Map, Settings } from 'lucide-react-native';
import { View, Text } from 'react-native';
import { styled } from 'nativewind';

const StyledView = styled(View);
const StyledText = styled(Text);

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#006B96',
        tabBarInactiveTintColor: '#64748b',
        tabBarStyle: {
          height: 65,
          paddingBottom: 10,
          paddingTop: 10,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontFamily: 'Inter-Medium',
        },
        headerStyle: {
          backgroundColor: '#006B96',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontFamily: 'Inter-Bold',
          fontSize: 18,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          headerTitle: 'Hawaii Emergency Network',
          tabBarIcon: ({ color, size }) => (
            <Home size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="alerts"
        options={{
          title: 'Alerts',
          tabBarIcon: ({ color, size, focused }) => (
            <StyledView className="relative">
              <AlertTriangle size={size} color={color} />
              {focused && (
                <StyledView className="absolute -top-1 -right-1 w-2 h-2 bg-destructive rounded-full" />
              )}
            </StyledView>
          ),
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: 'Map',
          tabBarIcon: ({ color, size }) => (
            <Map size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <Settings size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}