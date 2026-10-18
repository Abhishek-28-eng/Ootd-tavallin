// ============================================================
// OutfitGrid — Masonry-style 2-col grid thumbnail (profile / explore)
// ============================================================

import React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Colors, Spacing } from '../design/tokens';
import type { OutfitSummary } from '@tavallin/shared';

const { width: SW } = Dimensions.get('window');
const COLS = 3;
const GAP = 1.5;
const THUMB_SIZE = (SW - GAP * (COLS - 1)) / COLS;

interface OutfitGridProps {
  posts: OutfitSummary[];
}

export function OutfitGrid({ posts }: OutfitGridProps) {
  const router = useRouter();

  return (
    <View style={styles.grid}>
      {posts.map((post) => (
        <TouchableOpacity
          key={post.id}
          style={styles.cell}
          activeOpacity={0.9}
          onPress={() => router.push(`/outfit/${post.id}`)}
        >
          <Image
            source={post.thumbnailUrl ? { uri: post.thumbnailUrl } : null}
            style={styles.thumb}
            contentFit="cover"
            cachePolicy="memory-disk"
            transition={150}
          />
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GAP,
  },
  cell: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    backgroundColor: Colors.softGray,
  },
  thumb: {
    width: '100%',
    height: '100%',
  },
});
