// ============================================================
// Explore Screen — Search + style/occasion filter chips + grid
// ============================================================

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { Colors, Typography, Spacing, Radii } from '../../src/design/tokens';
import { useExploreFeed } from '../../src/hooks/useOutfitFeed';
import { GridSkeleton } from '../../src/components/Skeletons';
import { STYLE_CATEGORY_LABELS, OCCASION_LABELS } from '@tavallin/shared';
import type { StyleCategory, Occasion, OutfitPost } from '@tavallin/shared';

const { width: SW } = Dimensions.get('window');
const GAP = Spacing[2];
const CARD_W = (SW - GAP * 3) / 2;

const STYLE_CHIPS: { key: StyleCategory; label: string }[] = (
  Object.entries(STYLE_CATEGORY_LABELS) as [StyleCategory, string][]
).map(([key, label]) => ({ key, label }));

const OCCASION_CHIPS: { key: Occasion; label: string }[] = (
  Object.entries(OCCASION_LABELS) as [Occasion, string][]
).map(([key, label]) => ({ key, label }));

export default function ExploreScreen() {
  const router = useRouter();
  const [searchText, setSearchText] = useState('');
  const [committedTag, setCommittedTag] = useState<string | undefined>();
  const [selectedStyle, setSelectedStyle] = useState<StyleCategory | undefined>();
  const [selectedOccasion, setSelectedOccasion] = useState<Occasion | undefined>();
  const [filterMode, setFilterMode] = useState<'style' | 'occasion'>('style');

  const filters: {
    style?: string;
    occasion?: string;
    tag?: string;
  } = {};
  if (selectedStyle) filters.style = selectedStyle;
  if (selectedOccasion) filters.occasion = selectedOccasion;
  if (committedTag) filters.tag = committedTag;

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useExploreFeed(filters);

  const posts = data?.pages.flatMap((p) => p.posts) ?? [];

  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) void fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const handleSearch = useCallback(() => {
    setCommittedTag(searchText.trim() || undefined);
  }, [searchText]);

  const clearFilters = () => {
    setSelectedStyle(undefined);
    setSelectedOccasion(undefined);
    setCommittedTag(undefined);
    setSearchText('');
  };

  const hasActiveFilter = selectedStyle || selectedOccasion || committedTag;

  const renderPost = useCallback(({ item }: { item: OutfitPost }) => {
    const firstImg = (item.media && item.media[0]) as any;
    const imgUrl = firstImg?.url ?? firstImg?.publicUrl ?? '';
    const ar = firstImg?.width && firstImg?.height ? firstImg.width / firstImg.height : 0.75;
    const creator = item.creator ?? (item as any).author ?? { username: '', avatarUrl: null };
    return (
      <TouchableOpacity
        style={[styles.exploreCard, { width: CARD_W }]}
        activeOpacity={0.9}
        onPress={() => router.push(`/outfit/${item.id}`)}
      >
        <Image
          source={{ uri: imgUrl }}
          style={[styles.exploreImage, { aspectRatio: ar }]}
          contentFit="cover"
          cachePolicy="memory-disk"
          transition={150}
        />
        <View style={styles.exploreCardMeta}>
          <Image
            source={creator?.avatarUrl ? { uri: creator.avatarUrl } : null}
            style={styles.exploreAvatar}
            contentFit="cover"
            cachePolicy="memory-disk"
          />
          <Text style={styles.exploreUsername} numberOfLines={1}>
            {creator?.username ?? ''}
          </Text>
          <Text style={styles.exploreLikes}>♥ {item.likesCount}</Text>
        </View>
      </TouchableOpacity>
    );
  }, [router]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header + Search */}
      <View style={styles.headerWrap}>
        <Text style={styles.brand}>EXPLORE</Text>
        <View style={styles.searchRow}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search tags, styles…"
            placeholderTextColor={Colors.textPlaceholder}
            value={searchText}
            onChangeText={setSearchText}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          {searchText.length > 0 && (
            <TouchableOpacity onPress={handleSearch} style={styles.searchBtn}>
              <Text style={styles.searchBtnText}>Go</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Filter mode toggle */}
        <View style={styles.filterToggle}>
          <TouchableOpacity
            style={[styles.filterToggleBtn, filterMode === 'style' && styles.filterToggleActive]}
            onPress={() => setFilterMode('style')}
          >
            <Text style={[styles.filterToggleText, filterMode === 'style' && styles.filterToggleTextActive]}>
              Style
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterToggleBtn, filterMode === 'occasion' && styles.filterToggleActive]}
            onPress={() => setFilterMode('occasion')}
          >
            <Text style={[styles.filterToggleText, filterMode === 'occasion' && styles.filterToggleTextActive]}>
              Occasion
            </Text>
          </TouchableOpacity>
          {hasActiveFilter && (
            <TouchableOpacity style={styles.clearBtn} onPress={clearFilters}>
              <Text style={styles.clearBtnText}>Clear ×</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll} contentContainerStyle={styles.chips}>
          {filterMode === 'style'
            ? STYLE_CHIPS.map(({ key, label }) => (
                <TouchableOpacity
                  key={key}
                  style={[styles.chip, selectedStyle === key && styles.chipActive]}
                  onPress={() => setSelectedStyle(selectedStyle === key ? undefined : key)}
                >
                  <Text style={[styles.chipText, selectedStyle === key && styles.chipTextActive]}>{label}</Text>
                </TouchableOpacity>
              ))
            : OCCASION_CHIPS.map(({ key, label }) => (
                <TouchableOpacity
                  key={key}
                  style={[styles.chip, selectedOccasion === key && styles.chipActive]}
                  onPress={() => setSelectedOccasion(selectedOccasion === key ? undefined : key)}
                >
                  <Text style={[styles.chipText, selectedOccasion === key && styles.chipTextActive]}>{label}</Text>
                </TouchableOpacity>
              ))}
        </ScrollView>
      </View>

      {/* Grid */}
      {isLoading ? (
        <GridSkeleton />
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(item) => item.id}
          renderItem={renderPost}
          numColumns={2}
          columnWrapperStyle={styles.columnWrapper}
          contentContainerStyle={styles.grid}
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.4}
          showsVerticalScrollIndicator={false}
          ListFooterComponent={
            isFetchingNextPage ? (
              <View style={styles.footer}><ActivityIndicator color={Colors.midGray} /></View>
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>◌</Text>
              <Text style={styles.emptyTitle}>No outfits found</Text>
              <Text style={styles.emptyBody}>Try a different style or clear the filters.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.warmWhite },
  headerWrap: {
    backgroundColor: Colors.warmWhite,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    paddingBottom: Spacing[2],
  },
  brand: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.sm,
    fontWeight: '700',
    letterSpacing: 3,
    color: Colors.charcoal,
    textAlign: 'center',
    paddingTop: Spacing[2],
    paddingBottom: Spacing[3],
  },
  searchRow: {
    flexDirection: 'row',
    marginHorizontal: Spacing[4],
    marginBottom: Spacing[3],
    gap: Spacing[2],
  },
  searchInput: {
    flex: 1,
    height: 40,
    backgroundColor: Colors.softGray,
    borderRadius: Radii.full,
    paddingHorizontal: Spacing[4],
    fontFamily: Typography.fontBody,
    fontSize: Typography.sm,
    color: Colors.charcoal,
  },
  searchBtn: {
    backgroundColor: Colors.charcoal,
    borderRadius: Radii.full,
    paddingHorizontal: Spacing[4],
    justifyContent: 'center',
  },
  searchBtnText: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.sm,
    fontWeight: '600',
    color: Colors.warmWhite,
  },
  filterToggle: {
    flexDirection: 'row',
    marginHorizontal: Spacing[4],
    gap: Spacing[2],
    marginBottom: Spacing[2],
  },
  filterToggleBtn: {
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[1] + 2,
    borderRadius: Radii.full,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterToggleActive: {
    backgroundColor: Colors.charcoal,
    borderColor: Colors.charcoal,
  },
  filterToggleText: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  filterToggleTextActive: { color: Colors.warmWhite },
  clearBtn: {
    paddingHorizontal: Spacing[3],
    justifyContent: 'center',
  },
  clearBtnText: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.sm,
    color: Colors.error,
    fontWeight: '500',
  },
  chipsScroll: { maxHeight: 44 },
  chips: {
    paddingHorizontal: Spacing[4],
    gap: Spacing[2],
    alignItems: 'center',
    flexDirection: 'row',
  },
  chip: {
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[1] + 2,
    borderRadius: Radii.full,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  chipActive: {
    backgroundColor: Colors.charcoal,
    borderColor: Colors.charcoal,
  },
  chipText: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.xs,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  chipTextActive: { color: Colors.warmWhite },
  grid: { padding: Spacing[2], gap: GAP },
  columnWrapper: { gap: GAP },
  exploreCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radii.md,
    overflow: 'hidden',
  },
  exploreImage: {
    width: '100%',
    backgroundColor: Colors.softGray,
  },
  exploreCardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing[2],
    gap: Spacing[1],
  },
  exploreAvatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.softGray,
  },
  exploreUsername: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.xs,
    color: Colors.charcoal,
    fontWeight: '500',
    flex: 1,
  },
  exploreLikes: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.xs,
    color: Colors.likeActive,
    fontWeight: '500',
  },
  footer: { paddingVertical: Spacing[6], alignItems: 'center' },
  empty: {
    paddingTop: 80,
    alignItems: 'center',
    gap: Spacing[3],
    paddingHorizontal: Spacing[8],
  },
  emptyIcon: { fontSize: 32, color: Colors.midGray },
  emptyTitle: {
    fontFamily: Typography.fontDisplay,
    fontSize: Typography['2xl'],
    color: Colors.charcoal,
  },
  emptyBody: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});
