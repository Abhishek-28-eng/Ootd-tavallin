// ============================================================
// Push Notifications Service — Expo Notifications Integration
// Handles permission requests, token registration & deep linking
// Safe fallback for Expo Go and environments without native modules
// ============================================================

import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { useRouter } from 'expo-router';
import { apiClient } from '../lib/apiClient';
import { useAuthStore } from '../stores/authStore';

// Detect Expo Go (remote push notifications require a development build since SDK 53)
const isExpoGo =
  Constants.appOwnership === 'expo' ||
  Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

let Notifications: any = null;

// Only load native module if not running inside Expo Go
if (!isExpoGo) {
  try {
    // Dynamic require so bundle evaluation never crashes in Expo Go
    Notifications = require('expo-notifications');
    if (Notifications && typeof Notifications.setNotificationHandler === 'function') {
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: true,
          shouldShowBanner: true,
          shouldShowList: true,
        }),
      });
    }
  } catch (err) {
    // Native module not present in current binary
    Notifications = null;
  }
}

/**
 * Register for push notifications and upload token to API server
 */
export async function registerForPushNotificationsAsync(): Promise<string | null> {
  if (isExpoGo || !Notifications) {
    return null;
  }

  let token: string | null = null;

  try {
    if (Platform.OS === 'android' && Notifications.setNotificationChannelAsync) {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#D4AF37',
      });
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      return null;
    }

    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ??
      Constants.easConfig?.projectId ??
      '';

    const tokenData = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined,
    );
    token = tokenData.data;

    if (token) {
      await apiClient.post('/notifications/device-token', {
        token,
        expoToken: token,
        platform: Platform.OS === 'ios' ? 'ios' : 'android',
      });
    }
  } catch (err) {
    // Graceful error handling
  }

  return token;
}

/**
 * Hook to initialize push notifications and handle navigation on tap
 */
export function usePushNotificationSetup() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const notificationListener = useRef<any>(null);
  const responseListener = useRef<any>(null);

  useEffect(() => {
    if (!user || isExpoGo || !Notifications) return;

    void registerForPushNotificationsAsync();

    try {
      notificationListener.current = Notifications.addNotificationReceivedListener(
        () => {},
      );

      responseListener.current = Notifications.addNotificationResponseReceivedListener(
        (response: any) => {
          const data = response?.notification?.request?.content?.data;
          if (data?.['deepLink'] && typeof data['deepLink'] === 'string') {
            router.push(data['deepLink'] as any);
          } else if (data?.['postId']) {
            router.push(`/outfit/${data['postId']}` as any);
          }
        },
      );
    } catch {}

    return () => {
      if (notificationListener.current?.remove) {
        notificationListener.current.remove();
      }
      if (responseListener.current?.remove) {
        responseListener.current.remove();
      }
    };
  }, [user, router]);
}
