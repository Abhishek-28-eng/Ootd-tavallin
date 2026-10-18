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
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { RegisterSchema } from '@tavallin/shared';
import type { RegisterInput, RegisterResponse } from '@tavallin/shared';
import { apiClient } from '../../src/lib/apiClient';
import { useAuthStore } from '../../src/stores/authStore';
import { Colors, Typography, Spacing } from '../../src/design/tokens';
import type { ApiResponse } from '@tavallin/shared';

export default function RegisterScreen() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);

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

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Back */}
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Create your{'\n'}account</Text>
            <Text style={styles.subtitle}>Join the Tavallin fashion community</Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {/* Display Name */}
            <View style={styles.fieldWrapper}>
              <Text style={styles.label}>Display Name</Text>
              <Controller
                control={control}
                name="displayName"
                render={({ field: { onChange, value, onBlur } }) => (
                  <TextInput
                    style={[styles.input, errors.displayName && styles.inputError]}
                    placeholder="Your name"
                    placeholderTextColor={Colors.textPlaceholder}
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    autoCapitalize="words"
                    returnKeyType="next"
                  />
                )}
              />
              {errors.displayName && (
                <Text style={styles.errorText}>{errors.displayName.message}</Text>
              )}
            </View>

            {/* Username */}
            <View style={styles.fieldWrapper}>
              <Text style={styles.label}>Username</Text>
              <Controller
                control={control}
                name="username"
                render={({ field: { onChange, value, onBlur } }) => (
                  <TextInput
                    style={[styles.input, errors.username && styles.inputError]}
                    placeholder="@username"
                    placeholderTextColor={Colors.textPlaceholder}
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    autoCapitalize="none"
                    autoCorrect={false}
                    returnKeyType="next"
                  />
                )}
              />
              {errors.username && (
                <Text style={styles.errorText}>{errors.username.message}</Text>
              )}
            </View>

            {/* Email */}
            <View style={styles.fieldWrapper}>
              <Text style={styles.label}>Email</Text>
              <Controller
                control={control}
                name="email"
                render={({ field: { onChange, value, onBlur } }) => (
                  <TextInput
                    style={[styles.input, errors.email && styles.inputError]}
                    placeholder="your@email.com"
                    placeholderTextColor={Colors.textPlaceholder}
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    autoComplete="email"
                    returnKeyType="next"
                  />
                )}
              />
              {errors.email && (
                <Text style={styles.errorText}>{errors.email.message}</Text>
              )}
            </View>

            {/* Password */}
            <View style={styles.fieldWrapper}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.passwordRow}>
                <Controller
                  control={control}
                  name="password"
                  render={({ field: { onChange, value, onBlur } }) => (
                    <TextInput
                      style={[styles.input, styles.passwordInput, errors.password && styles.inputError]}
                      placeholder="Minimum 8 characters"
                      placeholderTextColor={Colors.textPlaceholder}
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      secureTextEntry={!showPassword}
                      autoComplete="new-password"
                      returnKeyType="done"
                      onSubmitEditing={handleSubmit(onSubmit)}
                    />
                  )}
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Text style={styles.eyeText}>{showPassword ? 'Hide' : 'Show'}</Text>
                </TouchableOpacity>
              </View>
              {errors.password && (
                <Text style={styles.errorText}>{errors.password.message}</Text>
              )}
              <Text style={styles.passwordHint}>
                Must include uppercase, lowercase, and a number
              </Text>
            </View>

            {/* Submit */}
            <TouchableOpacity
              style={[styles.submitButton, registerMutation.isPending && styles.submitDisabled]}
              onPress={handleSubmit(onSubmit)}
              disabled={registerMutation.isPending}
              activeOpacity={0.85}
            >
              {registerMutation.isPending ? (
                <ActivityIndicator color={Colors.warmWhite} />
              ) : (
                <Text style={styles.submitText}>Create Account</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Login link */}
          <TouchableOpacity
            style={styles.loginLink}
            onPress={() => router.replace('/(auth)/login')}
          >
            <Text style={styles.loginLinkText}>
              Already have an account? <Text style={styles.loginLinkBold}>Sign In</Text>
            </Text>
          </TouchableOpacity>
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
  scrollContent: {
    paddingHorizontal: Spacing[6],
    paddingTop: Spacing[4],
    paddingBottom: Spacing[10],
  },
  backButton: {
    marginBottom: Spacing[6],
  },
  backText: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.sm,
    color: Colors.textSecondary,
  },
  header: {
    marginBottom: Spacing[8],
  },
  title: {
    fontFamily: Typography.fontDisplay,
    fontSize: Typography['3xl'],
    fontWeight: '500',
    color: Colors.charcoal,
    lineHeight: Typography['3xl'] * 1.15,
    marginBottom: Spacing[2],
  },
  subtitle: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.sm,
    color: Colors.textSecondary,
  },
  form: {
    gap: Spacing[1],
  },
  fieldWrapper: {
    marginBottom: Spacing[5],
  },
  label: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.sm,
    fontWeight: '500',
    color: Colors.charcoal,
    marginBottom: Spacing[2],
  },
  input: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.base,
    color: Colors.charcoal,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Spacing[2],
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[3] + 2,
    backgroundColor: Colors.surface,
  },
  inputError: {
    borderColor: Colors.error,
  },
  passwordRow: {
    position: 'relative',
  },
  passwordInput: {
    paddingRight: Spacing[12],
  },
  eyeButton: {
    position: 'absolute',
    right: Spacing[4],
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  eyeText: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  errorText: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.xs,
    color: Colors.error,
    marginTop: Spacing[1],
  },
  passwordHint: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.xs,
    color: Colors.textTertiary,
    marginTop: Spacing[1],
  },
  submitButton: {
    backgroundColor: Colors.charcoal,
    paddingVertical: Spacing[4],
    borderRadius: Spacing[2],
    alignItems: 'center',
    marginTop: Spacing[2],
  },
  submitDisabled: {
    opacity: 0.65,
  },
  submitText: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.base,
    fontWeight: '600',
    color: Colors.warmWhite,
    letterSpacing: Typography.letterSpacingWide,
  },
  loginLink: {
    marginTop: Spacing[6],
    alignItems: 'center',
  },
  loginLinkText: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.sm,
    color: Colors.textSecondary,
  },
  loginLinkBold: {
    color: Colors.charcoal,
    fontWeight: '600',
  },
});
