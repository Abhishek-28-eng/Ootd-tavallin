// ============================================================
// Home Feed — OOTDi Editorial Studio Feed
// ============================================================

import React, { useState, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Image as RNImage,
} from 'react-native';

const OOTDiLogo = require('../../assets/images/ootdi-logo.png');
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radii, Shadows } from '../../src/design/tokens';
import { useHomeFeed, useToggleLike, useToggleSave } from '../../src/hooks/useOutfitFeed';
import { useStoryCurators } from '../../src/hooks/useUserProfile';
import { EditorialOutfitCard } from '../../src/components/OutfitCard';
import { FeedSkeleton } from '../../src/components/Skeletons';
import type { OutfitPost } from '@tavallin/shared';

type FeedTab = 'personalized' | 'following';

const TABS: { key: FeedTab; label: string }[] = [
  { key: 'personalized', label: 'For You' },
  { key: 'following', label: 'Following' },
];

// Mock story avatars (real app: pull from following)
const STORIES = [
  { id: 'new', label: 'POST FIT', isNew: true },
  { id: 's1', label: 'ring', initials: 'RI' },
  { id: 's2', label: '@only.ung', initials: 'OU' },
  { id: 's3', label: 'season', initials: 'SE' },
  { id: 's4', label: '@dek', initials: 'DK' },
  { id: 's5', label: 'miu', initials: 'MI' },
  { id: 's6', label: 'nova', initials: 'NV' },
];

export default function HomeScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<FeedTab>('personalized');
  const [isManualRefreshing, setIsManualRefreshing] = useState(false);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, refresh, isRefetching } =
    useHomeFeed(activeTab);
  const { data: storyCurators = [] } = useStoryCurators(10);
  const { mutate: toggleLike } = useToggleLike();
  const { mutate: toggleSave } = useToggleSave();

  const posts = data?.pages.flatMap((p) => p.posts) ?? [];

  const handleRefresh = useCallback(async () => {
    setIsManualRefreshing(true);
    try {
      await refresh();
    } finally {
      setIsManualRefreshing(false);
    }
  }, [refresh]);

  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) void fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const renderItem = useCallback(
    ({ item }: { item: OutfitPost }) => (
      <EditorialOutfitCard
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
      ) : !isLoading && !isFetchingNextPage && posts.length > 0 ? (
        <CurationVolumeBanner onExplore={() => router.push('/(tabs)/explore')} />
      ) : null,
    [isFetchingNextPage, isLoading, posts.length, router],
  );

  const ListHeader = () => (
    <View>
      {/* ─── Top Bar ─── */}
      <View style={styles.topBar}>
        <View style={styles.topBarLeft}>
          <RNImage source={OOTDiLogo} style={styles.topBarLogo} resizeMode="contain" />
          <View style={styles.topBarDivider} />
          <View>
            <Text style={styles.topBarSection}>HOME</Text>
            <Text style={styles.topBarSub}>FEED</Text>
          </View>
        </View>
        <View style={styles.topBarActions}>
          <TouchableOpacity
            style={styles.topBarIconBtn}
            onPress={() => router.push('/(tabs)/explore')}
            activeOpacity={0.7}
          >
            <Ionicons name="search" size={18} color={Colors.charcoal} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.topBarIconBtn}
            onPress={() => router.push('/(tabs)/notifications')}
            activeOpacity={0.7}
          >
            <Ionicons name="notifications-outline" size={18} color={Colors.charcoal} />
            <View style={styles.notifDot} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.topBarAvatar}
            onPress={() => router.push('/(tabs)/profile')}
            activeOpacity={0.8}
          />
        </View>
      </View>

      {/* ─── Tab Strip ─── */}
      <View style={styles.tabStrip}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabStripContent}
        >
          {TABS.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                style={styles.tabItem}
                onPress={() => setActiveTab(tab.key)}
                activeOpacity={0.8}
              >
                <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                  {tab.label}
                </Text>
                {isActive && <View style={styles.tabUnderline} />}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* ─── Stories Row ─── */}
      <View style={styles.storiesWrap}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.storiesContent}
        >
          {/* Post fit action */}
          <TouchableOpacity
            style={styles.storyItem}
            activeOpacity={0.8}
            onPress={() => router.push('/(tabs)/create')}
          >
            <View style={styles.storyNewCircle}>
              <Ionicons name="add" size={20} color={Colors.charcoal} />
            </View>
            <Text style={styles.storyLabel} numberOfLines={1}>POST FIT</Text>
          </TouchableOpacity>

          {/* Curators from API or fallback */}
          {(storyCurators.length > 0
            ? storyCurators.map((c) => ({
                id: c.id,
                username: c.username,
                label: c.username,
                initials: c.initials,
                avatarUrl: c.avatarUrl,
              }))
            : STORIES.filter((s) => !s.isNew).map((s) => ({
                id: s.id,
                username: s.label.replace('@', ''),
                label: s.label,
                initials: s.initials,
                avatarUrl: null as string | null,
              }))
          ).map((story) => (
            <TouchableOpacity
              key={story.id}
              style={styles.storyItem}
              activeOpacity={0.8}
              onPress={() => router.push(`/user/${story.username}`)}
            >
              <View style={styles.storyRing}>
                <View style={styles.storyAvatar}>
                  {story.avatarUrl ? (
                    <RNImage source={{ uri: story.avatarUrl }} style={{ width: '100%', height: '100%', borderRadius: 24 }} />
                  ) : (
                    <Text style={styles.storyInitial}>{story.initials}</Text>
                  )}
                </View>
              </View>
              <Text style={styles.storyLabel} numberOfLines={1}>{story.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Thin divider */}
      <View style={styles.stripDivider} />
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
          onEndReachedThreshold={0.5}
          ListFooterComponent={renderFooter}
          refreshControl={
            <RefreshControl
              refreshing={isManualRefreshing || isRefetching}
              onRefresh={() => void handleRefresh()}
              tintColor={Colors.charcoal}
              title="Loading latest posts..."
              titleColor={Colors.charcoal}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>Curating Fresh Drops</Text>
              <Text style={styles.emptyBody}>
                {activeTab === 'following'
                  ? 'Follow curators to see their outfit drops here.'
                  : 'Check back soon for fresh community looks.'}
              </Text>
              <TouchableOpacity
                style={styles.emptyCta}
                onPress={() => router.push('/(tabs)/explore')}
                activeOpacity={0.85}
              >
                <Text style={styles.emptyCtaText}>EXPLORE LOOKS</Text>
              </TouchableOpacity>
            </View>
          }
          showsVerticalScrollIndicator={false}
          contentContainerStyle={posts.length === 0 ? { flexGrow: 1 } : undefined}
        />
      )}
    </SafeAreaView>
  );
}

