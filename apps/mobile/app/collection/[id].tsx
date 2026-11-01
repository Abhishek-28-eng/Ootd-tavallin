// ============================================================
// Collection Detail Screen — Tavallin Luxury Curated Moodboard
// View saved outfits in a curated wardrobe capsule
// ============================================================

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radii, Shadows } from '../../src/design/tokens';
import { useCollection, type CollectionOutfitItem } from '../../src/hooks/useCollections';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const NUM_COLS = 2;
const GAP = Spacing[3];
const ITEM_WIDTH = (SCREEN_WIDTH - Spacing[4] * 2 - GAP) / NUM_COLS;

export default function CollectionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data, isLoading, isError } = useCollection(id ?? '');

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => router.back()} style={styles.iconCircleBtn} activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={18} color={Colors.charcoal} />
          </TouchableOpacity>
        </View>
        <View style={styles.center}>
          <ActivityIndicator color={Colors.charcoal} />
        </View>
      </SafeAreaView>
    );
  }

  if (isError || !data) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => router.back()} style={styles.iconCircleBtn} activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={18} color={Colors.charcoal} />
          </TouchableOpacity>
        </View>
        <View style={styles.center}>
          <Text style={styles.emptyTitle}>Moodboard Not Found</Text>
          <Text style={styles.emptySub}>This collection may have been removed or is no longer accessible.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const { collection, outfits } = data;

  const renderItem = ({ item }: { item: CollectionOutfitItem }) => {
    const firstImg = item.media[0];
    const imageUri = firstImg?.thumbnailUrl ?? firstImg?.publicUrl;

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.88}
        onPress={() => router.push(`/outfit/${item.id}`)}
      >
        <View style={styles.cardImageContainer}>
          <Image
            source={imageUri ? { uri: imageUri } : null}
            style={styles.cardImage}
            contentFit="cover"
            cachePolicy="memory-disk"
            transition={150}
          />
          <View style={styles.cardImageOverlay} />
          <View style={styles.authorBadge}>
            <Text style={styles.authorName} numberOfLines={1}>
              @{item.author.username}
            </Text>
          </View>
        </View>
        {item.caption ? (
          <View style={styles.cardMeta}>
            <Text style={styles.caption} numberOfLines={2}>
              {item.caption}
            </Text>
          </View>
        ) : null}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Top Header */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconCircleBtn} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={18} color={Colors.charcoal} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.topBarEyebrow}>✦ MOODBOARD</Text>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {collection.name}
          </Text>
        </View>

        <View style={{ width: 36 }} />
      </View>

      <FlatList
        data={outfits}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        numColumns={NUM_COLS}
        contentContainerStyle={styles.listContent}
        columnWrapperStyle={styles.colWrapper}
        ListHeaderComponent={
          <View style={styles.heroCard}>
            <View style={styles.heroBadgeRow}>
              <View style={styles.goldPill}>
                <Text style={styles.goldPillText}>✦ WARDROBE CAPSULE</Text>
              </View>
              <View style={styles.statusPill}>
                <Text style={styles.statusPillText}>
                  {collection.isPublic ? 'PUBLIC' : 'PRIVATE'}
                </Text>
              </View>
            </View>

            <Text style={styles.collectionTitle}>{collection.name}</Text>

            {collection.description ? (
              <Text style={styles.collectionDesc}>{collection.description}</Text>
            ) : null}

            <View style={styles.statsRow}>
              <Ionicons name="layers-outline" size={14} color={Colors.textGold} />
              <Text style={styles.statsText}>
                {outfits.length} {outfits.length === 1 ? 'Look Curated' : 'Looks Curated'}
              </Text>
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconWrap}>
              <Ionicons name="bookmark-outline" size={32} color={Colors.gold} />
            </View>
            <Text style={styles.emptyTitle}>Moodboard is Empty</Text>
            <Text style={styles.emptySub}>
              Tap the bookmark save icon on any outfit in the feed to archive it in this capsule.
            </Text>
            <TouchableOpacity
              style={styles.exploreBtn}
              onPress={() => router.push('/(tabs)/explore')}
              activeOpacity={0.88}
            >
              <Text style={styles.exploreBtnText}>Discover Outfits</Text>
              <Ionicons name="arrow-forward" size={15} color={Colors.warmWhite} />
            </TouchableOpacity>
          </View>
        }
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.warmWhite,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[2],
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    backgroundColor: Colors.warmWhite,
  },
  iconCircleBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    alignItems: 'center',
    maxWidth: SCREEN_WIDTH * 0.6,
  },
  topBarEyebrow: {
    fontFamily: Typography.fontBody,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.5,
    color: Colors.textGold,
  },
  headerTitle: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.xs + 1,
    fontWeight: '800',
    letterSpacing: 1,
    color: Colors.charcoal,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing[6],
  },
  heroCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radii['2xl'],
    borderWidth: 1,
    borderColor: Colors.borderGold,
    padding: Spacing[5],
    marginTop: Spacing[4],
    marginBottom: Spacing[5],
    ...Shadows.sm,
  },
  heroBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
    marginBottom: Spacing[3],
  },
  goldPill: {
    backgroundColor: Colors.goldDust,
    paddingHorizontal: Spacing[3],
    paddingVertical: 3,
    borderRadius: Radii.full,
    borderWidth: 1,
    borderColor: Colors.borderGold,
  },
  goldPillText: {
    fontFamily: Typography.fontBody,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
    color: Colors.textGold,
  },
  statusPill: {
    backgroundColor: Colors.surfaceElevated,
    paddingHorizontal: Spacing[2] + 2,
    paddingVertical: 3,
    borderRadius: Radii.full,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  statusPillText: {
    fontFamily: Typography.fontBody,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1,
    color: Colors.textSecondary,
  },
  collectionTitle: {
    fontFamily: Typography.fontDisplay,
    fontSize: Typography['3xl'],
    color: Colors.charcoal,
    marginBottom: Spacing[2],
  },
  collectionDesc: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    lineHeight: Typography.sm * 1.55,
    marginBottom: Spacing[4],
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
  },
  statsText: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.xs,
    color: Colors.charcoal,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  listContent: {
    paddingHorizontal: Spacing[4],
    paddingBottom: Spacing[10],
  },
  colWrapper: {
    gap: GAP,
    marginBottom: GAP,
  },
  card: {
    width: ITEM_WIDTH,
    backgroundColor: Colors.surface,
    borderRadius: Radii.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.borderLight,
    ...Shadows.sm,
  },
  cardImageContainer: {
    position: 'relative',
    width: '100%',
    aspectRatio: 0.78,
    backgroundColor: Colors.softGray,
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  cardImageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 48,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  authorBadge: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    backgroundColor: 'rgba(10,10,12,0.7)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: Radii.full,
  },
  authorName: {
    fontFamily: Typography.fontBody,
    fontSize: 10,
    fontWeight: '700',
    color: Colors.warmWhite,
  },
  cardMeta: {
    padding: Spacing[2] + 2,
  },
  caption: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.xs,
    color: Colors.charcoal,
    lineHeight: Typography.xs * 1.4,
  },
  emptyContainer: {
    paddingTop: Spacing[10],
    alignItems: 'center',
    paddingHorizontal: Spacing[4],
  },
  emptyIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.goldDust,
    borderWidth: 1,
    borderColor: Colors.borderGold,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing[3],
  },
  emptyTitle: {
    fontFamily: Typography.fontDisplay,
    fontSize: Typography['2xl'],
    color: Colors.charcoal,
    marginBottom: Spacing[2],
  },
  emptySub: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    maxWidth: 280,
    marginBottom: Spacing[6],
    lineHeight: Typography.sm * 1.5,
  },
  exploreBtn: {
    backgroundColor: Colors.charcoal,
    paddingHorizontal: Spacing[6],
    paddingVertical: Spacing[3],
    borderRadius: Radii.full,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
    ...Shadows.sm,
  },
  exploreBtnText: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.sm,
    fontWeight: '700',
    color: Colors.warmWhite,
  },
});
