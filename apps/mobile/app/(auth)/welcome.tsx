import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing } from '../../src/design/tokens';

const { height } = Dimensions.get('window');

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      {/* Background imagery area */}
      <View style={styles.heroArea}>
        {/* Abstract decorative elements */}
        <View style={styles.decorativeCircle1} />
        <View style={styles.decorativeCircle2} />

        {/* Brand */}
        <View style={styles.brandContainer}>
          <Text style={styles.brandName}>TAVALLIN</Text>
          <View style={styles.taglineLine} />
          <Text style={styles.tagline}>Wear Your Story</Text>
        </View>

        {/* Fashion words */}
        <View style={styles.wordsRow}>
          {['STYLE', 'DISCOVER', 'INSPIRE'].map((word, i) => (
            <Text key={i} style={styles.fashionWord}>{word}</Text>
          ))}
        </View>
      </View>

      {/* CTA Section */}
      <View style={styles.ctaSection}>
        <Text style={styles.headline}>Discover outfits{'\n'}that define you.</Text>
        <Text style={styles.subheadline}>
          A fashion community for bold styles, everyday looks, and everything in between.
        </Text>

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => router.push('/(auth)/register')}
          activeOpacity={0.85}
        >
          <Text style={styles.primaryButtonText}>Create Account</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => router.push('/(auth)/login')}
          activeOpacity={0.85}
        >
          <Text style={styles.secondaryButtonText}>Sign In</Text>
        </TouchableOpacity>

        <Text style={styles.legalText}>
          By continuing, you agree to our{' '}
          <Text style={styles.legalLink}>Terms of Service</Text> and{' '}
          <Text style={styles.legalLink}>Privacy Policy</Text>
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.warmWhite,
  },
  heroArea: {
    flex: 1,
    backgroundColor: Colors.charcoal,
    position: 'relative',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: height * 0.45,
  },
  decorativeCircle1: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(232, 213, 196, 0.08)',
    top: -60,
    right: -80,
  },
  decorativeCircle2: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    bottom: -40,
    left: -40,
  },
  brandContainer: {
    alignItems: 'center',
  },
  brandName: {
    fontFamily: Typography.fontBody,
    fontSize: Typography['3xl'],
    fontWeight: '700',
    color: Colors.warmWhite,
    letterSpacing: Typography.letterSpacingXWide * 2,
  },
  taglineLine: {
    width: 40,
    height: 1,
    backgroundColor: Colors.blush,
    marginVertical: Spacing[3],
  },
  tagline: {
    fontFamily: Typography.fontDisplay,
    fontSize: Typography.lg,
    fontWeight: '400',
    color: Colors.blush,
    fontStyle: 'italic',
    letterSpacing: Typography.letterSpacingWide,
  },
  wordsRow: {
    flexDirection: 'row',
    position: 'absolute',
    bottom: Spacing[6],
    gap: Spacing[4],
  },
  fashionWord: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.xs,
    color: 'rgba(255,255,255,0.3)',
    letterSpacing: Typography.letterSpacingXWide,
    fontWeight: '500',
  },
  ctaSection: {
    paddingHorizontal: Spacing[6],
    paddingTop: Spacing[8],
    paddingBottom: Platform.OS === 'android' ? Spacing[6] : Spacing[4],
  },
  headline: {
    fontFamily: Typography.fontDisplay,
    fontSize: Typography['2xl'],
    fontWeight: '500',
    color: Colors.charcoal,
    lineHeight: Typography['2xl'] * Typography.lineHeightTight,
    marginBottom: Spacing[3],
  },
  subheadline: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    lineHeight: Typography.sm * Typography.lineHeightRelaxed,
    marginBottom: Spacing[8],
  },
  primaryButton: {
    backgroundColor: Colors.charcoal,
    paddingVertical: Spacing[4],
    borderRadius: Spacing[2],
    alignItems: 'center',
    marginBottom: Spacing[3],
  },
  primaryButtonText: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.base,
    fontWeight: '600',
    color: Colors.warmWhite,
    letterSpacing: Typography.letterSpacingWide,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    paddingVertical: Spacing[4],
    borderRadius: Spacing[2],
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing[6],
  },
  secondaryButtonText: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.base,
    fontWeight: '500',
    color: Colors.charcoal,
  },
  legalText: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.xs,
    color: Colors.textTertiary,
    textAlign: 'center',
    lineHeight: Typography.xs * Typography.lineHeightRelaxed,
  },
  legalLink: {
    color: Colors.charcoal,
    fontWeight: '500',
  },
});
