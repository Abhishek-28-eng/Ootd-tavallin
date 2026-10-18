// ============================================================
// Onboarding Step 4 — Color Palettes
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
import { COLOR_PREFERENCES, COLOR_LABELS, type ColorPreference } from '@tavallin/shared';
import { Colors, Typography, Spacing, Radii } from '../../src/design/tokens';
import { useOnboardingStore } from '../../src/stores/onboardingStore';

// Palette color preview dot
const COLOR_SWATCHES: Record<ColorPreference, string[]> = {
  neutrals: ['#FFFFFF', '#E8E5E0', '#1A1A1A'],
  earth_tones: ['#8C6239', '#C29B7F', '#556B2F'],
  pastels: ['#FFB6C1', '#E6E6FA', '#AFEEEE'],
  bold_brights: ['#E63946', '#1D3557', '#F4A261'],
  monochrome: ['#000000', '#7F7F7F', '#FFFFFF'],
  prints_patterns: ['#D4A373', '#CCD5AE', '#E9D8A6'],
  metallics: ['#D4AF37', '#C0C0C0', '#B76E79'],
  dark_tones: ['#1C1C1C', '#2C3E50', '#3E2723'],
};

export default function ColorsScreen() {
  const router = useRouter();
  const { colorPreferences, toggleColor } = useOnboardingStore();

  const handleNext = () => {
    if (colorPreferences.length === 0) {
      Alert.alert('Select colors', 'Please select at least 1 color palette.');
      return;
    }
    router.push('/(onboarding)/budget');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.navRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.stepIndicator}>STEP 4 OF 5</Text>
        </View>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: '80%' }]} />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Your color harmony</Text>
        <Text style={styles.subtitle}>
          Which tones resonate most with your personal style?
        </Text>

        <View style={styles.cardGrid}>
          {COLOR_PREFERENCES.map((col: ColorPreference) => {
            const isSelected = colorPreferences.includes(col);
            const swatches = COLOR_SWATCHES[col] ?? ['#ccc', '#888', '#333'];

            return (
              <TouchableOpacity
                key={col}
                style={[styles.colorCard, isSelected && styles.colorCardActive]}
                onPress={() => toggleColor(col)}
                activeOpacity={0.8}
              >
                <View style={styles.swatchRow}>
                  {swatches.map((colorHex, idx) => (
                    <View
                      key={idx}
                      style={[
                        styles.swatchDot,
                        { backgroundColor: colorHex },
                        colorHex === '#FFFFFF' && { borderWidth: 1, borderColor: Colors.border },
                      ]}
                    />
                  ))}
                </View>

                <View style={styles.cardMeta}>
                  <Text style={[styles.cardTitle, isSelected && styles.cardTitleActive]}>
                    {COLOR_LABELS[col] ?? col}
                  </Text>
                  {isSelected && <Text style={styles.checkmark}>✓</Text>}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.nextBtn} onPress={handleNext} activeOpacity={0.88}>
          <Text style={styles.nextBtnText}>
            Continue to Budget ({colorPreferences.length} selected) →
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
  cardGrid: {
    gap: Spacing[3],
  },
  colorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing[5],
    paddingVertical: Spacing[4],
    borderRadius: Radii.lg,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  colorCardActive: {
    borderColor: Colors.charcoal,
    backgroundColor: Colors.softGray,
  },
  swatchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
  },
  swatchDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardTitle: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.base,
    fontWeight: '600',
    color: Colors.charcoal,
  },
  cardTitleActive: {
    color: Colors.charcoal,
  },
  checkmark: {
    fontSize: 16,
    color: Colors.charcoal,
    marginLeft: Spacing[2],
    fontWeight: '700',
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
