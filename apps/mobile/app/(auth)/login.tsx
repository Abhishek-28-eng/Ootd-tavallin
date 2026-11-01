// ============================================================
// Sign In — OOTDi Premium Editorial Entrance
// ============================================================

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { Ionicons, Feather } from '@expo/vector-icons';
import { LoginSchema } from '@tavallin/shared';
import type { LoginInput, LoginResponse } from '@tavallin/shared';
import { apiClient } from '../../src/lib/apiClient';
import { useAuthStore } from '../../src/stores/authStore';
import { Colors, Typography, Spacing, Radii, Shadows } from '../../src/design/tokens';
import type { ApiResponse } from '@tavallin/shared';

const { height: SH } = Dimensions.get('window');

export default function LoginScreen() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(LoginSchema),
    defaultValues: { email: '', password: '' },
  });

  const loginMutation = useMutation({
    mutationFn: async (data: LoginInput) => {
      const response = await apiClient.post<ApiResponse<LoginResponse>>('/auth/login', data);
      return response.data.data;
    },
    onSuccess: async (data) => {
      await setAuth(data.user, data.tokens.accessToken, data.tokens.refreshToken);
      if (data.user.isOnboarded) {
        router.replace('/(tabs)');
      } else if (data.user.displayName) {
        router.replace('/(onboarding)/style-preferences');
      } else {
        router.replace('/(onboarding)/display-name');
      }
    },
    onError: (error: unknown) => {
      const msg =
        (error as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error
          ?.message ?? 'Sign in failed. Please check your credentials.';
      Alert.alert('Sign In Failed', msg);
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ─── Top Accent Banner ─── */}
          <View style={styles.accentBanner}>
            <View style={styles.accentDecorCircle1} />
            <View style={styles.accentDecorCircle2} />
            <View style={styles.accentDecorLine} />

            {/* Back */}
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backBtn}
              activeOpacity={0.75}
            >
              <View style={styles.backPill}>
                <Ionicons name="arrow-back" size={17} color={Colors.charcoal} />
              </View>
            </TouchableOpacity>

            {/* Brand Masthead */}
            <View style={styles.masthead}>
              <Text style={styles.mastheadTitle}>Sign{'\n'}In</Text>
            </View>
          </View>

          {/* ─── Card Body ─── */}
          <View style={styles.card}>
            <Text style={styles.cardSubtitle}>
              Enter your credentials to access your curated lookbook and style archive.
            </Text>

            {/* ── Email ── */}
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>EMAIL ADDRESS</Text>
              <Controller
                control={control}
                name="email"
                render={({ field: { onChange, value, onBlur } }) => (
                  <View
                    style={[
                      styles.inputRow,
                      focusedField === 'email' && styles.inputRowFocused,
                      errors.email && styles.inputRowError,
                    ]}
                  >
                    <Feather
                      name="mail"
                      size={16}
                      color={
                        errors.email
                          ? Colors.error
                          : focusedField === 'email'
                          ? Colors.charcoal
                          : Colors.textTertiary
                      }
                      style={styles.inputIcon}
                    />
                    <TextInput
                      style={styles.input}
                      placeholder="your@email.com"
                      placeholderTextColor={Colors.textPlaceholder}
                      value={value}
                      onChangeText={onChange}
                      onBlur={() => { onBlur(); setFocusedField(null); }}
                      onFocus={() => setFocusedField('email')}
                      autoCapitalize="none"
                      keyboardType="email-address"
                      autoComplete="email"
                    />
                    {value.length > 0 && !errors.email && (
                      <Ionicons name="checkmark-circle" size={16} color={Colors.success} style={styles.inputTrail} />
                    )}
                  </View>
                )}
              />
              {errors.email && (
                <View style={styles.errorRow}>
                  <Ionicons name="alert-circle-outline" size={12} color={Colors.error} />
                  <Text style={styles.errorText}>{errors.email.message}</Text>
                </View>
              )}
            </View>

            {/* ── Password ── */}
            <View style={styles.field}>
              <View style={styles.fieldLabelRow}>
                <Text style={styles.fieldLabel}>PASSWORD</Text>
                <TouchableOpacity
                  onPress={() => router.push('/(auth)/forgot-password')}
                  activeOpacity={0.7}
                >
                  <Text style={styles.forgotLink}>Forgot?</Text>
                </TouchableOpacity>
              </View>
              <View
                style={[
                  styles.inputRow,
                  focusedField === 'password' && styles.inputRowFocused,
                  errors.password && styles.inputRowError,
                ]}
              >
                <Feather
                  name="lock"
                  size={16}
                  color={
                    errors.password
                      ? Colors.error
                      : focusedField === 'password'
                      ? Colors.charcoal
                      : Colors.textTertiary
                  }
                  style={styles.inputIcon}
                />
                <Controller
                  control={control}
                  name="password"
                  render={({ field: { onChange, value, onBlur } }) => (
                    <TextInput
                      style={[styles.input, styles.inputPw]}
                      placeholder="Enter your password"
                      placeholderTextColor={Colors.textPlaceholder}
                      value={value}
                      onChangeText={onChange}
                      onBlur={() => { onBlur(); setFocusedField(null); }}
                      onFocus={() => setFocusedField('password')}
                      secureTextEntry={!showPassword}
                      autoComplete="password"
                      returnKeyType="done"
                      onSubmitEditing={handleSubmit((d) => loginMutation.mutate(d))}
                    />
                  )}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeBtn}
                  activeOpacity={0.7}
                >
                  <Feather
                    name={showPassword ? 'eye-off' : 'eye'}
                    size={16}
                    color={Colors.textTertiary}
                  />
                </TouchableOpacity>
              </View>
              {errors.password && (
                <View style={styles.errorRow}>
                  <Ionicons name="alert-circle-outline" size={12} color={Colors.error} />
                  <Text style={styles.errorText}>{errors.password.message}</Text>
                </View>
              )}
            </View>

            {/* ── Submit ── */}
            <TouchableOpacity
              style={[styles.submitBtn, loginMutation.isPending && styles.submitBtnDisabled]}
              onPress={handleSubmit((d) => loginMutation.mutate(d))}
              disabled={loginMutation.isPending}
              activeOpacity={0.88}
            >
              {loginMutation.isPending ? (
                <ActivityIndicator color={Colors.warmWhite} />
              ) : (
                <>
                  <Text style={styles.submitBtnText}>Sign In to OOTDi</Text>
                  <View style={styles.submitArrowWrap}>
                    <Ionicons name="arrow-forward" size={16} color={Colors.charcoal} />
                  </View>
                </>
              )}
            </TouchableOpacity>

            {/* ── Divider + Register ── */}
            <View style={styles.altSection}>
              <View style={styles.dividerRow}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerLabel}>New to OOTDi?</Text>
                <View style={styles.dividerLine} />
              </View>

              <TouchableOpacity
                style={styles.altBtn}
                onPress={() => router.replace('/(auth)/register')}
                activeOpacity={0.85}
              >
                <Text style={styles.altBtnText}>Create an Account</Text>
                <Ionicons name="person-add-outline" size={15} color={Colors.charcoal} />
              </TouchableOpacity>
            </View>
          </View>

          {/* ─── Bottom Tagline ─── */}
          <Text style={styles.bottomTagline}>
            Your style. Your story. Your identity.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.warmWhite,
  },
  scroll: {
    flexGrow: 1,
    paddingBottom: Spacing[10],
  },

  // ─── Accent Banner ────────────────────────────────────────
  accentBanner: {
    backgroundColor: '#F5EFE6',
    paddingHorizontal: Spacing[6],
    paddingTop: Spacing[5],
    paddingBottom: Spacing[8],
    position: 'relative',
    overflow: 'hidden',
    minHeight: SH * 0.3,
    justifyContent: 'flex-end',
  },
  accentDecorCircle1: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
    borderWidth: 1,
    borderColor: 'rgba(201,168,76,0.2)',
    top: -100,
    right: -80,
  },
  accentDecorCircle2: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 1,
    borderColor: 'rgba(201,168,76,0.12)',
    top: -20,
    right: 40,
  },
  accentDecorLine: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(201,168,76,0.25)',
  },

  backBtn: {
    position: 'absolute',
    top: Spacing[5],
    left: Spacing[5],
    zIndex: 10,
  },
  backPill: {
    width: 38,
    height: 38,
    borderRadius: Radii.full,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.xs,
  },

  masthead: {
    gap: Spacing[2],
  },
  mastheadEyebrow: {
    fontFamily: Typography.fontBody,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 2,
    color: Colors.gold,
  },
  mastheadTitle: {
    fontFamily: Typography.fontDisplay,
    fontSize: 54,
    fontWeight: '500',
    color: Colors.charcoal,
    lineHeight: 54 * 1.0,
    letterSpacing: -1,
  },

  // ─── Card Body ────────────────────────────────────────────
  card: {
    backgroundColor: Colors.warmWhite,
    paddingHorizontal: Spacing[6],
    paddingTop: Spacing[7],
    paddingBottom: Spacing[2],
  },
  cardSubtitle: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    lineHeight: Typography.sm * 1.6,
    marginBottom: Spacing[7],
    fontStyle: 'italic',
  },

  // ─── Fields ───────────────────────────────────────────────
  field: {
    marginBottom: Spacing[5],
  },
  fieldLabel: {
    fontFamily: Typography.fontBody,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
    color: Colors.textSecondary,
    marginBottom: Spacing[2],
  },
  fieldLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing[2],
  },
  forgotLink: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.xs,
    fontWeight: '700',
    color: Colors.textGold,
    letterSpacing: 0.3,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: Radii.lg,
    overflow: 'hidden',
    ...Shadows.xs,
  },
  inputRowFocused: {
    borderColor: Colors.charcoal,
    backgroundColor: Colors.warmWhite,
  },
  inputRowError: {
    borderColor: Colors.error,
    backgroundColor: Colors.errorLight,
  },
  inputIcon: {
    paddingLeft: Spacing[4],
  },
  inputTrail: {
    paddingRight: Spacing[3],
  },
  input: {
    flex: 1,
    fontFamily: Typography.fontBody,
    fontSize: Typography.base,
    color: Colors.charcoal,
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[4],
  },
  inputPw: {
    paddingRight: Spacing[1],
  },
  eyeBtn: {
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[4],
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: Spacing[1] + 2,
  },
  errorText: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.xs,
    color: Colors.error,
  },

  // ─── Submit ───────────────────────────────────────────────
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.charcoal,
    paddingVertical: Spacing[4],
    borderRadius: Radii.lg,
    marginTop: Spacing[2],
    gap: Spacing[3],
    ...Shadows.md,
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.base,
    fontWeight: '700',
    color: Colors.warmWhite,
    letterSpacing: 0.5,
  },
  submitArrowWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ─── Alt Action ───────────────────────────────────────────
  altSection: {
    marginTop: Spacing[8],
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
    marginBottom: Spacing[4],
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.borderLight,
  },
  dividerLabel: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.xs,
    color: Colors.textTertiary,
    letterSpacing: 0.3,
  },
  altBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing[2],
    backgroundColor: Colors.softGray,
    paddingVertical: Spacing[4],
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  altBtnText: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.base,
    fontWeight: '600',
    color: Colors.charcoal,
  },

  // ─── Bottom Tagline ───────────────────────────────────────
  bottomTagline: {
    fontFamily: Typography.fontDisplay,
    fontSize: Typography.sm,
    fontStyle: 'italic',
    color: Colors.textTertiary,
    textAlign: 'center',
    marginTop: Spacing[8],
    letterSpacing: 0.3,
  },
});
