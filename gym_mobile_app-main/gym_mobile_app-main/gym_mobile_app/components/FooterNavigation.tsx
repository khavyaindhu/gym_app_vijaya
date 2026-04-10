import React, { useState, useEffect, useRef } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Animated,
  Easing,
} from 'react-native';
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
import { router } from 'expo-router';

// Import screens
import HomeSummary from '../app/dashboards/user/HomeSummary';
import WeeklyCheckinScreen from '../app/dashboards/user/WeeklyCheckinScreen';
import CheckInNotifications from './CheckInNotifications';

// Import feature flags
import { isFeatureEnabled } from '../app/config/featureFlags';

const Tab = createBottomTabNavigator();

// ─── Reminder interval: 2 minutes for demo ────────────────────────────────────
const REMINDER_INTERVAL_MS = 2 * 60 * 1000; // Change to 2 * 24 * 60 * 60 * 1000 for alternate days

type TabBarIconProps = {
  focused: boolean;
  icon: React.ComponentType<{ size?: number; color?: string }>;
  solidIcon: React.ComponentType<{ size?: number; color?: string }>;
};

const TabBarIcon: React.FC<TabBarIconProps> = ({ focused, icon: Icon, solidIcon: SolidIcon }) => (
  <View style={styles.tabIconContainer}>
    {focused ? <SolidIcon size={28} color="#10B981" /> : <Icon size={28} color="#9CA3AF" />}
  </View>
);

// ─── Check-In Reminder Modal ──────────────────────────────────────────────────
function CheckInReminderModal({
  visible,
  onDismiss,
  onGoToCheckin,
}: {
  visible: boolean;
  onDismiss: () => void;
  onGoToCheckin: () => void;
}) {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (visible) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.15,
            duration: 700,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 700,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [visible]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onDismiss}
    >
      {/* Dark overlay */}
      <View style={styles.overlay}>
        {/* Modal card */}
        <View style={styles.modalCard}>

          {/* Pulse bell icon */}
          <Animated.View style={[styles.bellCircle, { transform: [{ scale: pulseAnim }] }]}>
            <Text style={styles.bellEmoji}>🔔</Text>
          </Animated.View>

          {/* Title */}
          <Text style={styles.modalTitle}>Weekly Check-In Reminder</Text>

          {/* Message */}
          <Text style={styles.modalMessage}>
            It's time to fill in your weekly wellness check-in! 💪{'\n\n'}
            Track your progress across 9 important wellness domains and stay on top of your health journey.
          </Text>

          {/* Demo note banner */}
          <View style={styles.demoBanner}>
            <Text style={styles.demoBannerIcon}>⏰</Text>
            <Text style={styles.demoBannerText}>
              <Text style={styles.demoBannerBold}>Demo Mode: </Text>
              Reminder shown every 2 minutes.{'\n'}
              In production, this will appear every alternate day.
            </Text>
          </View>

          {/* Go to Check-In button */}
          <TouchableOpacity style={styles.btnPrimary} onPress={onGoToCheckin} activeOpacity={0.85}>
            <Text style={styles.btnPrimaryText}>✅  Fill Check-In Now</Text>
          </TouchableOpacity>

          {/* Dismiss button */}
          <TouchableOpacity style={styles.btnSecondary} onPress={onDismiss} activeOpacity={0.7}>
            <Text style={styles.btnSecondaryText}>Remind Me Later</Text>
          </TouchableOpacity>

        </View>
      </View>
    </Modal>
  );
}

// ─── Footer Navigation ────────────────────────────────────────────────────────
export default function FooterNavigation() {
  const [showReminder, setShowReminder] = useState(false);

  useEffect(() => {
    // Show first reminder after REMINDER_INTERVAL_MS, then repeat
    const interval = setInterval(() => {
      setShowReminder(true);
    }, REMINDER_INTERVAL_MS);

    return () => clearInterval(interval);
  }, []);

  const handleGoToCheckin = () => {
    setShowReminder(false);
    router.push('/dashboards/user/WeeklyCheckinScreen');
  };

  return (
    <View style={{ flex: 1 }}>
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
        {isFeatureEnabled('DASHBOARD') && (
          <Tab.Screen
            name="Home"
            component={HomeSummary}
            options={{
              tabBarLabel: 'Home',
              tabBarIcon: ({ focused }) => (
                <TabBarIcon focused={focused} icon={HomeIcon} solidIcon={HomeIconSolid} />
              ),
            }}
          />
        )}

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

        {isFeatureEnabled('NOTIFICATIONS') && (
          <Tab.Screen
            name="Notifications"
            component={CheckInNotifications}
            options={{
              tabBarLabel: 'Notifications',
              tabBarIcon: ({ focused }) => (
                <TabBarIcon focused={focused} icon={BellIcon} solidIcon={BellIconSolid} />
              ),
            }}
          />
        )}
      </Tab.Navigator>

      {/* Global reminder modal — floats over all tabs */}
      <CheckInReminderModal
        visible={showReminder}
        onDismiss={() => setShowReminder(false)}
        onGoToCheckin={handleGoToCheckin}
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  tabIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Overlay
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },

  // Modal card
  modalCard: {
    width: '100%',
    backgroundColor: '#1E293B',
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 12,
  },

  // Bell icon
  bellCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 2,
    borderColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  bellEmoji: {
    fontSize: 36,
  },

  // Title
  modalTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 12,
  },

  // Message
  modalMessage: {
    color: '#94A3B8',
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 20,
  },

  // Demo banner
  demoBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderWidth: 1,
    borderColor: '#F59E0B55',
    borderRadius: 12,
    padding: 12,
    marginBottom: 24,
    width: '100%',
  },
  demoBannerIcon: {
    fontSize: 16,
    marginRight: 8,
    marginTop: 1,
  },
  demoBannerText: {
    flex: 1,
    color: '#FCD34D',
    fontSize: 12,
    lineHeight: 18,
  },
  demoBannerBold: {
    fontWeight: '800',
    color: '#F59E0B',
  },

  // Primary button
  btnPrimary: {
    width: '100%',
    backgroundColor: '#10B981',
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: 'center',
    marginBottom: 12,
  },
  btnPrimaryText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },

  // Secondary button
  btnSecondary: {
    width: '100%',
    paddingVertical: 13,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  btnSecondaryText: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '600',
  },
});
