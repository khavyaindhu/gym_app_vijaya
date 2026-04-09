import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { BellIcon, CheckCircleIcon } from 'react-native-heroicons/outline';
import { BellIcon as BellIconSolid } from 'react-native-heroicons/solid';

interface CheckInNotification {
  id: string;
  domain: string;
  emoji: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  daysRemaining: number;
}

export default function CheckInNotifications() {
  const [notifications, setNotifications] = useState<CheckInNotification[]>([
    {
      id: '1',
      domain: 'Physical Wellness',
      emoji: '🏃',
      message: 'Time to check in on your physical wellness progress',
      timestamp: 'Today at 9:00 AM',
      isRead: false,
      daysRemaining: 0,
    },
    {
      id: '2',
      domain: 'Nutrition',
      emoji: '🥗',
      message: 'Your weekly nutrition check-in is ready',
      timestamp: 'Today at 9:05 AM',
      isRead: false,
      daysRemaining: 0,
    },
    {
      id: '3',
      domain: 'Mental Health',
      emoji: '🧠',
      message: 'Mental wellness check-in available',
      timestamp: 'Today at 9:10 AM',
      isRead: true,
      daysRemaining: 0,
    },
    {
      id: '4',
      domain: 'Sleep',
      emoji: '😴',
      message: 'Review your sleep patterns this week',
      timestamp: 'Yesterday at 8:00 PM',
      isRead: true,
      daysRemaining: 1,
    },
    {
      id: '5',
      domain: 'Recovery',
      emoji: '🔄',
      message: 'Recovery and rest status check-in',
      timestamp: '2 days ago',
      isRead: true,
      daysRemaining: 2,
    },
  ]);

  const handleMarkAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(notif =>
        notif.id === id ? { ...notif, isRead: true } : notif
      )
    );
  };

  const handleOpenCheckin = (domain: string) => {
    Alert.alert(
      'Navigate to Check-In',
      `Open check-in for ${domain}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Open',
          onPress: () => {
            // Navigation would happen here
            Alert.alert('Success', `Opening ${domain} check-in form`);
          },
        },
      ]
    );
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const renderNotification = (notif: CheckInNotification) => (
    <TouchableOpacity
      key={notif.id}
      style={[
        styles.notificationCard,
        !notif.isRead && styles.notificationCardUnread,
      ]}
      onPress={() => handleOpenCheckin(notif.domain)}
    >
      <View style={styles.notificationLeft}>
        <Text style={styles.notificationEmoji}>{notif.emoji}</Text>
      </View>

      <View style={styles.notificationContent}>
        <Text style={styles.notificationDomain}>{notif.domain}</Text>
        <Text style={styles.notificationMessage}>{notif.message}</Text>
        <Text style={styles.notificationTime}>{notif.timestamp}</Text>
      </View>

      <TouchableOpacity
        style={styles.notificationAction}
        onPress={() => handleMarkAsRead(notif.id)}
      >
        {notif.isRead ? (
          <CheckCircleIcon size={24} color="#10B981" />
        ) : (
          <View style={styles.unreadDot} />
        )}
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <Text style={styles.headerTitle}>Notifications</Text>
            {unreadCount > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadBadgeText}>{unreadCount}</Text>
              </View>
            )}
          </View>
          <Text style={styles.headerSubtitle}>Weekly check-in reminders</Text>
        </View>

        {/* Empty State */}
        {notifications.length === 0 && (
          <View style={styles.emptyState}>
            <BellIcon size={48} color="#6B7280" />
            <Text style={styles.emptyStateTitle}>No Notifications</Text>
            <Text style={styles.emptyStateText}>
              You're all caught up! Check back soon for your next weekly check-in.
            </Text>
          </View>
        )}

        {/* Notifications List */}
        {notifications.length > 0 && (
          <View style={styles.notificationsList}>
            <Text style={styles.sectionTitle}>
              {unreadCount > 0
                ? `${unreadCount} unread check-in notification${unreadCount !== 1 ? 's' : ''}`
                : 'All notifications'}
            </Text>
            {notifications.map(renderNotification)}
          </View>
        )}

        {/* Info Box */}
        <View style={styles.infoBox}>
          <BellIconSolid size={20} color="#10B981" />
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>Complete Your Check-In</Text>
            <Text style={styles.infoText}>
              Tap any notification to open the check-in form for that domain. You'll be prompted to answer wellness questions.
            </Text>
          </View>
        </View>

        <View style={styles.spacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  unreadBadge: {
    backgroundColor: '#10B981',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  unreadBadgeText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  notificationsList: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9CA3AF',
    marginBottom: 12,
  },
  notificationCard: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderLeftWidth: 3,
    borderLeftColor: '#334155',
  },
  notificationCardUnread: {
    borderLeftColor: '#10B981',
    backgroundColor: 'rgba(16, 185, 129, 0.05)',
  },
  notificationLeft: {
    marginRight: 12,
  },
  notificationEmoji: {
    fontSize: 28,
  },
  notificationContent: {
    flex: 1,
  },
  notificationDomain: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  notificationMessage: {
    fontSize: 13,
    color: '#D1D5DB',
    marginBottom: 4,
  },
  notificationTime: {
    fontSize: 12,
    color: '#6B7280',
  },
  notificationAction: {
    marginLeft: 12,
  },
  unreadDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#10B981',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 20,
  },
  infoBox: {
    marginHorizontal: 20,
    marginVertical: 20,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    borderLeftWidth: 3,
    borderLeftColor: '#10B981',
  },
  infoContent: {
    flex: 1,
    marginLeft: 12,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#10B981',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 13,
    color: '#D1D5DB',
    lineHeight: 18,
  },
  spacer: {
    height: 100,
  },
});