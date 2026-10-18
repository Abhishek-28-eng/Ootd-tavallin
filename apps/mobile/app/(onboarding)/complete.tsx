// ============================================================
// Onboarding Step 6 — Complete & Submit Preferences
// ============================================================

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  STYLE_CATEGORY_LABELS,
  OCCASION_LABELS,
  COLOR_LABELS,
  CURRENCY_SYMBOLS,
  type SupportedCurrency,
  type UpdatePreferencesRequest,
  type UpdateProfileRequest,
  type AuthUser,
} from '@tavallin/shared';
import { Colors, Typography, Spacing, Radii } from '../../src/design/tokens';
import { useAuthStore } from '../../src/stores/authStore';
import { useOnboardingStore } from '../../src/stores/onboardingStore';
import { apiClient } from '../../src/lib/apiClient';

export default function CompleteScreen() {
  const router = useRouter();
  const { user, updateUser } = useAuthStore();
  const {
    displayName,
    bio,
    styleCategories,
    occasions,
    colorPreferences,
    budgetMin,
    budgetMax,
    currency,
    reset,
  } = useOnboardingStore();

  const [isSubmitting, setIsSubmitting] = useState(false);

  const symbol = CURRENCY_SYMBOLS[currency as SupportedCurrency] ?? '₹';

  const handleFinish = async () => {
    setIsSubmitting(true);
    try {
      // 1. Update Profile (display name & bio)
      const profileReq: UpdateProfileRequest = {};
      if (displayName.trim()) profileReq.displayName = displayName.trim();
      if (bio.trim()) profileReq.bio = bio.trim();

      if (Object.keys(profileReq).length > 0) {
        await apiClient.patch('/users/me', profileReq);
      }

      // 2. Update Style Preferences
      const prefsReq: UpdatePreferencesRequest = {
        styleCategories,
        occasions,
        colorPreferences,
        budgetMin,
        budgetMax,
        currency,
      };

      await apiClient.patch('/users/me/preferences', prefsReq);

      // 3. Mark user as onboarded on the server
      await apiClient.post('/users/me/onboard');

      // 4. Update local auth state
      const authUpdates: Partial<AuthUser> = { isOnboarded: true };
      const finalName = displayName.trim() || user?.displayName;
      if (finalName) authUpdates.displayName = finalName;
      updateUser(authUpdates);

      reset();
      router.replace('/(tabs)');
    } catch {
      // Try to mark onboarded even if preferences had a minor issue
      void apiClient.post('/users/me/onboard').catch(() => {});
      Alert.alert(
        'Setup Complete',
        'Welcome to Tavallin! Taking you to your personalized feed.',
        [
          {
            text: 'Continue',
            onPress: () => {
              updateUser({ isOnboarded: true });
              reset();
              router.replace('/(tabs)');
            },
          },
        ],
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.iconWrap}>
          <Text style={styles.sparkleIcon}>✦</Text>
        </View>

        <Text style={styles.title}>You are all set!</Text>
        <Text style={styles.subtitle}>
          Here is your personal fashion aesthetic profile, ready for exploration.
        </Text>

        {/* Summary Card */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>STYLIST PROFILE</Text>
            <Text style={styles.summaryValue}>{displayName || user?.displayName || user?.username}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>FAVORITE STYLES</Text>
            <Text style={styles.summaryValue}>
              {styleCategories.length > 0
                ? styleCategories.map((s) => STYLE_CATEGORY_LABELS[s] ?? s).join(', ')
                : 'All Styles'}
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>TOP OCCASIONS</Text>
            <Text style={styles.summaryValue}>
              {occasions.length > 0
                ? occasions.map((o) => OCCASION_LABELS[o] ?? o).join(', ')
                : 'Everyday & Casual'}
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>COLOR HARMONIES</Text>
            <Text style={styles.summaryValue}>
              {colorPreferences.length > 0
                ? colorPreferences.map((c) => COLOR_LABELS[c] ?? c).join(', ')
                : 'Neutrals & Tones'}
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>BUDGET RANGE</Text>
            <Text style={styles.summaryValue}>
              {budgetMin === 0
                ? 'Any Price'
                : `${symbol}${budgetMin.toLocaleString()} – ${symbol}${budgetMax.toLocaleString()}`}
            </Text>
          </View>
        </View>

        <Text style={styles.infoNote}>
          You can customize and update your style preferences at any time in Profile Settings.
        </Text>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.startBtn, isSubmitting && styles.startBtnDisabled]}
          onPress={handleFinish}
          disabled={isSubmitting}
          activeOpacity={0.88}
        >
          {isSubmitting ? (
            <ActivityIndicator color={Colors.warmWhite} />
          ) : (
            <Text style={styles.startBtnText}>Start Exploring Tavallin →</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.warmWhite,
  },
  scrollContent: {
    paddingHorizontal: Spacing[6],
    paddingTop: Spacing[6],
    paddingBottom: Spacing[10],
    alignItems: 'center',
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.charcoal,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing[4],
  },
  sparkleIcon: {
    fontSize: 28,
    color: Colors.warmWhite,
  },
  title: {
    fontFamily: Typography.fontDisplay,
    fontSize: Typography['3xl'],
    color: Colors.charcoal,
    marginBottom: Spacing[2],
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.base,
    color: Colors.textSecondary,
    marginBottom: Spacing[6],
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 320,
  },
  summaryCard: {
    width: '100%',
    backgroundColor: Colors.surface,
    borderRadius: Radii.lg,
    padding: Spacing[5],
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing[4],
  },
  summaryRow: {
    paddingVertical: Spacing[2],
  },
  summaryLabel: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.xs,
    letterSpacing: 1.5,
    color: Colors.textTertiary,
    fontWeight: '600',
    marginBottom: 4,
  },
  summaryValue: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.sm,
    fontWeight: '600',
    color: Colors.charcoal,
    lineHeight: 20,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginVertical: Spacing[2],
  },
  infoNote: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.xs,
    color: Colors.textTertiary,
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 300,
  },
  footer: {
    paddingHorizontal: Spacing[6],
    paddingVertical: Spacing[4],
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    backgroundColor: Colors.warmWhite,
  },
  startBtn: {
    backgroundColor: Colors.charcoal,
    paddingVertical: Spacing[4],
    borderRadius: Radii.md,
    alignItems: 'center',
  },
  startBtnDisabled: {
    opacity: 0.7,
  },
  startBtnText: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.base,
    fontWeight: '600',
    color: Colors.warmWhite,
    letterSpacing: 0.5,
  },
});
