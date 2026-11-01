// ============================================================
// Welcome Screen — OOTDi Luxury Editorial Entrance
// ============================================================

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Platform,
  Animated,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, Radii, Shadows } from '../../src/design/tokens';

const OOTDiLogo = require('../../assets/images/ootdi-logo.png');

const { width: SW, height: SH } = Dimensions.get('window');

const PILLARS = ['STYLE', 'UPLOAD', 'FEEDBACK', 'DISCOVER', 'IDENTITY'];

export default function WelcomeScreen() {
  const router = useRouter();

  // Entrance animations
  const heroOpacity = useRef(new Animated.Value(0)).current;
  const heroSlide = useRef(new Animated.Value(20)).current;
  const ctaOpacity = useRef(new Animated.Value(0)).current;
  const ctaSlide = useRef(new Animated.Value(24)).current;
  const goldLineW = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(heroOpacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(heroSlide, { toValue: 0, duration: 700, useNativeDriver: true }),
      ]),
      Animated.timing(goldLineW, { toValue: 56, duration: 400, useNativeDriver: false }),
      Animated.parallel([
        Animated.timing(ctaOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(ctaSlide, { toValue: 0, duration: 500, useNativeDriver: true }),
      ]),
    ]).start();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      {/* ─── Hero Area ─────────────────────────────────── */}
      <View style={styles.heroArea}>
        {/* Geometric decorative layers */}
        <View style={styles.decorBigCircle} />
        <View style={styles.decorSmallCircle} />
        <View style={styles.decorLine1} />
        <View style={styles.decorLine2} />
        <View style={styles.decorDot} />

        {/* Brand lockup */}
        <Animated.View
          style={[
            styles.brandContainer,
            { opacity: heroOpacity, transform: [{ translateY: heroSlide }] },
          ]}
        >
          <Image
            source={OOTDiLogo}
            style={styles.logoImage}
            resizeMode="contain"
          />
          <Text style={styles.brandTagline}>Your Style. Your Story.</Text>
        </Animated.View>

        {/* Floating style words */}
        <View style={styles.pillarsRow}>
          {PILLARS.map((word, i) => (
            <View key={i} style={styles.pillarWrap}>
              <Text style={styles.pillarWord}>{word}</Text>
              {i < PILLARS.length - 1 && <View style={styles.pillarDot} />}
            </View>
          ))}
        </View>
      </View>

      {/* ─── CTA Section ───────────────────────────────── */}
      <Animated.View
        style={[
          styles.ctaSection,
          { opacity: ctaOpacity, transform: [{ translateY: ctaSlide }] },
        ]}
      >
        {/* Primary CTA */}

        {/* Primary CTA */}
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => router.push('/(auth)/register')}
          activeOpacity={0.88}
        >
          <Text style={styles.primaryButtonText}>Join the Community</Text>
          <Text style={styles.primaryButtonArrow}>→</Text>
        </TouchableOpacity>

        {/* Secondary CTA */}
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => router.push('/(auth)/login')}
          activeOpacity={0.85}
        >
          <Text style={styles.secondaryButtonText}>Sign In to Your Account</Text>
        </TouchableOpacity>

        {/* Legal */}
        <Text style={styles.legalText}>
          By continuing, you agree to our{' '}
          <Text style={styles.legalLink}>Terms of Service</Text>
          {' '}and{' '}
          <Text style={styles.legalLink}>Privacy Policy</Text>
        </Text>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.obsidian,
  },

  // ─── Hero ─────────────────────────────────────────────────
  heroArea: {
    flex: 1,
    backgroundColor: Colors.obsidian,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
    minHeight: SH * 0.46,
  },
  decorBigCircle: {
    position: 'absolute',
    width: SW * 1.1,
    height: SW * 1.1,
    borderRadius: SW * 0.55,
    borderWidth: 1,
    borderColor: 'rgba(201,168,76,0.08)',
    top: -SW * 0.3,
    right: -SW * 0.3,
  },
  decorSmallCircle: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 1,
    borderColor: 'rgba(201,168,76,0.12)',
    bottom: 30,
    left: 20,
  },
  decorLine1: {
    position: 'absolute',
    top: 0,
    left: SW * 0.3,
    width: 1,
    height: '100%',
    backgroundColor: 'rgba(201,168,76,0.06)',
  },
  decorLine2: {
    position: 'absolute',
    top: SH * 0.15,
    left: 0,
    width: '100%',
    height: 1,
    backgroundColor: 'rgba(201,168,76,0.06)',
  },
  decorDot: {
    position: 'absolute',
    top: 40,
    left: 40,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.gold,
  },

  // ─── Brand Lockup ─────────────────────────────────────────
  brandContainer: {
    alignItems: 'center',
    gap: Spacing[3],
  },
  logoImage: {
    width: 200,
    height: 200,
    borderRadius: 100,
  },
  brandTagline: {
    fontFamily: Typography.fontDisplay,
    fontSize: Typography.lg,
    fontWeight: '400',
    color: Colors.champagne,
    fontStyle: 'italic',
    letterSpacing: Typography.letterSpacingWide,
    marginTop: Spacing[1],
  },

  // ─── Pillars Row ──────────────────────────────────────────
  pillarsRow: {
    position: 'absolute',
    bottom: Spacing[6],
    flexDirection: 'row',
    alignItems: 'center',
  },
  pillarWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pillarWord: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.xs - 1,
    color: 'rgba(250,248,245,0.3)',
    letterSpacing: Typography.letterSpacingXWide,
    fontWeight: '600',
  },
  pillarDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: Colors.gold,
    marginHorizontal: Spacing[2],
    opacity: 0.5,
  },

  // ─── CTA Section ──────────────────────────────────────────
  ctaSection: {
    backgroundColor: Colors.warmWhite,
    paddingHorizontal: Spacing[6],
    paddingTop: Spacing[6],
    paddingBottom: Platform.OS === 'android' ? Spacing[6] : Spacing[4],
    borderTopLeftRadius: Radii['3xl'],
    borderTopRightRadius: Radii['3xl'],
  },

  // ─── Buttons ──────────────────────────────────────────────
  primaryButton: {
    backgroundColor: Colors.charcoal,
    paddingVertical: Spacing[4],
    paddingHorizontal: Spacing[6],
    borderRadius: Radii.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing[3],
    gap: Spacing[3],
    ...Shadows.md,
  },
  primaryButtonText: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.base,
    fontWeight: '600',
    color: Colors.textInverse,
    letterSpacing: Typography.letterSpacingWide,
  },
  primaryButtonArrow: {
    fontSize: Typography.md,
    color: Colors.gold,
    fontWeight: '300',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    paddingVertical: Spacing[4],
    borderRadius: Radii.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing[5],
  },
  secondaryButtonText: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.base,
    fontWeight: '500',
    color: Colors.charcoal,
  },

  // ─── Legal ────────────────────────────────────────────────
  legalText: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.xs,
    color: Colors.textTertiary,
    textAlign: 'center',
    lineHeight: Typography.xs * Typography.lineHeightRelaxed,
  },
  legalLink: {
    color: Colors.textSecondary,
    fontWeight: '500',
  },
});
