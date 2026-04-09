import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';

import { HapticTab } from '@/components/HapticTab';
import { IconSymbol } from '@/components/ui/IconSymbol';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { isFeatureEnabled } from '../config/featureFlags';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  // Only show enabled feature tabs
  const visibleTabs = [
    {
      name: 'index',
      title: 'Dashboard',
      icon: 'house.fill',
      visible: isFeatureEnabled('DASHBOARD'),
    },
    {
      name: 'explore',
      title: 'Check-In',
      icon: 'checkmark-circle',
      visible: isFeatureEnabled('WEEKLY_CHECKIN'),
    },
  ];

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarBackground: TabBarBackground,
        tabBarStyle: Platform.select({
          ios: {
            position: 'absolute',
          },
          default: {},
        }),
      }}>
      
      {/* Conditionally render tabs based on feature flags */}
      {visibleTabs.map((tab) => 
        tab.visible && (
          <Tabs.Screen
            key={tab.name}
            name={tab.name}
            options={{
              title: tab.title,
              tabBarIcon: ({ color }) => (
                <IconSymbol size={28} name={tab.icon as any} color={color} />
              ),
            }}
          />
        )
      )}
    </Tabs>
  );
}