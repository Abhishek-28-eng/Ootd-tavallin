// ============================================================
// Forgot Password Screen — OOTDi Luxury Account Recovery
// ============================================================

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { ForgotPasswordSchema } from '@tavallin/shared';
import type { ForgotPasswordInput } from '@tavallin/shared';
import { apiClient } from '../../src/lib/apiClient';
import { Colors, Typography, Spacing, Radii, Shadows } from '../../src/design/tokens';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [isFocused, setIsFocused] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(ForgotPasswordSchema),
    defaultValues: { email: '' },
  });

  const mutation = useMutation({
    mutationFn: async (data: ForgotPasswordInput) => {
      await apiClient.post('/auth/forgot-password', data);
    },
    onSuccess: () => {
      Alert.alert(
        'Check Your Email',
        'If an account exists with that email address, a password reset link has been dispatched.',
        [{ text: 'Return to Sign In', onPress: () => router.back() }],
      );
    },
    onError: () => {
      Alert.alert('Unable to Process', 'Please check your connection and try again.');
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        {/* Back navigation */}
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backBtn}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={20} color={Colors.charcoal} />
          <Text style={styles.backText}>Sign In</Text>
        </TouchableOpacity>

        <View style={styles.content}>
          {/* Gold Eyebrow */}
          <View style={styles.goldBadge}>
            <Text style={styles.goldBadgeText}>✦ ACCOUNT RECOVERY</Text>
          </View>

          {/* Title & Tagline */}
          <Text style={styles.title}>Reset Password</Text>
          <Text style={styles.subtitle}>
            Enter your registered email address. We will send an encrypted link to restore your lookbook credentials.
          </Text>

          {/* Form */}
          <View style={styles.fieldWrap}>
            <Text style={styles.inputLabel}>EMAIL ADDRESS</Text>
            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, value, onBlur } }) => (
                <View style={[styles.inputBox, isFocused && styles.inputBoxFocused, errors.email && styles.inputBoxError]}>
                  <Ionicons
                    name="mail-outline"
                    size={18}
                    color={isFocused ? Colors.gold : Colors.textPlaceholder}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.textInput}
                    placeholder="your@email.com"
                    placeholderTextColor={Colors.textPlaceholder}
                    value={value}
                    onChangeText={onChange}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => {
                      setIsFocused(false);
                      onBlur();
                    }}
                    autoCapitalize="none"
                    autoCorrect={false}
                    keyboardType="email-address"
                  />
                </View>
              )}
            />
            {errors.email && <Text style={styles.errorText}>{errors.email.message}</Text>}
          </View>

          {/* Submit CTA */}
          <TouchableOpacity
            style={[styles.submitBtn, mutation.isPending && styles.btnDisabled]}
            onPress={handleSubmit((d) => mutation.mutate(d))}
            disabled={mutation.isPending}
            activeOpacity={0.88}
          >
            {mutation.isPending ? (
              <ActivityIndicator color={Colors.warmWhite} size="small" />
            ) : (
              <>
                <Text style={styles.submitBtnText}>Send Reset Link</Text>
                <Ionicons name="arrow-forward" size={16} color={Colors.goldLight} />
              </>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.warmWhite,
    paddingHorizontal: Spacing[6],
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
    marginTop: Spacing[3],
    marginBottom: Spacing[4],
    alignSelf: 'flex-start',
    paddingVertical: Spacing[1],
  },
  backText: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.sm,
    fontWeight: '600',
    color: Colors.charcoal,
  },
  content: {
    flex: 1,
    paddingTop: Spacing[4],
  },
  goldBadge: {
    backgroundColor: Colors.goldDust,
    paddingHorizontal: Spacing[3],
    paddingVertical: 4,
    borderRadius: Radii.full,
    borderWidth: 1,
    borderColor: Colors.borderGold,
    alignSelf: 'flex-start',
    marginBottom: Spacing[4],
  },
  goldBadgeText: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.xs - 1,
    fontWeight: '800',
    letterSpacing: 1.5,
    color: Colors.textGold,
  },
  title: {
    fontFamily: Typography.fontDisplay,
    fontSize: Typography['3xl'],
    color: Colors.charcoal,
    lineHeight: Typography['3xl'] * 1.15,
    marginBottom: Spacing[2],
  },
  subtitle: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    lineHeight: Typography.sm * 1.6,
    marginBottom: Spacing[8],
  },
  fieldWrap: {
    marginBottom: Spacing[6],
  },
  inputLabel: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.xs - 1,
    fontWeight: '800',
    letterSpacing: 1.5,
    color: Colors.charcoal,
    marginBottom: Spacing[2],
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radii.lg,
    paddingHorizontal: Spacing[4],
    paddingVertical: Platform.OS === 'ios' ? Spacing[3] + 2 : Spacing[2],
    ...Shadows.sm,
  },
  inputBoxFocused: {
    borderColor: Colors.gold,
    backgroundColor: Colors.surfaceCard,
  },
  inputBoxError: {
    borderColor: Colors.error,
  },
  inputIcon: {
    marginRight: Spacing[3],
  },
  textInput: {
    flex: 1,
    fontFamily: Typography.fontBody,
    fontSize: Typography.base,
    color: Colors.charcoal,
  },
  errorText: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.xs,
    color: Colors.error,
    marginTop: Spacing[1],
  },
  submitBtn: {
    backgroundColor: Colors.charcoal,
    paddingVertical: Spacing[4],
    borderRadius: Radii.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing[2],
    ...Shadows.md,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.base,
    fontWeight: '700',
    color: Colors.warmWhite,
    letterSpacing: 0.5,
  },
});
