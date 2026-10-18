// ============================================================
// FeedSkeleton — shimmer loading placeholders
// ============================================================

import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';
import { Colors, Spacing, Radii } from '../design/tokens';

const { width: SW } = Dimensions.get('window');

function ShimmerBox({ width, height, style }: { width: number | string; height: number; style?: object }) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 900, useNativeDriver: true }),
      ]),
    ).start();
  }, [anim]);

  const opacity = anim.interpolate({ inputRange: [0, 1], outputRange: [0.4, 0.85] });

  return (
    <Animated.View
      style={[{ width, height, backgroundColor: Colors.softGray, borderRadius: Radii.sm, opacity }, style]}
    />
  );
}

function SkeletonCard() {
  return (
    <View style={styles.card}>
      <ShimmerBox width={SW} height={SW * 1.25} />
      <View style={styles.row}>
        <ShimmerBox width={28} height={28} style={{ borderRadius: 14 }} />
        <View style={{ gap: 5, flex: 1, marginLeft: Spacing[2] }}>
          <ShimmerBox width="40%" height={10} />
          <ShimmerBox width="25%" height={8} />
        </View>
      </View>
    </View>
  );
}

export function FeedSkeleton() {
  return (
    <View>
      <SkeletonCard />
      <SkeletonCard />
    </View>
  );
}

export function GridSkeleton() {
  const SIZE = (SW - 3) / 3;
  return (
    <View style={styles.grid}>
      {Array.from({ length: 9 }).map((_, i) => (
        <ShimmerBox key={i} width={SIZE} height={SIZE} style={{ borderRadius: 0 }} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: Spacing[4] },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[3],
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 1.5,
  },
});
