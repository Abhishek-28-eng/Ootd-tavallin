// ============================================================
// Create Account — OOTDi Premium Editorial Enrolment
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
import { RegisterSchema } from '@tavallin/shared';
import type { RegisterInput, RegisterResponse } from '@tavallin/shared';
import { apiClient } from '../../src/lib/apiClient';
import { useAuthStore } from '../../src/stores/authStore';
import { Colors, Typography, Spacing, Radii, Shadows } from '../../src/design/tokens';
import type { ApiResponse } from '@tavallin/shared';

const { height: SH } = Dimensions.get('window');

// ─── Step Indicators ─────────────────────────────────────────
const STEPS = ['Identity', 'Access', 'Confirm'];

export default function RegisterScreen() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(RegisterSchema),
    defaultValues: { email: '', username: '', displayName: '', password: '' },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: RegisterInput) => {
      const response = await apiClient.post<ApiResponse<RegisterResponse>>('/auth/register', data);
      return response.data.data;
    },
    onSuccess: async (data) => {
      await setAuth(data.user, data.tokens.accessToken, data.tokens.refreshToken);
      if (!data.user.isOnboarded) {
        router.replace('/(onboarding)/style-preferences');
      } else {
        router.replace('/(tabs)');
      }
    },
    onError: (error: unknown) => {
      const msg =
        (error as { response?: { data?: { error?: { message?: string } } } })?.response?.data
          ?.error?.message ?? 'Registration failed. Please try again.';
      Alert.alert('Registration Failed', msg);
    },
  });

  const onSubmit = (data: RegisterInput) => {
    registerMutation.mutate(data);
  };

  const FieldError = ({ msg }: { msg?: string | undefined }) =>
    msg ? (
      <View style={styles.errorRow}>
        <Ionicons name="alert-circle-outline" size={12} color={Colors.error} />
        <Text style={styles.errorText}>{msg}</Text>
      </View>
    ) : null;

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ─── Top Accent Banner ─── */}
          <View style={styles.accentBanner}>
            {/* Decor Circles */}
            <View style={styles.decorCircleOuter} />
            <View style={styles.decorCircleInner} />
            <View style={styles.decorArcLeft} />
            <View style={styles.accentDecorLine} />

            {/* Back */}
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.75}>
              <View style={styles.backPill}>
                <Ionicons name="arrow-back" size={17} color={Colors.charcoal} />
              </View>
            </TouchableOpacity>

            {/* Masthead */}
            <View style={styles.masthead}>
              <Text style={styles.mastheadTitle}>Create{'\n'}Account</Text>
            </View>
          </View>

          {/* ─── Step Rail ─── */}
          <View style={styles.stepRail}>
            {STEPS.map((s, i) => (
              <React.Fragment key={s}>
                <View style={styles.stepItem}>
                  <View style={[styles.stepDot, i === 0 && styles.stepDotActive]}>
                    {i === 0 ? (
                      <Ionicons name="person-outline" size={11} color={Colors.warmWhite} />
                    ) : (
                      <Text style={styles.stepDotNum}>{i + 1}</Text>
                    )}
                  </View>
                  <Text style={[styles.stepLabel, i === 0 && styles.stepLabelActive]}>{s}</Text>
                </View>
                {i < STEPS.length - 1 && <View style={styles.stepConnector} />}
              </React.Fragment>
            ))}
          </View>

          {/* ─── Card Body ─── */}
          <View style={styles.card}>
            <Text style={styles.cardSubtitle}>
              Build your fashion identity. Upload looks, get feedback, discover styles.
            </Text>

            {/* ── Section Header: Identity ── */}
            <View style={styles.sectionHeader}>
              <View style={styles.sectionPip} />
              <Text style={styles.sectionTitle}>IDENTITY</Text>
            </View>

            {/* ── Display Name + Username (two-col) ── */}
            <View style={styles.twoCol}>
              {/* Display Name */}
              <View style={[styles.field, styles.colField]}>
                <Text style={styles.fieldLabel}>DISPLAY NAME</Text>
                <Controller
                  control={control}
                  name="displayName"
                  render={({ field: { onChange, value, onBlur } }) => (
                    <View
                      style={[
                        styles.inputRow,
                        focusedField === 'displayName' && styles.inputRowFocused,
                        errors.displayName && styles.inputRowError,
                      ]}
                    >
                      <Feather
                        name="user"
                        size={14}
                        color={errors.displayName ? Colors.error : focusedField === 'displayName' ? Colors.charcoal : Colors.textTertiary}
                        style={styles.inputIcon}
                      />
                      <TextInput
                        style={styles.input}
                        placeholder="Your name"
                        placeholderTextColor={Colors.textPlaceholder}
                        value={value}
                        onChangeText={onChange}
                        onBlur={() => { onBlur(); setFocusedField(null); }}
                        onFocus={() => setFocusedField('displayName')}
                        autoCapitalize="words"
                        returnKeyType="next"
                      />
                    </View>
                  )}
                />
                <FieldError msg={errors.displayName?.message} />
              </View>

              {/* Username */}
              <View style={[styles.field, styles.colField]}>
                <Text style={styles.fieldLabel}>USERNAME</Text>
                <Controller
                  control={control}
                  name="username"
                  render={({ field: { onChange, value, onBlur } }) => (
                    <View
                      style={[
                        styles.inputRow,
                        focusedField === 'username' && styles.inputRowFocused,
                        errors.username && styles.inputRowError,
                      ]}
                    >
                      <Text style={[styles.atSign, focusedField === 'username' && styles.atSignFocused]}>@</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="handle"
                        placeholderTextColor={Colors.textPlaceholder}
                        value={value}
                        onChangeText={onChange}
                        onBlur={() => { onBlur(); setFocusedField(null); }}
                        onFocus={() => setFocusedField('username')}
                        autoCapitalize="none"
                        autoCorrect={false}
                        returnKeyType="next"
                      />
                    </View>
                  )}
                />
                <FieldError msg={errors.username?.message} />
              </View>
            </View>

            {/* ── Section Header: Access ── */}
            <View style={[styles.sectionHeader, { marginTop: Spacing[2] }]}>
              <View style={styles.sectionPip} />
              <Text style={styles.sectionTitle}>ACCESS</Text>
            </View>

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
                      size={15}
                      color={errors.email ? Colors.error : focusedField === 'email' ? Colors.charcoal : Colors.textTertiary}
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
                      returnKeyType="next"
                    />
                    {value.length > 4 && !errors.email && (
                      <Ionicons name="checkmark-circle" size={15} color={Colors.success} style={styles.inputTrail} />
                    )}
                  </View>
                )}
              />
              <FieldError msg={errors.email?.message} />
            </View>

            {/* ── Password ── */}
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>PASSWORD</Text>
              <View
                style={[
                  styles.inputRow,
                  focusedField === 'password' && styles.inputRowFocused,
                  errors.password && styles.inputRowError,
                ]}
              >
                <Feather
                  name="lock"
                  size={15}
                  color={errors.password ? Colors.error : focusedField === 'password' ? Colors.charcoal : Colors.textTertiary}
                  style={styles.inputIcon}
                />
                <Controller
                  control={control}
                  name="password"
                  render={({ field: { onChange, value, onBlur } }) => (
                    <TextInput
                      style={[styles.input, styles.inputPw]}
                      placeholder="Min 8 chars, 1 upper & 1 number"
                      placeholderTextColor={Colors.textPlaceholder}
                      value={value}
                      onChangeText={onChange}
                      onBlur={() => { onBlur(); setFocusedField(null); }}
                      onFocus={() => setFocusedField('password')}
                      secureTextEntry={!showPassword}
                      autoComplete="new-password"
                      returnKeyType="done"
                      onSubmitEditing={handleSubmit(onSubmit)}
                    />
                  )}
                />
                <TouchableOpacity
                  style={styles.eyeBtn}
                  onPress={() => setShowPassword(!showPassword)}
                  activeOpacity={0.7}
                >
                  <Feather name={showPassword ? 'eye-off' : 'eye'} size={15} color={Colors.textTertiary} />
                </TouchableOpacity>
              </View>
              <FieldError msg={errors.password?.message} />

              {/* Password hint */}
              <View style={styles.pwHint}>
                <Ionicons name="shield-checkmark-outline" size={11} color={Colors.textTertiary} />
                <Text style={styles.pwHintText}>Your data is encrypted and never shared</Text>
              </View>
            </View>

            {/* ── Submit ── */}
            <TouchableOpacity
              style={[styles.submitBtn, registerMutation.isPending && styles.submitBtnDisabled]}
              onPress={handleSubmit(onSubmit)}
              disabled={registerMutation.isPending}
              activeOpacity={0.88}
            >
              {registerMutation.isPending ? (
                <ActivityIndicator color={Colors.warmWhite} />
              ) : (
                <>
                  <Text style={styles.submitBtnText}>Join OOTDi</Text>
                  <View style={styles.submitArrowWrap}>
                    <Ionicons name="arrow-forward" size={16} color={Colors.charcoal} />
                  </View>
                </>
              )}
            </TouchableOpacity>

            {/* ── Terms note ── */}
            <Text style={styles.termsNote}>
              By joining you agree to our{' '}
              <Text style={styles.termsLink}>Terms of Service</Text>
              {' '}and{' '}
              <Text style={styles.termsLink}>Privacy Policy</Text>
            </Text>

            {/* ── Already have account ── */}
            <View style={styles.altSection}>
              <View style={styles.dividerRow}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerLabel}>Already curating?</Text>
                <View style={styles.dividerLine} />
              </View>

              <TouchableOpacity
                style={styles.altBtn}
                onPress={() => router.replace('/(auth)/login')}
                activeOpacity={0.85}
              >
                <Ionicons name="log-in-outline" size={15} color={Colors.charcoal} />
                <Text style={styles.altBtnText}>Sign In</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* ─── Bottom Tagline ─── */}
          <Text style={styles.bottomTagline}>
            Curate. Express. Inspire.
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
    backgroundColor: '#EDE7DA',
    paddingHorizontal: Spacing[6],
    paddingTop: Spacing[5],
    paddingBottom: Spacing[8],
    position: 'relative',
    overflow: 'hidden',
    minHeight: SH * 0.28,
    justifyContent: 'flex-end',
  },
  decorCircleOuter: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    borderWidth: 1,
    borderColor: 'rgba(201,168,76,0.18)',
    top: -130,
    right: -100,
  },
  decorCircleInner: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 1,
    borderColor: 'rgba(201,168,76,0.1)',
    top: -40,
    right: 40,
  },
  decorArcLeft: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 1,
    borderColor: 'rgba(201,168,76,0.12)',
    bottom: -40,
    left: -30,
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
    fontSize: 50,
    fontWeight: '500',
    color: Colors.charcoal,
    lineHeight: 50,
    letterSpacing: -0.5,
  },

  // ─── Step Rail ────────────────────────────────────────────
  stepRail: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing[6],
    paddingVertical: Spacing[4],
    backgroundColor: Colors.warmWhite,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  stepItem: {
    alignItems: 'center',
    gap: 4,
  },
  stepDot: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDotActive: {
    backgroundColor: Colors.charcoal,
  },
  stepDotNum: {
    fontFamily: Typography.fontBody,
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textTertiary,
  },
  stepLabel: {
    fontFamily: Typography.fontBody,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.8,
    color: Colors.textTertiary,
  },
  stepLabelActive: {
    color: Colors.charcoal,
  },
  stepConnector: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.borderLight,
    marginHorizontal: Spacing[2],
    marginBottom: Spacing[4],
  },

  // ─── Card Body ────────────────────────────────────────────
  card: {
    backgroundColor: Colors.warmWhite,
    paddingHorizontal: Spacing[6],
    paddingTop: Spacing[6],
    paddingBottom: Spacing[2],
  },
  cardSubtitle: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    lineHeight: Typography.sm * 1.6,
    marginBottom: Spacing[6],
    fontStyle: 'italic',
  },

  // ─── Section Headers ──────────────────────────────────────
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
    marginBottom: Spacing[4],
  },
  sectionPip: {
    width: 3,
    height: 14,
    borderRadius: 2,
    backgroundColor: Colors.gold,
  },
  sectionTitle: {
    fontFamily: Typography.fontBody,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 2,
    color: Colors.textSecondary,
  },

  // ─── Two-Col ──────────────────────────────────────────────
  twoCol: {
    flexDirection: 'row',
    gap: Spacing[3],
  },
  colField: {
    flex: 1,
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
    paddingLeft: Spacing[3],
  },
  inputTrail: {
    paddingRight: Spacing[3],
  },
  atSign: {
    paddingLeft: Spacing[3],
    fontFamily: Typography.fontBody,
    fontSize: Typography.base,
    fontWeight: '700',
    color: Colors.textTertiary,
  },
  atSignFocused: {
    color: Colors.gold,
  },
  input: {
    flex: 1,
    fontFamily: Typography.fontBody,
    fontSize: Typography.base,
    color: Colors.charcoal,
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[3] + 2,
  },
  inputPw: {
    paddingRight: Spacing[1],
  },
  eyeBtn: {
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[3] + 2,
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

  // ─── Password Hint ────────────────────────────────────────
  pwHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: Spacing[2],
  },
  pwHintText: {
    fontFamily: Typography.fontBody,
    fontSize: 11,
    color: Colors.textTertiary,
    fontStyle: 'italic',
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

  // ─── Terms ────────────────────────────────────────────────
  termsNote: {
    fontFamily: Typography.fontBody,
    fontSize: 11,
    color: Colors.textTertiary,
    textAlign: 'center',
    marginTop: Spacing[3],
    lineHeight: 16,
  },
  termsLink: {
    color: Colors.textGold,
    fontWeight: '600',
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
    letterSpacing: 0.5,
  },
});
