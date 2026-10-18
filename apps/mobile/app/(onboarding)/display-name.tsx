// ============================================================
// Onboarding Step 1 — Profile & Display Name
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
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors, Typography, Spacing, Radii } from '../../src/design/tokens';
import { useAuthStore } from '../../src/stores/authStore';
import { useOnboardingStore } from '../../src/stores/onboardingStore';

export default function DisplayNameScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { displayName, bio, setDisplayName, setBio } = useOnboardingStore();

  const [name, setName] = useState(displayName || user?.displayName || '');
  const [userBio, setUserBio] = useState(bio || '');

  const handleNext = () => {
    if (!name.trim()) {
      Alert.alert('Required', 'Please enter your name or alias.');
      return;
    }
    setDisplayName(name.trim());
    setBio(userBio.trim());
    router.push('/(onboarding)/style-preferences');
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Progress Header */}
          <View style={styles.header}>
            <Text style={styles.stepIndicator}>STEP 1 OF 5</Text>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: '20%' }]} />
            </View>
          </View>

          <View style={styles.content}>
            <Text style={styles.title}>What should we call you?</Text>
            <Text style={styles.subtitle}>
              This will be displayed on your fashion profile and outfit posts.
            </Text>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Display Name</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="e.g. Elena Vance"
                placeholderTextColor={Colors.textPlaceholder}
                autoCapitalize="words"
                maxLength={50}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Short Bio (Optional)</Text>
              <TextInput
                style={[styles.input, styles.bioInput]}
                value={userBio}
                onChangeText={setUserBio}
                placeholder="Minimalist lover, neutral tones & vintage enthusiast..."
                placeholderTextColor={Colors.textPlaceholder}
                multiline
                numberOfLines={3}
                maxLength={200}
                textAlignVertical="top"
              />
              <Text style={styles.charCount}>{userBio.length}/200</Text>
            </View>
          </View>

          <View style={styles.footer}>
            <TouchableOpacity style={styles.nextBtn} onPress={handleNext} activeOpacity={0.88}>
              <Text style={styles.nextBtnText}>Continue to Styles →</Text>
            </TouchableOpacity>
          </View>
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
    flexGrow: 1,
    paddingHorizontal: Spacing[6],
    paddingTop: Spacing[4],
    paddingBottom: Spacing[8],
    justifyContent: 'space-between',
  },
  header: {
    marginBottom: Spacing[8],
  },
  stepIndicator: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.xs,
    letterSpacing: 2,
    color: Colors.textTertiary,
    marginBottom: Spacing[2],
    fontWeight: '600',
  },
  progressBar: {
    height: 3,
    backgroundColor: Colors.borderLight,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.charcoal,
  },
  content: {
    flex: 1,
  },
  title: {
    fontFamily: Typography.fontDisplay,
    fontSize: Typography['3xl'],
    color: Colors.charcoal,
    marginBottom: Spacing[2],
    lineHeight: Typography['3xl'] * 1.15,
  },
  subtitle: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.base,
    color: Colors.textSecondary,
    marginBottom: Spacing[8],
    lineHeight: 22,
  },
  formGroup: {
    marginBottom: Spacing[6],
  },
  label: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.sm,
    fontWeight: '600',
    color: Colors.charcoal,
    marginBottom: Spacing[2],
  },
  input: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.base,
    color: Colors.charcoal,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radii.md,
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[3] + 2,
    backgroundColor: Colors.surface,
  },
  bioInput: {
    height: 96,
  },
  charCount: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.xs,
    color: Colors.textTertiary,
    textAlign: 'right',
    marginTop: Spacing[1],
  },
  footer: {
    marginTop: Spacing[6],
  },
  nextBtn: {
    backgroundColor: Colors.charcoal,
    paddingVertical: Spacing[4],
    borderRadius: Radii.md,
    alignItems: 'center',
  },
  nextBtnText: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.base,
    fontWeight: '600',
    color: Colors.warmWhite,
    letterSpacing: 0.5,
  },
});
