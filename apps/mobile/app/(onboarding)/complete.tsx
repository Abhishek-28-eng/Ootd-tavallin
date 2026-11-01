// ============================================================
// Onboarding Completion — OOTDi Atelier Style Dossier
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
import { Ionicons } from '@expo/vector-icons';
import {
  STYLE_CATEGORY_LABELS,
  OCCASION_LABELS,
  COLOR_LABELS,
  type ColorPreference,
  type UpdatePreferencesRequest,
  type UpdateProfileRequest,
  type AuthUser,
} from '@tavallin/shared';
import { Colors, Typography, Spacing, Radii, Shadows } from '../../src/design/tokens';
import { useAuthStore } from '../../src/stores/authStore';
import { useOnboardingStore } from '../../src/stores/onboardingStore';
import { apiClient } from '../../src/lib/apiClient';

const COLOR_SWATCH_PREVIEW: Record<ColorPreference, string[]> = {
  neutrals: ['#FFFFFF', '#E8E5E0', '#1A1A1A'],
  earth_tones: ['#8C6239', '#C29B7F', '#556B2F'],
  pastels: ['#FFB6C1', '#E6E6FA', '#AFEEEE'],
  bold_brights: ['#E63946', '#1D3557', '#F4A261'],
  monochrome: ['#000000', '#7F7F7F', '#FFFFFF'],
  prints_patterns: ['#D4A373', '#CCD5AE', '#E9D8A6'],
  metallics: ['#D4AF37', '#C0C0C0', '#B76E79'],
  dark_tones: ['#1C1C1C', '#2C3E50', '#3E2723'],
};

