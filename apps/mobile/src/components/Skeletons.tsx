// ============================================================
// Skeletons — Tavallin Premium Shimmer Loading Placeholders
// ============================================================

import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';
import { Colors, Spacing, Radii } from '../design/tokens';

const { width: SW } = Dimensions.get('window');
const GAP = Spacing[2];
const GRID_CARD_W = (SW - GAP * 3) / 2;

// ─── Base Shimmer ─────────────────────────────────────────────
function ShimmerBox({
  width,
  height,
  style,
  radius,
}: {
  width: number | string;
  height: number;
  style?: object;
  radius?: number;
}) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0.3, duration: 800, useNativeDriver: true }),
      ]),
    ).start();
  }, [anim]);

  const opacity = anim.interpolate({ inputRange: [0.3, 1], outputRange: [0.35, 0.75] });

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          backgroundColor: Colors.softGray,
          borderRadius: radius ?? Radii.md,
          opacity,
        },
        style,
      ]}
    />
  );
}

// ─── Feed Card Skeleton ───────────────────────────────────────
function FeedCardSkeleton() {
  return (
    <View style={styles.feedCard}>
      {/* Creator row */}
      <View style={styles.feedCreatorRow}>
        <ShimmerBox width={40} height={40} radius={20} />
        <View style={styles.feedCreatorText}>
          <ShimmerBox width={120} height={11} />
          <ShimmerBox width={80} height={9} style={{ marginTop: 5 }} />
        </View>
      </View>
      {/* Image placeholder — 4:5 portrait */}
      <ShimmerBox width={SW} height={SW * 1.25} radius={0} />
      {/* Action row */}
      <View style={styles.feedActionRow}>
        <ShimmerBox width={60} height={12} />
        <ShimmerBox width={50} height={12} />
        <ShimmerBox width={40} height={12} />
      </View>
      {/* Caption lines */}
      <View style={styles.feedCaptionWrap}>
        <ShimmerBox width={'75%'} height={11} />
        <ShimmerBox width={'50%'} height={10} style={{ marginTop: 6 }} />
      </View>
    </View>
  );
}

export function FeedSkeleton() {
  return (
    <View>
      <FeedCardSkeleton />
      <FeedCardSkeleton />
    </View>
  );
}

// ─── Explore Grid Skeleton ────────────────────────────────────
function GridCardSkeleton() {
  return (
    <View style={[styles.gridCard, { width: GRID_CARD_W }]}>
      <ShimmerBox width={GRID_CARD_W} height={GRID_CARD_W * 1.3} radius={0} />
      <View style={styles.gridMeta}>
        <ShimmerBox width={20} height={20} radius={10} />
        <ShimmerBox width={'55%'} height={9} />
        <ShimmerBox width={28} height={9} />
      </View>
    </View>
  );
}

export function GridSkeleton() {
  return (
    <View style={styles.gridWrap}>
      {Array.from({ length: 6 }).map((_, i) => (
        <GridCardSkeleton key={i} />
      ))}
    </View>
  );
}

// ─── Profile Header Skeleton ─────────────────────────────────
export function ProfileHeaderSkeleton() {
  return (
    <View style={styles.profileHeader}>
      <ShimmerBox width={80} height={80} radius={40} style={{ alignSelf: 'center' }} />
      <ShimmerBox width={140} height={14} style={{ alignSelf: 'center', marginTop: Spacing[3] }} />
      <ShimmerBox width={100} height={11} style={{ alignSelf: 'center', marginTop: 6 }} />
      <View style={styles.profileStats}>
        {[90, 80, 90].map((w, i) => (
          <ShimmerBox key={i} width={w} height={36} radius={Radii.lg} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // ─── Feed Card ───────────────────────────────────────────
  feedCard: {
    backgroundColor: Colors.surface,
    marginBottom: Spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    paddingBottom: Spacing[3],
  },
  feedCreatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[3],
  },
  feedCreatorText: {
    flex: 1,
    gap: 4,
  },
  feedActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[5],
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[3],
  },
  feedCaptionWrap: {
    paddingHorizontal: Spacing[4],
    gap: Spacing[2],
  },

  // ─── Grid ────────────────────────────────────────────────
  gridWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: GAP,
    gap: GAP,
  },
  gridCard: {
    backgroundColor: Colors.softGray,
    borderRadius: Radii.xl,
    overflow: 'hidden',
  },
  gridMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
    padding: Spacing[2],
    backgroundColor: Colors.surface,
  },

  // ─── Profile ─────────────────────────────────────────────
  profileHeader: {
    paddingVertical: Spacing[6],
    paddingHorizontal: Spacing[5],
    gap: Spacing[2],
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  profileStats: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing[3],
    marginTop: Spacing[4],
  },
});
