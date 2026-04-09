import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView } from 'react-native';

export default function SimpleDashboard() {
  const today = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.greeting}>Good Morning! 👋</Text>
          <Text style={styles.date}>{today}</Text>
          <Text style={styles.subtitle}>Ready for your weekly check-in?</Text>
        </View>

        {/* Quick Message */}
        <View style={styles.messageBox}>
          <Text style={styles.messageTitle}>Welcome to HiWox</Text>
          <Text style={styles.messageText}>
            Keep track of your wellness journey with our weekly check-in forms covering 9 important domains.
          </Text>
        </View>

        {/* Navigation Hint */}
        <View style={styles.hintBox}>
          <Text style={styles.hintTitle}>��� Next Step</Text>
          <Text style={styles.hintText}>
            Tap on the "Checkin" tab below to start your weekly wellness assessment.
          </Text>
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
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  header: {
    marginBottom: 24,
  },
  greeting: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  date: {
    fontSize: 14,
    color: '#9CA3AF',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#D1D5DB',
  },
  messageBox: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#10B981',
  },
  messageTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#10B981',
    marginBottom: 8,
  },
  messageText: {
    fontSize: 14,
    color: '#D1D5DB',
    lineHeight: 20,
  },
  hintBox: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
  },
  hintTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#3B82F6',
    marginBottom: 8,
  },
  hintText: {
    fontSize: 14,
    color: '#D1D5DB',
    lineHeight: 20,
  },
  spacer: {
    height: 100,
  },
});