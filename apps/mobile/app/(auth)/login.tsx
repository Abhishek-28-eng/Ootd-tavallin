import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { LoginSchema } from '@tavallin/shared';
import type { LoginInput, LoginResponse } from '@tavallin/shared';
import { apiClient } from '../../src/lib/apiClient';
import { useAuthStore } from '../../src/stores/authStore';
import { Colors, Typography, Spacing } from '../../src/design/tokens';
import type { ApiResponse } from '@tavallin/shared';

export default function LoginScreen() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const { control, handleSubmit, formState: { errors } } = useForm<LoginInput>({
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
      const msg = (error as {response?: {data?: {error?: {message?: string}}}})?.response?.data?.error?.message ?? 'Login failed.';
      Alert.alert('Sign In Failed', msg);
    },
  });
  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}><Text style={styles.backText}>← Back</Text></TouchableOpacity>
          <View style={styles.header}>
            <Text style={styles.title}>Welcome{'\n'}back</Text>
            <Text style={styles.subtitle}>Sign in to your Tavallin account</Text>
          </View>
          <View style={styles.form}>
            <View style={styles.field}>
              <Text style={styles.label}>Email</Text>
              <Controller control={control} name="email" render={({ field: { onChange, value, onBlur } }) => (
                <TextInput style={[styles.input, errors.email && styles.inputError]} placeholder="your@email.com" placeholderTextColor={Colors.textPlaceholder} value={value} onChangeText={onChange} onBlur={onBlur} autoCapitalize="none" keyboardType="email-address" autoComplete="email" />
              )} />
              {errors.email && <Text style={styles.err}>{errors.email.message}</Text>}
            </View>
            <View style={styles.field}>
              <View style={styles.labelRow}><Text style={styles.label}>Password</Text><TouchableOpacity onPress={() => router.push('/(auth)/forgot-password')}><Text style={styles.forgotText}>Forgot?</Text></TouchableOpacity></View>
              <View style={styles.pwRow}>
                <Controller control={control} name="password" render={({ field: { onChange, value, onBlur } }) => (
                  <TextInput style={[styles.input, styles.pwInput, errors.password && styles.inputError]} placeholder="Password" placeholderTextColor={Colors.textPlaceholder} value={value} onChangeText={onChange} onBlur={onBlur} secureTextEntry={!showPassword} autoComplete="password" returnKeyType="done" onSubmitEditing={handleSubmit((d) => loginMutation.mutate(d))} />
                )} />
                <TouchableOpacity style={styles.eye} onPress={() => setShowPassword(!showPassword)}><Text style={styles.eyeText}>{showPassword ? 'Hide' : 'Show'}</Text></TouchableOpacity>
              </View>
              {errors.password && <Text style={styles.err}>{errors.password.message}</Text>}
            </View>
            <TouchableOpacity style={[styles.btn, loginMutation.isPending && styles.btnDisabled]} onPress={handleSubmit((d) => loginMutation.mutate(d))} disabled={loginMutation.isPending} activeOpacity={0.85}>
              {loginMutation.isPending ? <ActivityIndicator color={Colors.warmWhite} /> : <Text style={styles.btnText}>Sign In</Text>}
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.registerLink} onPress={() => router.replace('/(auth)/register')}>
            <Text style={styles.registerText}>New to Tavallin? <Text style={styles.registerBold}>Create Account</Text></Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.warmWhite },
  scroll: { paddingHorizontal: Spacing[6], paddingTop: Spacing[4], paddingBottom: Spacing[10] },
  backButton: { marginBottom: Spacing[6] },
  backText: { fontFamily: Typography.fontBody, fontSize: Typography.sm, color: Colors.textSecondary },
  header: { marginBottom: Spacing[8] },
  title: { fontFamily: Typography.fontDisplay, fontSize: Typography['3xl'], fontWeight: '500', color: Colors.charcoal, lineHeight: Typography['3xl'] * 1.15, marginBottom: Spacing[2] },
  subtitle: { fontFamily: Typography.fontBody, fontSize: Typography.sm, color: Colors.textSecondary },
  form: { gap: Spacing[1] },
  field: { marginBottom: Spacing[5] },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing[2] },
  label: { fontFamily: Typography.fontBody, fontSize: Typography.sm, fontWeight: '500', color: Colors.charcoal },
  forgotText: { fontFamily: Typography.fontBody, fontSize: Typography.sm, color: Colors.textSecondary },
  input: { fontFamily: Typography.fontBody, fontSize: Typography.base, color: Colors.charcoal, borderWidth: 1, borderColor: Colors.border, borderRadius: Spacing[2], paddingHorizontal: Spacing[4], paddingVertical: Spacing[3] + 2, backgroundColor: Colors.surface },
  inputError: { borderColor: Colors.error },
  pwRow: { position: 'relative' },
  pwInput: { paddingRight: Spacing[12] },
  eye: { position: 'absolute', right: Spacing[4], top: 0, bottom: 0, justifyContent: 'center' },
  eyeText: { fontFamily: Typography.fontBody, fontSize: Typography.sm, color: Colors.textSecondary, fontWeight: '500' },
  err: { fontFamily: Typography.fontBody, fontSize: Typography.xs, color: Colors.error, marginTop: Spacing[1] },
  btn: { backgroundColor: Colors.charcoal, paddingVertical: Spacing[4], borderRadius: Spacing[2], alignItems: 'center', marginTop: Spacing[2] },
  btnDisabled: { opacity: 0.65 },
  btnText: { fontFamily: Typography.fontBody, fontSize: Typography.base, fontWeight: '600', color: Colors.warmWhite, letterSpacing: Typography.letterSpacingWide },
  registerLink: { marginTop: Spacing[6], alignItems: 'center' },
  registerText: { fontFamily: Typography.fontBody, fontSize: Typography.sm, color: Colors.textSecondary },
  registerBold: { color: Colors.charcoal, fontWeight: '600' },
});