export default function CompleteScreen() {
  const router = useRouter();
  const { user, updateUser } = useAuthStore();
  const {
    displayName,
    bio,
    styleCategories,
    occasions,
    colorPreferences,
    reset,
  } = useOnboardingStore();

  const [isSubmitting, setIsSubmitting] = useState(false);

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
      // Fallback
      void apiClient.post('/users/me/onboard').catch(() => {});
      Alert.alert(
        'Welcome to OOTDi',
        'Your style profile is active. Opening your personalized studio.',
        [
          {
            text: 'Enter Studio',
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

  const nameToShow = displayName.trim() || user?.displayName || user?.username || 'Curator';
  const handleToShow = user?.username ? `@${user.username}` : '@member';

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* ─── Editorial Header ─── */}
        <View style={styles.masthead}>
          <Text style={styles.folioTag}>OOTDi ATELIER · DOSSIER</Text>
          <Text style={styles.title}>Your style index{'\n'}is calibrated.</Text>
          <Text style={styles.subtitle}>
            Your personal profile is active. Explore outfits, get feedback, and curate your daily rotation.
          </Text>
        </View>

        {/* ─── The Atelier Style Dossier Card ─── */}
        <View style={styles.dossierCard}>
          {/* Card Top: Branding & Serial */}
          <View style={styles.cardHeader}>
            <View style={styles.brandRow}>
              <View style={styles.brandPip} />
              <Text style={styles.brandText}>OOTDi ARCHIVE</Text>
            </View>
            <Text style={styles.serialText}>INDEX / 01</Text>
          </View>

          {/* Member Identity */}
          <View style={styles.identityRow}>
            <View>
              <Text style={styles.memberName}>{nameToShow}</Text>
              <Text style={styles.memberHandle}>{handleToShow}</Text>
            </View>
            <View style={styles.verifiedSeal}>
              <Ionicons name="sparkles" size={12} color={Colors.gold} />
              <Text style={styles.sealText}>CALIBRATED</Text>
            </View>
          </View>

          <View style={styles.cardDivider} />

          {/* Section: Aesthetic DNA */}
          <View style={styles.dossierSection}>
            <Text style={styles.sectionLabel}>AESTHETIC SIGNATURE</Text>
            <View style={styles.pillWrap}>
              {styleCategories.length > 0 ? (
                styleCategories.map((s) => (
                  <View key={s} style={styles.stylePill}>
                    <Text style={styles.stylePillText}>{STYLE_CATEGORY_LABELS[s] ?? s}</Text>
                  </View>
                ))
              ) : (
                <View style={styles.stylePill}>
                  <Text style={styles.stylePillText}>Eclectic Modern</Text>
                </View>
              )}
            </View>
          </View>

          {/* Section: Scene Settings */}
          <View style={styles.dossierSection}>
            <Text style={styles.sectionLabel}>SETTINGS IN ROTATION</Text>
            <View style={styles.pillWrap}>
              {occasions.length > 0 ? (
                occasions.slice(0, 6).map((o) => (
                  <View key={o} style={styles.occasionPill}>
                    <Text style={styles.occasionDot}>•</Text>
                    <Text style={styles.occasionText}>{OCCASION_LABELS[o] ?? o}</Text>
                  </View>
                ))
              ) : (
                <View style={styles.occasionPill}>
                  <Text style={styles.occasionDot}>•</Text>
                  <Text style={styles.occasionText}>Everyday & Leisure</Text>
                </View>
              )}
              {occasions.length > 6 && (
                <View style={styles.morePill}>
                  <Text style={styles.moreText}>+{occasions.length - 6} more</Text>
                </View>
              )}
            </View>
          </View>

          {/* Section: Color Harmony Swatches */}
          <View style={styles.dossierSectionLast}>
            <Text style={styles.sectionLabel}>COLOR HARMONIES</Text>
            <View style={styles.colorRows}>
              {colorPreferences.length > 0 ? (
                colorPreferences.map((c) => {
                  const swatches = COLOR_SWATCH_PREVIEW[c] ?? ['#111', '#555', '#999'];
                  return (
                    <View key={c} style={styles.colorItem}>
                      <View style={styles.swatchCluster}>
                        {swatches.map((hex, i) => (
                          <View
                            key={i}
                            style={[
                              styles.swatchMicro,
                              { backgroundColor: hex },
                              hex === '#FFFFFF' && { borderWidth: 1, borderColor: '#D4CEBF' },
                            ]}
                          />
                        ))}
                      </View>
                      <Text style={styles.colorName}>{COLOR_LABELS[c] ?? c}</Text>
                    </View>
                  );
                })
              ) : (
                <Text style={styles.colorFallback}>Neutrals & Tonal</Text>
              )}
            </View>
          </View>

          {/* Card Footer Stamp */}
          <View style={styles.cardFooter}>
            <Text style={styles.cardFooterText}>READY FOR DISCOVERY & CURATION</Text>
            <Text style={styles.cardFooterDate}>EDITION 2026</Text>
          </View>
        </View>

        {/* ─── Micro Note ─── */}
        <Text style={styles.footerNote}>
          You can refine these aesthetic parameters anytime in your Profile.
        </Text>
      </ScrollView>

      {/* ─── Bottom CTA ─── */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.enterBtn, isSubmitting && styles.enterBtnDisabled]}
          onPress={handleFinish}
          disabled={isSubmitting}
          activeOpacity={0.9}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#FAF8F5" />
          ) : (
            <>
              <Text style={styles.enterBtnText}>Enter OOTDi Studio</Text>
              <View style={styles.enterArrowWrap}>
                <Ionicons name="arrow-forward" size={15} color="#0A0A0C" />
              </View>
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF8F5',
  },
  scrollContent: {
    paddingHorizontal: Spacing[6],
    paddingTop: Spacing[5],
    paddingBottom: Spacing[10],
  },

  // ─── Masthead ─────────────────────────────────────────────
  masthead: {
    marginBottom: Spacing[6],
  },
  folioTag: {
    fontFamily: Typography.fontBody,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 2,
    color: Colors.gold,
    marginBottom: Spacing[2],
  },
  title: {
    fontFamily: Typography.fontDisplay,
    fontSize: 40,
    lineHeight: 44,
    color: Colors.charcoal,
    fontWeight: '500',
    letterSpacing: -0.5,
    marginBottom: Spacing[2],
  },
  subtitle: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
    letterSpacing: 0.1,
  },

  // ─── Dossier Card ─────────────────────────────────────────
  dossierCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radii.lg,
    borderWidth: 1.5,
    borderColor: '#E8E3DA',
    padding: Spacing[5],
    ...Shadows.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing[4],
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  brandPip: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.gold,
  },
  brandText: {
    fontFamily: Typography.fontBody,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
    color: Colors.charcoal,
  },
  serialText: {
    fontFamily: Typography.fontBody,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1.2,
    color: Colors.textTertiary,
  },

  // ─── Identity ─────────────────────────────────────────────
  identityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing[4],
  },
  memberName: {
    fontFamily: Typography.fontDisplay,
    fontSize: 24,
    color: Colors.charcoal,
    fontWeight: '600',
    letterSpacing: -0.3,
  },
  memberHandle: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.xs,
    color: Colors.textTertiary,
    marginTop: 2,
  },
  verifiedSeal: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FAF8F5',
    borderWidth: 1,
    borderColor: Colors.borderGold,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radii.full,
  },
  sealText: {
    fontFamily: Typography.fontBody,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
    color: Colors.textGold,
  },

  cardDivider: {
    height: 1,
    backgroundColor: '#F0ECE4',
    marginBottom: Spacing[4],
  },

  // ─── Sections ─────────────────────────────────────────────
  dossierSection: {
    marginBottom: Spacing[4],
  },
  dossierSectionLast: {
    marginBottom: Spacing[3],
  },
  sectionLabel: {
    fontFamily: Typography.fontBody,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.6,
    color: Colors.textTertiary,
    marginBottom: Spacing[2],
  },
  pillWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  stylePill: {
    backgroundColor: '#0A0A0C',
    paddingHorizontal: Spacing[3],
    paddingVertical: 5,
    borderRadius: Radii.sm,
  },
  stylePillText: {
    fontFamily: Typography.fontBody,
    fontSize: 11,
    fontWeight: '700',
    color: '#FAF8F5',
    letterSpacing: 0.3,
  },
  occasionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F2EC',
    paddingHorizontal: Spacing[3],
    paddingVertical: 5,
    borderRadius: Radii.full,
    gap: 4,
  },
  occasionDot: {
    fontSize: 9,
    color: Colors.gold,
  },
  occasionText: {
    fontFamily: Typography.fontBody,
    fontSize: 11,
    fontWeight: '600',
    color: Colors.charcoal,
  },
  morePill: {
    backgroundColor: '#F5F2EC',
    paddingHorizontal: Spacing[2] + 2,
    paddingVertical: 5,
    borderRadius: Radii.full,
  },
  moreText: {
    fontFamily: Typography.fontBody,
    fontSize: 10,
    fontWeight: '600',
    color: Colors.textTertiary,
  },

  // ─── Color Swatches ───────────────────────────────────────
  colorRows: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing[3],
  },
  colorItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAF8F5',
    borderWidth: 1,
    borderColor: '#E8E3DA',
    borderRadius: Radii.full,
    paddingLeft: 6,
    paddingRight: 10,
    paddingVertical: 4,
    gap: 6,
  },
  swatchCluster: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  swatchMicro: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginLeft: -2,
  },
  colorName: {
    fontFamily: Typography.fontBody,
    fontSize: 11,
    fontWeight: '600',
    color: Colors.charcoal,
  },
  colorFallback: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.xs,
    color: Colors.textSecondary,
    fontStyle: 'italic',
  },

  // ─── Card Stamp ───────────────────────────────────────────
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing[3],
    paddingTop: Spacing[3],
    borderTopWidth: 1,
    borderTopColor: '#F0ECE4',
  },
  cardFooterText: {
    fontFamily: Typography.fontBody,
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 1.2,
    color: Colors.textTertiary,
  },
  cardFooterDate: {
    fontFamily: Typography.fontBody,
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 1,
    color: Colors.textTertiary,
  },

  footerNote: {
    fontFamily: Typography.fontBody,
    fontSize: 11,
    color: Colors.textTertiary,
    textAlign: 'center',
    marginTop: Spacing[5],
    lineHeight: 16,
  },

  // ─── Bottom CTA ───────────────────────────────────────────
  footer: {
    paddingHorizontal: Spacing[6],
    paddingVertical: Spacing[4],
    borderTopWidth: 1,
    borderTopColor: '#EBE6DE',
    backgroundColor: '#FAF8F5',
  },
  enterBtn: {
    backgroundColor: '#0A0A0C',
    paddingVertical: Spacing[4],
    borderRadius: Radii.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing[3],
  },
  enterBtnDisabled: {
    opacity: 0.6,
  },
  enterBtnText: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.base,
    fontWeight: '700',
    color: '#FAF8F5',
    letterSpacing: 0.5,
  },
  enterArrowWrap: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
