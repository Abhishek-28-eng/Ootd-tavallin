import React from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { ForgotPasswordSchema } from '@tavallin/shared';
import type { ForgotPasswordInput } from '@tavallin/shared';
import { apiClient } from '../../src/lib/apiClient';
import { Colors, Typography, Spacing } from '../../src/design/tokens';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { control, handleSubmit, formState: { errors } } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(ForgotPasswordSchema),
    defaultValues: { email: '' },
  });
  const mutation = useMutation({
    mutationFn: async (data: ForgotPasswordInput) => {
      await apiClient.post('/auth/forgot-password', data);
    },
    onSuccess: () => {
      Alert.alert('Check your email', 'If an account exists with that email, a reset link has been sent.', [{ text: 'OK', onPress: () => router.back() }]);
    },
    onError: () => Alert.alert('Error', 'Something went wrong. Please try again.'),
  });
  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity onPress={() => router.back()} style={styles.back}><Text style={styles.backText}>← Back</Text></TouchableOpacity>
      <View style={styles.content}>
        <Text style={styles.title}>Reset{'\n'}password</Text>
        <Text style={styles.subtitle}>Enter your email and we'll send a reset link if your account exists.</Text>
        <Controller control={control} name="email" render={({ field: { onChange, value, onBlur } }) => (
          <TextInput style={[styles.input, errors.email && styles.inputError]} placeholder="your@email.com" placeholderTextColor={Colors.textPlaceholder} value={value} onChangeText={onChange} onBlur={onBlur} autoCapitalize="none" keyboardType="email-address" />
        )} />
        {errors.email && <Text style={styles.err}>{errors.email.message}</Text>}
        <TouchableOpacity style={[styles.btn, mutation.isPending && styles.btnDisabled]} onPress={handleSubmit((d) => mutation.mutate(d))} disabled={mutation.isPending} activeOpacity={0.85}>
          {mutation.isPending ? <ActivityIndicator color={Colors.warmWhite} /> : <Text style={styles.btnText}>Send Reset Link</Text>}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.warmWhite, paddingHorizontal: Spacing[6] },
  back: { marginTop: Spacing[4], marginBottom: Spacing[6] },
  backText: { fontFamily: Typography.fontBody, fontSize: Typography.sm, color: Colors.textSecondary },
  content: { flex: 1 },
  title: { fontFamily: Typography.fontDisplay, fontSize: Typography['3xl'], fontWeight: '500', color: Colors.charcoal, lineHeight: Typography['3xl'] * 1.15, marginBottom: Spacing[3] },
  subtitle: { fontFamily: Typography.fontBody, fontSize: Typography.sm, color: Colors.textSecondary, lineHeight: Typography.sm * 1.7, marginBottom: Spacing[8] },
  input: { fontFamily: Typography.fontBody, fontSize: Typography.base, color: Colors.charcoal, borderWidth: 1, borderColor: Colors.border, borderRadius: Spacing[2], paddingHorizontal: Spacing[4], paddingVertical: Spacing[3] + 2, backgroundColor: Colors.surface, marginBottom: Spacing[2] },
  inputError: { borderColor: Colors.error },
  err: { fontFamily: Typography.fontBody, fontSize: Typography.xs, color: Colors.error, marginBottom: Spacing[4] },
  btn: { backgroundColor: Colors.charcoal, paddingVertical: Spacing[4], borderRadius: Spacing[2], alignItems: 'center', marginTop: Spacing[4] },
  btnDisabled: { opacity: 0.65 },
  btnText: { fontFamily: Typography.fontBody, fontSize: Typography.base, fontWeight: '600', color: Colors.warmWhite },
});
