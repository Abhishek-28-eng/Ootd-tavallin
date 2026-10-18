// ============================================================
// Home Feed Screen — Luxury Editorial Home Lookbook
// ============================================================

import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radii, Shadows } from '../../src/design/tokens';
import { useHomeFeed, useToggleLike, useToggleSave } from '../../src/hooks/useOutfitFeed';
import { OutfitCard } from '../../src/components/OutfitCard';
import { FeedSkeleton } from '../../src/components/Skeletons';
import type { OutfitPost } from '@tavallin/shared';

type FeedTab = 'personalized' | 'following' | 'trending';

const TABS: { key: FeedTab; label: string }[] = [
  { key: 'personalized', label: 'For You' },
  { key: 'following', label: 'Following' },
  { key: 'trending', label: 'Trending' },
];

const STYLE_FILTERS = [
  { key: 'all', label: '✦ All Drops' },
  { key: 'minimalist', label: 'Minimalist' },
  { key: 'streetwear', label: 'Streetwear' },
  { key: 'old_money', label: 'Old Money' },
  { key: 'casual', label: 'Casual' },
  { key: 'vintage', label: 'Vintage' },
  { key: 'party', label: 'Party' },
  { key: 'date_night', label: 'Date Night' },
  { key: 'athleisure', label: 'Athleisure' },
];

