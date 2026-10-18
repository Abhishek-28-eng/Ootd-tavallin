// ============================================================
// Collection Detail Screen — /collection/[id]
// View saved outfits in a curated board
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
import { Colors, Typography, Spacing, Radii } from '../../src/design/tokens';
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
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.center}>
          <ActivityIndicator color={Colors.midGray} />
        </View>
      </SafeAreaView>
    );
  }

  if (isError || !data) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.center}>
          <Text style={styles.emptyTitle}>Collection not found</Text>
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
        <Image
          source={imageUri ? { uri: imageUri } : null}
          style={styles.cardImage}
          contentFit="cover"
          cachePolicy="memory-disk"
          transition={150}
        />
        <View style={styles.cardMeta}>
          <Text style={styles.authorName} numberOfLines={1}>
            @{item.author.username}
          </Text>
          {item.caption ? (
            <Text style={styles.caption} numberOfLines={1}>
              {item.caption}
            </Text>
          ) : null}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Top Header */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {collection.name}
        </Text>
        <View style={{ width: 32 }} />
      </View>

      <FlatList
        data={outfits}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        numColumns={NUM_COLS}
        contentContainerStyle={styles.listContent}
        columnWrapperStyle={styles.colWrapper}
        ListHeaderComponent={
          <View style={styles.collectionHeader}>
            <Text style={styles.collectionTitle}>{collection.name}</Text>
            {collection.description ? (
              <Text style={styles.collectionDesc}>{collection.description}</Text>
            ) : null}
            <View style={styles.statsRow}>
              <Text style={styles.statsText}>
                {outfits.length} {outfits.length === 1 ? 'item' : 'items'}
              </Text>
              <Text style={styles.dot}>·</Text>
              <Text style={styles.statsText}>
                {collection.isPublic ? 'Public Board' : 'Private Board'}
              </Text>
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>⊡</Text>
            <Text style={styles.emptyTitle}>No saved outfits yet</Text>
            <Text style={styles.emptySub}>
              Tap the save bookmark on any outfit to collect it here.
            </Text>
            <TouchableOpacity
              style={styles.exploreBtn}
              onPress={() => router.push('/(tabs)/explore')}
              activeOpacity={0.8}
            >
              <Text style={styles.exploreBtnText}>Discover Outfits</Text>
            </TouchableOpacity>
          </View>
        }
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
    paddingVertical: Spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  backBtn: {
    padding: Spacing[2],
  },
  backText: {
    fontSize: 20,
    color: Colors.charcoal,
    fontWeight: '300',
  },
  headerTitle: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.base,
    fontWeight: '600',
    color: Colors.charcoal,
    maxWidth: 240,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  collectionHeader: {
    paddingVertical: Spacing[5],
    paddingHorizontal: Spacing[1],
    marginBottom: Spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  collectionTitle: {
    fontFamily: Typography.fontDisplay,
    fontSize: Typography['2xl'],
    color: Colors.charcoal,
    marginBottom: Spacing[2],
  },
  collectionDesc: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing[3],
    lineHeight: 20,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statsText: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.xs,
    color: Colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  dot: {
    marginHorizontal: Spacing[2],
    color: Colors.textTertiary,
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
    borderRadius: Radii.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  cardImage: {
    width: '100%',
    aspectRatio: 0.75,
    backgroundColor: Colors.softGray,
  },
  cardMeta: {
    padding: Spacing[2],
  },
  authorName: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.xs,
    fontWeight: '600',
    color: Colors.charcoal,
  },
  caption: {
    fontFamily: Typography.fontBody,
    fontSize: 10,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  emptyContainer: {
    paddingTop: Spacing[12],
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 48,
    color: Colors.midGray,
    marginBottom: Spacing[4],
  },
  emptyTitle: {
    fontFamily: Typography.fontDisplay,
    fontSize: Typography.xl,
    color: Colors.charcoal,
    marginBottom: Spacing[2],
  },
  emptySub: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    maxWidth: 260,
    marginBottom: Spacing[6],
  },
  exploreBtn: {
    backgroundColor: Colors.charcoal,
    paddingHorizontal: Spacing[6],
    paddingVertical: Spacing[3],
    borderRadius: Radii.full,
  },
  exploreBtnText: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.sm,
    fontWeight: '600',
    color: Colors.warmWhite,
  },
});