// ─── Curation Volume Banner ────────────────────────────────────
function CurationVolumeBanner({ onExplore }: { onExplore: () => void }) {
  return (
    <View style={styles.curationBanner}>
      <Text style={styles.curationVol}>CURATION VOLUME 43</Text>
      <Text style={styles.curationTitle}>You are completely{'\n'}up to date.</Text>
      <Text style={styles.curationBody}>
        Fresh seasonal edits drop at 10:00 IST daily.{'\n'}Explore lookbooks curated by the OOTDi collective.
      </Text>
      <TouchableOpacity style={styles.curationBtn} onPress={onExplore} activeOpacity={0.85}>
        <Text style={styles.curationBtnText}>EXPLORE TRENDS</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF8F5',
  },

  // ─── Top Bar ──────────────────────────────────────────────
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FAF8F5',
    borderBottomWidth: 1,
    borderBottomColor: '#EBE6DE',
  },
  topBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  topBarLogo: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  topBarDivider: {
    width: 1,
    height: 18,
    backgroundColor: '#D4CEBF',
    transform: [{ rotate: '15deg' }],
    marginHorizontal: 2,
  },
  topBarSection: {
    fontFamily: Typography.fontBody,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.5,
    color: Colors.charcoal,
    lineHeight: 13,
  },
  topBarSub: {
    fontFamily: Typography.fontBody,
    fontSize: 9,
    fontWeight: '600',
    letterSpacing: 1.2,
    color: Colors.textTertiary,
    lineHeight: 12,
  },
  topBarActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  topBarIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8E3DA',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  notifDot: {
    position: 'absolute',
    top: 7,
    right: 7,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: Colors.likeActive,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  topBarAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.charcoal,
  },

  // ─── Tab Strip ────────────────────────────────────────────
  tabStrip: {
    backgroundColor: '#FAF8F5',
    borderBottomWidth: 1,
    borderBottomColor: '#EBE6DE',
  },
  tabStripContent: {
    paddingHorizontal: 16,
    paddingVertical: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  tabItem: {
    paddingHorizontal: 8,
    paddingVertical: 10,
    alignItems: 'center',
    position: 'relative',
  },
  tabText: {
    fontFamily: Typography.fontBody,
    fontSize: 13,
    fontWeight: '500',
    color: Colors.textTertiary,
    letterSpacing: 0.2,
  },
  tabTextActive: {
    color: Colors.charcoal,
    fontWeight: '700',
  },
  tabUnderline: {
    position: 'absolute',
    bottom: 0,
    left: 8,
    right: 8,
    height: 1.5,
    backgroundColor: Colors.charcoal,
    borderRadius: 1,
  },

  // ─── Stories ──────────────────────────────────────────────
  storiesWrap: {
    backgroundColor: '#FAF8F5',
    paddingVertical: 10,
  },
  storiesContent: {
    paddingHorizontal: 12,
    gap: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  storyItem: {
    alignItems: 'center',
    gap: 4,
    width: 58,
  },
  storyNewCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 1.5,
    borderColor: '#D4CEBF',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  storyRing: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 1.5,
    borderColor: Colors.charcoal,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 2,
  },
  storyAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E8E3DA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  storyInitial: {
    fontFamily: Typography.fontBody,
    fontSize: 13,
    fontWeight: '700',
    color: Colors.charcoal,
  },
  storyLabel: {
    fontFamily: Typography.fontBody,
    fontSize: 9,
    fontWeight: '500',
    color: Colors.textSecondary,
    textAlign: 'center',
    maxWidth: 56,
  },
  stripDivider: {
    height: 1,
    backgroundColor: '#EBE6DE',
    marginHorizontal: 0,
  },

  // ─── Footer ───────────────────────────────────────────────
  footer: {
    paddingVertical: Spacing[6],
    alignItems: 'center',
  },

  // ─── Empty State ──────────────────────────────────────────
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 64,
    gap: 12,
  },
  emptyTitle: {
    fontFamily: Typography.fontDisplay,
    fontSize: Typography['xl'],
    color: Colors.charcoal,
    fontWeight: '500',
    textAlign: 'center',
  },
  emptyBody: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: Typography.sm * Typography.lineHeightRelaxed,
    maxWidth: 260,
  },
  emptyCta: {
    marginTop: 8,
    backgroundColor: Colors.charcoal,
    paddingHorizontal: Spacing[6],
    paddingVertical: Spacing[3],
    borderRadius: Radii.sm,
  },
  emptyCtaText: {
    fontFamily: Typography.fontBody,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.5,
    color: '#FAF8F5',
  },

  // ─── Curation Volume Banner ───────────────────────────────
  curationBanner: {
    alignItems: 'center',
    paddingVertical: 36,
    paddingHorizontal: 28,
    gap: 8,
    backgroundColor: '#FAF8F5',
    borderTopWidth: 1,
    borderTopColor: '#EBE6DE',
    marginTop: 8,
  },
  curationVol: {
    fontFamily: Typography.fontBody,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 2,
    color: Colors.textTertiary,
    marginBottom: 4,
  },
  curationTitle: {
    fontFamily: Typography.fontDisplay,
    fontSize: 24,
    fontWeight: '500',
    color: Colors.charcoal,
    textAlign: 'center',
    lineHeight: 28,
    letterSpacing: -0.3,
  },
  curationBody: {
    fontFamily: Typography.fontBody,
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 4,
    maxWidth: 260,
  },
  curationBtn: {
    marginTop: 12,
    backgroundColor: '#0A0A0C',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: Radii.sm,
  },
  curationBtnText: {
    fontFamily: Typography.fontBody,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 2,
    color: '#FAF8F5',
  },
});
