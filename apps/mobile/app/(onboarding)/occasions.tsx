// ============================================================
// Onboarding Step 3 — Occasions & Settings (Studio Editorial)
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
import { OCCASIONS, type Occasion } from '@tavallin/shared';
import { Colors, Typography, Spacing, Radii } from '../../src/design/tokens';
import { useOnboardingStore } from '../../src/stores/onboardingStore';

interface SceneItem {
  key: Occasion;
  label: string;
  sub: string;
}

interface SceneSection {
  number: string;
  name: string;
  items: SceneItem[];
}

const SCENE_SECTIONS: SceneSection[] = [
  {
    number: '01',
    name: 'DAILY ROTATION',
    items: [
      { key: 'everyday', label: 'Everyday', sub: 'Street & daily' },
      { key: 'work', label: 'Office & Studio', sub: 'Tailored & smart' },
      { key: 'college', label: 'Campus', sub: 'Lectures & casual' },
      { key: 'home_cozy', label: 'At Home', sub: 'Loungewear & knits' },
    ],
  },
  {
    number: '02',
    name: 'SOCIAL & LEISURE',
    items: [
      { key: 'brunch', label: 'Café & Brunch', sub: 'Daytime social' },
      { key: 'date_night', label: 'Date Night', sub: 'Elevated evening' },
      { key: 'outdoor', label: 'Outdoors', sub: 'Weekend & open air' },
    ],
  },
  {
    number: '03',
    name: 'AFTER HOURS',
    items: [
      { key: 'night_out', label: 'Night Out', sub: 'Bars & lounges' },
      { key: 'party', label: 'Club & Party', sub: 'Statement & late night' },
      { key: 'formal_event', label: 'Black Tie', sub: 'Galas & soirées' },
    ],
  },
  {
    number: '04',
    name: 'CEREMONIAL',
    items: [
      { key: 'wedding', label: 'Weddings', sub: 'Couture & receptions' },
      { key: 'festive_puja', label: 'Festivals & Puja', sub: 'Heritage & tradition' },
    ],
  },
  {
    number: '05',
    name: 'IN MOTION',
    items: [
      { key: 'travel', label: 'Airports & Travel', sub: 'Transit chic' },
      { key: 'beach', label: 'Beach & Coastal', sub: 'Resort & sun' },
      { key: 'gym_fitness', label: 'Gym & Sport', sub: 'Athleisure & motion' },
    ],
  },
];

