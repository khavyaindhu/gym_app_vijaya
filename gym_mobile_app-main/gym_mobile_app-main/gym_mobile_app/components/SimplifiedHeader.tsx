import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { UserIcon } from 'react-native-heroicons/outline';
import { UserIcon as UserIconSolid } from 'react-native-heroicons/solid';

interface SimplifiedHeaderProps {
  title?: string;
  subtitle?: string;
}

export default function SimplifiedHeader({ title, subtitle }: SimplifiedHeaderProps) {
  const router = useRouter();
  const [isProfilePressed, setIsProfilePressed] = useState(false);

  const handleProfilePress = () => {
    setIsProfilePressed(true);
    router.push('/dashboards/user/ProfileSettings');
    setTimeout(() => setIsProfilePressed(false), 300);
  };

  return (
    <View style={styles.container}>
      {/* Left Section - HiWox Logo & Branding */}
      <View style={styles.leftSection}>
        <View style={styles.logoContainer}>
          <Text style={styles.logoText}>H</Text>
        </View>
        <View style={styles.brandingContainer}>
          <Text style={styles.appName}>HiWox</Text>
          <Text style={styles.appSubtitle}>User Portal</Text>
        </View>
      </View>

      {/* Right Section - Profile Icon Only */}
      <TouchableOpacity
        style={[
          styles.profileButton,
          isProfilePressed && styles.profileButtonPressed,
        ]}
        onPress={handleProfilePress}
        activeOpacity={0.7}
      >
        <UserIconSolid size={24} color="#10B981" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#1E293B',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  brandingContainer: {
    justifyContent: 'center',
  },
  appName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  appSubtitle: {
    fontSize: 11,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileButtonPressed: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
  },
});