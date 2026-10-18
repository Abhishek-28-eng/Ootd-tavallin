// ============================================================
// Onboarding Step 5 — Budget & Currency
// ============================================================

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  SUPPORTED_CURRENCIES,
  CURRENCY_SYMBOLS,
  type SupportedCurrency,
} from '@tavallin/shared';
import { Colors, Typography, Spacing, Radii } from '../../src/design/tokens';
import { useOnboardingStore } from '../../src/stores/onboardingStore';

interface BudgetTier {
  id: string;
  title: string;
  subtitle: string;
  min: number;
  max: number;
}

const BUDGET_TIERS: BudgetTier[] = [
  {
    id: 'budget_friendly',
    title: 'Value & High Street',
    subtitle: 'Smart finds, essentials & fast fashion',
    min: 500,
    max: 2000,
  },
  {
    id: 'contemporary',
    title: 'Contemporary & Premium',
    subtitle: 'Quality essentials, Zara, H&M, Mango & indie brands',
    min: 2000,
    max: 6000,
  },
  {
    id: 'luxury',
    title: 'Designer & Luxury',
    subtitle: 'Curated designer pieces, premium labels & statements',
    min: 6000,
    max: 25000,
  },
  {
    id: 'all',
    title: 'No Budget Limit',
    subtitle: 'Show me everything from budget gems to luxury runways',
    min: 0,
    max: 50000,
  },
];

export default function BudgetScreen() {
  const router = useRouter();
  const { budgetMin, budgetMax, currency, setBudget } = useOnboardingStore();

  const [selectedCurrency, setSelectedCurrency] = useState<SupportedCurrency>(
    (currency as SupportedCurrency) || 'INR',
  );
  const [selectedTier, setSelectedTier] = useState<string>(() => {
    const match = BUDGET_TIERS.find((t) => t.min === budgetMin && t.max === budgetMax);
    return match?.id ?? 'contemporary';
  });

  const handleSelectTier = (tier: BudgetTier) => {
    setSelectedTier(tier.id);
    setBudget(tier.min, tier.max, selectedCurrency);
  };

  const handleSelectCurrency = (curr: SupportedCurrency) => {
    setSelectedCurrency(curr);
    const tier = BUDGET_TIERS.find((t) => t.id === selectedTier) ?? BUDGET_TIERS[1]!;
    setBudget(tier.min, tier.max, curr);
  };

  const handleNext = () => {
    router.push('/(onboarding)/complete');
  };

  const symbol = CURRENCY_SYMBOLS[selectedCurrency] ?? '₹';

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.navRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.stepIndicator}>STEP 5 OF 5</Text>
        </View>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: '100%' }]} />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Your styling budget</Text>
        <Text style={styles.subtitle}>
          This helps us recommend shoppable items and budget-matched fashion fits.
        </Text>

        {/* Currency Picker */}
        <Text style={styles.sectionLabel}>PREFERRED CURRENCY</Text>
        <View style={styles.currencyRow}>
          {SUPPORTED_CURRENCIES.map((curr) => {
            const isSelected = selectedCurrency === curr;
            return (
              <TouchableOpacity
                key={curr}
                style={[styles.currChip, isSelected && styles.currChipActive]}
                onPress={() => handleSelectCurrency(curr)}
                activeOpacity={0.75}
              >
                <Text style={[styles.currText, isSelected && styles.currTextActive]}>
                  {CURRENCY_SYMBOLS[curr]} {curr}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Budget Tiers */}
        <Text style={[styles.sectionLabel, { marginTop: Spacing[6] }]}>TYPICAL OUTFIT RANGE</Text>
        <View style={styles.tierList}>
          {BUDGET_TIERS.map((tier) => {
            const isSelected = selectedTier === tier.id;
            return (
              <TouchableOpacity
                key={tier.id}
                style={[styles.tierCard, isSelected && styles.tierCardActive]}
                onPress={() => handleSelectTier(tier)}
                activeOpacity={0.8}
              >
                <View style={styles.tierLeft}>
                  <Text style={[styles.tierTitle, isSelected && styles.tierTitleActive]}>
                    {tier.title}
                  </Text>
                  <Text style={styles.tierSubtitle}>{tier.subtitle}</Text>
                  <Text style={styles.tierRange}>
                    {tier.min === 0
                      ? 'Any Price'
                      : `${symbol}${tier.min.toLocaleString()} – ${symbol}${tier.max.toLocaleString()}`}
                  </Text>
                </View>

                <View style={[styles.radioCircle, isSelected && styles.radioCircleActive]}>
                  {isSelected && <View style={styles.radioDot} />}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.nextBtn} onPress={handleNext} activeOpacity={0.88}>
          <Text style={styles.nextBtnText}>Review & Finish Setup →</Text>
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
  sectionLabel: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.xs,
    letterSpacing: 1.5,
    color: Colors.textTertiary,
    fontWeight: '600',
    marginBottom: Spacing[3],
  },
  currencyRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing[2],
  },
  currChip: {
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[2] + 2,
    borderRadius: Radii.full,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  currChipActive: {
    borderColor: Colors.charcoal,
    backgroundColor: Colors.charcoal,
  },
  currText: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.xs,
    fontWeight: '600',
    color: Colors.charcoal,
  },
  currTextActive: {
    color: Colors.warmWhite,
  },
  tierList: {
    gap: Spacing[3],
  },
  tierCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing[4],
    borderRadius: Radii.lg,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  tierCardActive: {
    borderColor: Colors.charcoal,
    backgroundColor: Colors.softGray,
  },
  tierLeft: {
    flex: 1,
    paddingRight: Spacing[3],
  },
  tierTitle: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.base,
    fontWeight: '600',
    color: Colors.charcoal,
    marginBottom: 2,
  },
  tierTitleActive: {
    color: Colors.charcoal,
  },
  tierSubtitle: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.xs,
    color: Colors.textSecondary,
    marginBottom: Spacing[2],
    lineHeight: 16,
  },
  tierRange: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.xs,
    fontWeight: '700',
    color: Colors.charcoal,
  },
  radioCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: Colors.midGray,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioCircleActive: {
    borderColor: Colors.charcoal,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.charcoal,
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