export default function OccasionsScreen() {
  const router = useRouter();
  const { occasions, toggleOccasion } = useOnboardingStore();

  const handleNext = () => {
    if (occasions.length === 0) {
      Alert.alert('Select at least one setting', 'Choose the moments where you wear your clothes so we can calibrate your feed.');
      return;
    }
    router.push('/(onboarding)/colors');
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* ─── Minimalist Header ─── */}
      <View style={styles.header}>
        <View style={styles.navRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
            <Text style={styles.backArrow}>←</Text>
            <Text style={styles.backText}>BACK</Text>
          </TouchableOpacity>
          <Text style={styles.stepCounter}>STEP 03 / 04</Text>
        </View>
        <View style={styles.progressTrack}>
          <View style={styles.progressBar} />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── Editorial Masthead ─── */}
        <View style={styles.masthead}>
          <Text style={styles.title}>Where do you{'\n'}wear it?</Text>
          <Text style={styles.subtitle}>
            Select the settings in your life rotation.
          </Text>
        </View>

        {/* ─── Logical Studio Sections ─── */}
        {SCENE_SECTIONS.map((section) => (
          <View key={section.number} style={styles.section}>
            {/* Section Rule & Title */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionNumber}>{section.number}</Text>
              <View style={styles.sectionLine} />
              <Text style={styles.sectionName}>{section.name}</Text>
            </View>

            {/* 2-Column Grid */}
            <View style={styles.grid}>
              {section.items.map((item) => {
                const isSelected = occasions.includes(item.key);
                return (
                  <TouchableOpacity
                    key={item.key}
                    style={[styles.card, isSelected && styles.cardActive]}
                    onPress={() => toggleOccasion(item.key)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.cardTop}>
                      <Text style={[styles.cardLabel, isSelected && styles.cardLabelActive]}>
                        {item.label}
                      </Text>
                      <View style={[styles.indicator, isSelected && styles.indicatorActive]}>
                        {isSelected && <View style={styles.indicatorDot} />}
                      </View>
                    </View>
                    <Text style={[styles.cardSub, isSelected && styles.cardSubActive]}>
                      {item.sub}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ))}
      </ScrollView>

      {/* ─── Clean Bottom Bar ─── */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.continueBtn, occasions.length === 0 && styles.continueBtnDisabled]}
          onPress={handleNext}
          activeOpacity={0.9}
        >
          <Text style={styles.continueBtnText}>
            Continue to Color Harmony
          </Text>
          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>{occasions.length}</Text>
          </View>
          <Text style={styles.continueArrow}>→</Text>
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

  // ─── Header ───────────────────────────────────────────────
  header: {
    paddingHorizontal: Spacing[6],
    paddingTop: Spacing[3],
    paddingBottom: Spacing[3],
    backgroundColor: '#FAF8F5',
  },
  navRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing[3],
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
  },
  backArrow: {
    fontSize: 14,
    color: Colors.charcoal,
    fontWeight: '400',
  },
  backText: {
    fontFamily: Typography.fontBody,
    fontSize: 11,
    letterSpacing: 1.5,
    color: Colors.charcoal,
    fontWeight: '700',
  },
  stepCounter: {
    fontFamily: Typography.fontBody,
    fontSize: 11,
    letterSpacing: 2,
    color: Colors.textTertiary,
    fontWeight: '600',
  },
  progressTrack: {
    height: 2,
    backgroundColor: '#EBE6DE',
    borderRadius: 1,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    width: '75%',
    backgroundColor: Colors.charcoal,
  },

  scrollContent: {
    paddingHorizontal: Spacing[6],
    paddingTop: Spacing[4],
    paddingBottom: Spacing[10],
  },

  // ─── Masthead ─────────────────────────────────────────────
  masthead: {
    marginBottom: Spacing[7],
  },
  title: {
    fontFamily: Typography.fontDisplay,
    fontSize: 42,
    lineHeight: 46,
    color: Colors.charcoal,
    letterSpacing: -0.5,
    marginBottom: Spacing[2],
    fontWeight: '500',
  },
  subtitle: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    letterSpacing: 0.2,
  },

  // ─── Sections ─────────────────────────────────────────────
  section: {
    marginBottom: Spacing[7],
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
    marginBottom: Spacing[3],
  },
  sectionNumber: {
    fontFamily: Typography.fontBody,
    fontSize: 10,
    fontWeight: '800',
    color: Colors.textTertiary,
    letterSpacing: 1,
  },
  sectionLine: {
    width: 14,
    height: 1,
    backgroundColor: Colors.border,
  },
  sectionName: {
    fontFamily: Typography.fontBody,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.8,
    color: Colors.charcoal,
  },

  // ─── 2-Col Grid ───────────────────────────────────────────
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing[3],
  },
  card: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8E3DA',
    borderRadius: Radii.md,
    paddingHorizontal: Spacing[3] + 2,
    paddingVertical: Spacing[3] + 2,
    justifyContent: 'space-between',
    minHeight: 82,
  },
  cardActive: {
    backgroundColor: '#0A0A0C',
    borderColor: '#0A0A0C',
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 4,
  },
  cardLabel: {
    flex: 1,
    fontFamily: Typography.fontBody,
    fontSize: Typography.sm,
    fontWeight: '700',
    color: Colors.charcoal,
    lineHeight: 18,
  },
  cardLabelActive: {
    color: '#FAF8F5',
  },
  indicator: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D4CEBF',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  indicatorActive: {
    borderColor: Colors.gold,
    backgroundColor: Colors.gold,
  },
  indicatorDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#0A0A0C',
  },
  cardSub: {
    fontFamily: Typography.fontBody,
    fontSize: 11,
    color: Colors.textTertiary,
    marginTop: 6,
  },
  cardSubActive: {
    color: '#A09890',
  },

  // ─── Footer ───────────────────────────────────────────────
  footer: {
    paddingHorizontal: Spacing[6],
    paddingVertical: Spacing[4],
    borderTopWidth: 1,
    borderTopColor: '#EBE6DE',
    backgroundColor: '#FAF8F5',
  },
  continueBtn: {
    backgroundColor: '#0A0A0C',
    paddingVertical: Spacing[4],
    borderRadius: Radii.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing[3],
  },
  continueBtnDisabled: {
    opacity: 0.45,
  },
  continueBtnText: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.base - 1,
    fontWeight: '700',
    color: '#FAF8F5',
    letterSpacing: 0.5,
  },
  countBadge: {
    backgroundColor: Colors.gold,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radii.full,
  },
  countBadgeText: {
    fontFamily: Typography.fontBody,
    fontSize: 11,
    fontWeight: '800',
    color: '#0A0A0C',
  },
  continueArrow: {
    fontSize: Typography.base,
    color: Colors.gold,
    fontWeight: '300',
  },
});
