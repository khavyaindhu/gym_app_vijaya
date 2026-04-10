import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, StyleSheet } from 'react-native';
import { 
  HomeIcon, 
  ClipboardDocumentCheckIcon,
  BellIcon,
} from 'react-native-heroicons/outline';
import { 
  HomeIcon as HomeIconSolid, 
  ClipboardDocumentCheckIcon as ClipboardDocumentCheckIconSolid,
  BellIcon as BellIconSolid,
} from 'react-native-heroicons/solid';

// Import screens
import HomeSummary from '../app/dashboards/user/HomeSummary';
import WeeklyCheckinScreen from '../app/dashboards/user/WeeklyCheckinScreen';
import CheckInNotifications from './CheckInNotifications';

// Import feature flags
import { isFeatureEnabled } from '../app/config/featureFlags';

const Tab = createBottomTabNavigator();

type TabBarIconProps = {
  focused: boolean;
  icon: React.ComponentType<{ size?: number; color?: string }>;
  solidIcon: React.ComponentType<{ size?: number; color?: string }>;
};

const TabBarIcon: React.FC<TabBarIconProps> = ({ focused, icon: Icon, solidIcon: SolidIcon }) => {
  return (
    <View style={styles.tabIconContainer}>
      {focused ? <SolidIcon size={28} color="#10B981" /> : <Icon size={28} color="#9CA3AF" />}
    </View>
  );
};

export default function FooterNavigation() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: { 
          backgroundColor: '#111827',
          borderTopWidth: 1,
          borderTopColor: '#1E293B',
          height: 70,
          paddingTop: 8,
          paddingBottom: 8,
        },
        tabBarActiveTintColor: '#10B981',
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
          marginTop: 4,
        },
      }}
    >
      {/* Dashboard - Show minimal home page */}
      {isFeatureEnabled('DASHBOARD') && (
        <Tab.Screen
          name="Home"
          component={HomeSummary}
          options={{
            tabBarLabel: 'Home',
            tabBarIcon: ({ focused }) => (
              <TabBarIcon 
                focused={focused} 
                icon={HomeIcon} 
                solidIcon={HomeIconSolid} 
              />
            ),
          }}
        />
      )}

      {/* Weekly Check-In Tab */}
      {isFeatureEnabled('WEEKLY_CHECKIN') && (
        <Tab.Screen 
          name="Checkin" 
          component={WeeklyCheckinScreen}
          options={{
            tabBarLabel: 'Checkin',
            tabBarIcon: ({ focused }) => (
              <TabBarIcon 
                focused={focused} 
                icon={ClipboardDocumentCheckIcon} 
                solidIcon={ClipboardDocumentCheckIconSolid} 
              />
            ),
          }}
        />
      )}

      {/* Notifications - Show check-in notifications */}
      {isFeatureEnabled('NOTIFICATIONS') && (
        <Tab.Screen 
          name="Notifications" 
          component={CheckInNotifications}
          options={{
            tabBarLabel: 'Notifications',
            tabBarIcon: ({ focused }) => (
              <TabBarIcon 
                focused={focused} 
                icon={BellIcon} 
                solidIcon={BellIconSolid} 
              />
            ),
          }}
        />
      )}
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});