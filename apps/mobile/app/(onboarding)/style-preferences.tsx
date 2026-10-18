// ============================================================
// Onboarding Step 2 — Style Preferences
// ============================================================

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { STYLE_CATEGORIES, STYLE_CATEGORY_LABELS, type StyleCategory } from '@tavallin/shared';
import { Colors, Typography, Spacing, Radii } from '../../src/design/tokens';
import { useOnboardingStore } from '../../src/stores/onboardingStore';

export default function StylePreferencesScreen() {
  const router = useRouter();
  const { styleCategories, toggleStyle } = useOnboardingStore();

  const handleNext = () => {
    if (styleCategories.length === 0) {
      Alert.alert('Select a style', 'Please choose at least 1 aesthetic you love.');
      return;
    }
    router.push('/(onboarding)/occasions');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.navRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.stepIndicator}>STEP 2 OF 5</Text>
        </View>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: '40%' }]} />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Define your aesthetic</Text>
        <Text style={styles.subtitle}>
          Select all the styles that reflect your everyday wardrobe and fashion inspiration.
        </Text>

        <View style={styles.chipGrid}>
          {STYLE_CATEGORIES.map((cat: StyleCategory) => {
            const isSelected = styleCategories.includes(cat);
            return (
              <TouchableOpacity
                key={cat}
                style={[styles.chip, isSelected && styles.chipActive]}
                onPress={() => toggleStyle(cat)}
                activeOpacity={0.75}
              >
                <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                  {STYLE_CATEGORY_LABELS[cat] ?? cat}
                </Text>
                {isSelected && <Text style={styles.checkmark}>✓</Text>}
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.nextBtn} onPress={handleNext} activeOpacity={0.88}>
          <Text style={styles.nextBtnText}>
            Continue to Occasions ({styleCategories.length} selected) →
          </Text>
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
  header: {
    paddingHorizontal: Spacing[6],
    paddingTop: Spacing[3],
    paddingBottom: Spacing[4],
  },
  navRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing[2],
  },
  backBtn: {
    paddingVertical: Spacing[1],
  },
  backText: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.xs,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  stepIndicator: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.xs,
    letterSpacing: 2,
    color: Colors.textTertiary,
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
  scrollContent: {
    paddingHorizontal: Spacing[6],
    paddingBottom: Spacing[10],
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
    marginBottom: Spacing[6],
    lineHeight: 22,
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing[2] + 2,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[3],
    borderRadius: Radii.full,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  chipActive: {
    borderColor: Colors.charcoal,
    backgroundColor: Colors.charcoal,
  },
  chipText: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.sm,
    fontWeight: '500',
    color: Colors.charcoal,
  },
  chipTextActive: {
    color: Colors.warmWhite,
  },
  checkmark: {
    fontSize: 12,
    color: Colors.warmWhite,
    marginLeft: Spacing[1] + 2,
  },
  footer: {
    paddingHorizontal: Spacing[6],
    paddingVertical: Spacing[4],
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    backgroundColor: Colors.warmWhite,
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
  },
});
