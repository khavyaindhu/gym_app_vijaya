import { useFonts } from 'expo-font';
import { Stack, usePathname, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView, StyleSheet, View, ActivityIndicator, Text } from 'react-native';
import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import 'react-native-reanimated';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';

import { useColorScheme } from '@/hooks/useColorScheme';
import SimplifiedHeader from '@/components/SimplifiedHeader';
import { isFeatureEnabled } from './config/featureFlags';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const pathname = usePathname();
  const router = useRouter();
  
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const role = await AsyncStorage.getItem('userRole');
      
      if (token && role) {
        setIsAuthenticated(true);
        
        const publicScreens = ['/login', '/register', '/home', '/'];
        if (publicScreens.includes(pathname)) {
          const normalizedRole = role.toLowerCase();
          switch (normalizedRole) {
            case 'user':
              if (isFeatureEnabled('DASHBOARD')) {
                router.replace('/dashboards/user');
              } else {
                router.replace('/');
              }
              break;
            case 'consultant':
              router.replace('/dashboards/consultant');
              break;
            case 'admin':
              router.replace('/dashboards/admin');
              break;
            case 'superadmin':
            case 'super-admin':
              router.replace('/dashboards/super-admin');
              break;
            default:
              router.replace('/');
              break;
          }
        }
      } else {
        setIsAuthenticated(false);
        
        const protectedRoutes = ['/dashboards', '/questions'];
        const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
        
        if (isProtectedRoute) {
          router.replace('/login');
        }
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
      setIsAuthenticated(false);
      router.replace('/login');
    } finally {
      setIsAuthChecking(false);
    }
  };

  if (!loaded || isAuthChecking) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.loadingContent}>
          <Text style={styles.brandName}>HiWox</Text>
          <ActivityIndicator size="large" color="#10B981" style={styles.spinner} />
          <Text style={styles.loadingText}>
            {!loaded ? 'Loading fonts...' : 'Checking authentication...'}
          </Text>
        </View>
      </View>
    );
  }

  const hideHeaderScreens = ['/login', '/register', '/home'];
  const shouldShowHeader = !hideHeaderScreens.includes(pathname);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <SafeAreaView style={styles.container}>
        {shouldShowHeader && <SimplifiedHeader />}
        
        <View style={styles.content}>
          <Stack screenOptions={{ headerShown: false }}>
            {/* Auth Screens */}
            <Stack.Screen name="home" />
            <Stack.Screen name="login" />
            <Stack.Screen name="register" />

            {/* Tab navigation */}
            <Stack.Screen name="(tabs)" />

            {/* Dashboard screens - only register if enabled */}
            {isFeatureEnabled('DASHBOARD') && (
              <Stack.Screen name="dashboards/user" />
            )}

            {isFeatureEnabled('WEEKLY_CHECKIN') && (
              <Stack.Screen name="dashboards/user/WeeklyCheckinScreen" />
            )}

            {isFeatureEnabled('NOTIFICATIONS') && (
              <Stack.Screen name="dashboards/user/Notifications" />
            )}

            {/* Profile Settings - always available */}
            <Stack.Screen name="dashboards/user/ProfileSettings" />

            {/* Fallback */}
            <Stack.Screen name="+not-found" />
          </Stack>
        </View>
        
        <StatusBar style="auto" />
      </SafeAreaView>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  content: {
    flex: 1,
    backgroundColor: '#1e293b',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#111827',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContent: {
    alignItems: 'center',
  },
  brandName: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#10B981',
    marginBottom: 24,
  },
  spinner: {
    marginVertical: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#9CA3AF',
    marginTop: 16,
  },
});