export default function HomeScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<FeedTab>('personalized');
  const [selectedStyle, setSelectedStyle] = useState<string>('all');

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, refetch, isRefetching } =
    useHomeFeed(activeTab);
  const { mutate: toggleLike } = useToggleLike();
  const { mutate: toggleSave } = useToggleSave();

  const rawPosts = data?.pages.flatMap((p) => p.posts) ?? [];

  const posts = useMemo(() => {
    if (selectedStyle === 'all') return rawPosts;
    return rawPosts.filter((post) => {
      const cats = post.styleCategories || [];
      return cats.some(
        (c) => c.toLowerCase() === selectedStyle.toLowerCase() || c.toLowerCase().includes(selectedStyle.toLowerCase()),
      );
    });
  }, [rawPosts, selectedStyle]);

  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) void fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const renderItem = useCallback(
    ({ item }: { item: OutfitPost }) => (
      <OutfitCard
        post={item}
        onLike={(id) => toggleLike(id)}
        onSave={(id) => toggleSave({ postId: id })}
      />
    ),
    [toggleLike, toggleSave],
  );

  const renderFooter = useCallback(
    () =>
      isFetchingNextPage ? (
        <View style={styles.footer}>
          <ActivityIndicator color={Colors.charcoal} size="small" />
        </View>
      ) : null,
    [isFetchingNextPage],
  );

  const ListHeader = () => (
    <View style={styles.headerBlock}>
      {/* ─── Top Brand Bar ─── */}
      <View style={styles.brandRow}>
        <View style={styles.brandGroup}>
          <Text style={styles.brandTitle}>TAVALLIN</Text>
          <Text style={styles.brandSubtitle}>EDITORIAL</Text>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerActionBtn}
            onPress={() => router.push('/(tabs)/explore')}
            activeOpacity={0.75}
            accessibilityLabel="Search and explore"
          >
            <Ionicons name="search-outline" size={19} color={Colors.charcoal} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.headerActionBtn}
            onPress={() => router.push('/(tabs)/notifications')}
            activeOpacity={0.75}
            accessibilityLabel="Notifications"
          >
            <Ionicons name="notifications-outline" size={19} color={Colors.charcoal} />
            <View style={styles.notifBadge} />
          </TouchableOpacity>
        </View>
      </View>

      {/* ─── Style Highlights Filter Row ─── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.styleScroll}
      >
        {STYLE_FILTERS.map((s) => {
          const isSelected = selectedStyle === s.key;
          return (
            <TouchableOpacity
              key={s.key}
              style={[styles.styleChip, isSelected && styles.styleChipSelected]}
              onPress={() => setSelectedStyle(s.key)}
              activeOpacity={0.8}
            >
              <Text style={[styles.styleChipText, isSelected && styles.styleChipTextSelected]}>
                {s.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* ─── Luxury Feed Type Tabs ─── */}
      <View style={styles.tabContainer}>
        <View style={styles.tabPillWrap}>
          {TABS.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                style={[styles.tabButton, isActive && styles.tabButtonActive]}
                onPress={() => setActiveTab(tab.key)}
                activeOpacity={0.85}
              >
                <Text style={[styles.tabButtonText, isActive && styles.tabButtonTextActive]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {isLoading ? (
        <View style={{ flex: 1 }}>
          <ListHeader />
          <FeedSkeleton />
        </View>
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          ListHeaderComponent={<ListHeader />}
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.4}
          ListFooterComponent={renderFooter}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={() => void refetch()}
              tintColor={Colors.charcoal}
            />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <View style={styles.emptyIconWrap}>
                <Text style={styles.emptyIcon}>✦</Text>
              </View>
              <Text style={styles.emptyTitle}>Curating New Looks</Text>
              <Text style={styles.emptyBody}>
                {selectedStyle !== 'all'
                  ? `No looks found under "${selectedStyle.replace(/_/g, ' ')}". Try selecting All Drops or explore more styles.`
                  : activeTab === 'following'
                  ? 'Follow creators to see their personal styles and daily outfit drops here.'
                  : 'Check back soon for fresh community drops and trend edits.'}
              </Text>

              {selectedStyle !== 'all' ? (
                <TouchableOpacity
                  style={styles.emptyCta}
                  onPress={() => setSelectedStyle('all')}
                  activeOpacity={0.85}
                >
                  <Text style={styles.emptyCtaText}>View All Drops</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={styles.emptyCta}
                  onPress={() => router.push('/(tabs)/create')}
                  activeOpacity={0.85}
                >
                  <Text style={styles.emptyCtaText}>Share Your Look</Text>
                </TouchableOpacity>
              )}
            </View>
          }
          showsVerticalScrollIndicator={false}
          contentContainerStyle={posts.length === 0 ? { flexGrow: 1 } : undefined}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.warmWhite,
  },
  headerBlock: {
    backgroundColor: Colors.warmWhite,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    paddingBottom: Spacing[2],
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing[4],
    paddingTop: Spacing[2],
    paddingBottom: Spacing[2],
  },
  brandGroup: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: Spacing[2],
  },
  brandTitle: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.base,
    fontWeight: '800',
    letterSpacing: 4,
    color: Colors.charcoal,
  },
  brandSubtitle: {
    fontFamily: Typography.fontBody,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1.5,
    color: Colors.darkGray,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
  },
  headerActionBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  headerActionIcon: {
    fontSize: 16,
  },
  notifBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: Colors.likeActive,
  },
  styleScroll: {
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[2],
    gap: Spacing[2],
  },
  styleChip: {
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[1] + 2,
    borderRadius: Radii.full,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  styleChipSelected: {
    backgroundColor: Colors.charcoal,
    borderColor: Colors.charcoal,
  },
  styleChipText: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.xs,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  styleChipTextSelected: {
    color: Colors.warmWhite,
  },
  tabContainer: {
    paddingHorizontal: Spacing[4],
    paddingTop: Spacing[1],
  },
  tabPillWrap: {
    flexDirection: 'row',
    backgroundColor: Colors.softGray,
    borderRadius: Radii.full,
    padding: 3,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing[2],
    borderRadius: Radii.full,
  },
  tabButtonActive: {
    backgroundColor: Colors.surface,
    ...Shadows.sm,
  },
  tabButtonText: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.xs,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  tabButtonTextActive: {
    color: Colors.charcoal,
    fontWeight: '700',
  },
  footer: {
    paddingVertical: Spacing[6],
    alignItems: 'center',
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing[8],
    paddingVertical: Spacing[10],
    gap: Spacing[3],
  },
  emptyIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.softGray,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing[1],
  },
  emptyIcon: {
    fontSize: 28,
    color: Colors.charcoal,
  },
  emptyTitle: {
    fontFamily: Typography.fontDisplay,
    fontSize: Typography.xl,
    color: Colors.charcoal,
    fontWeight: '600',
    textAlign: 'center',
  },
  emptyBody: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: Typography.sm * 1.5,
    maxWidth: 280,
  },
  emptyCta: {
    marginTop: Spacing[2],
    backgroundColor: Colors.charcoal,
    paddingHorizontal: Spacing[5],
    paddingVertical: Spacing[3],
    borderRadius: Radii.full,
  },
  emptyCtaText: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.sm,
    fontWeight: '600',
    color: Colors.warmWhite,
  },
});
