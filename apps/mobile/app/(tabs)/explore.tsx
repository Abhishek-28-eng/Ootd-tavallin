// ============================================================
// Explore & Trends — OOTDi Editorial Studio Discovery
// ============================================================

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radii, Shadows } from '../../src/design/tokens';
import { useExploreFeed, useEditorialSpotlight } from '../../src/hooks/useOutfitFeed';
import { useFeaturedCurators } from '../../src/hooks/useUserProfile';
import { STYLE_CATEGORY_LABELS, OCCASION_LABELS } from '@tavallin/shared';
import type { StyleCategory, Occasion, OutfitPost } from '@tavallin/shared';

const { width: SW } = Dimensions.get('window');
const H_PAD = 16;
const COL_GAP = 8;
const LEFT_W = (SW - H_PAD * 2 - COL_GAP) * 0.54;
const RIGHT_W = SW - H_PAD * 2 - COL_GAP - LEFT_W;

// ─── Editorial / Static Trend Data ────────────────────────────
const STYLE_TAGS: { key: StyleCategory; short: string }[] = [
  { key: 'minimal', short: 'MINIMAL' },
  { key: 'old_money', short: 'OLD MONEY' },
  { key: 'streetwear', short: 'STREET' },
  { key: 'korean_streetwear', short: 'K-STREET' },
  { key: 'smart_casual', short: 'SMART' },
  { key: 'formal', short: 'FORMAL' },
  { key: 'dark_academia', short: 'DARK ACAD.' },
  { key: 'athleisure', short: 'ATHLEISURE' },
  { key: 'bohemian', short: 'BOHO' },
] as unknown as { key: StyleCategory; short: string }[];

const OCCASION_TAGS: { key: Occasion; short: string }[] = [
  { key: 'work', short: 'OFFICE' },
  { key: 'college', short: 'CAMPUS' },
  { key: 'date_night', short: 'DATE NIGHT' },
  { key: 'party', short: 'PARTY' },
  { key: 'formal_event', short: 'FORMAL' },
  { key: 'travel', short: 'TRAVEL' },
  { key: 'brunch', short: 'BRUNCH' },
] as unknown as { key: Occasion; short: string }[];

// Style label -> overlay tag string
const STYLE_TAG_MAP: Record<string, string> = {
  minimal: 'MINIMAL',
  old_money: 'OLD MONEY',
  streetwear: 'STREETWEAR',
  korean_streetwear: 'K-STREET',
  smart_casual: 'SMART',
  formal: 'FORMAL',
  dark_academia: 'DARK ACAD.',
  athleisure: 'ATHLEISURE',
  bohemian: 'BOHO',
  casual: 'CASUAL',
  y2k: 'Y2K',
  preppy: 'PREPPY',
  grunge: 'GRUNGE',
  vintage: 'VINTAGE',
  romantic: 'ROMANTIC',
  ethnic_traditional: 'ETHNIC',
  festive: 'FESTIVE',
  cottagecore: 'COTTAGE',
  business_casual: 'BIZ CASUAL',
  androgynous: 'ANDROGYNOUS',
  eclectic: 'ECLECTIC',
};

const OCCASION_TAG_MAP: Record<string, string> = {
  work: 'OFFICE',
  college: 'CAMPUS',
  date_night: 'DATE NIGHT',
  party: 'PARTY',
  formal_event: 'FORMAL',
  travel: 'TRAVEL',
  brunch: 'BRUNCH',
  beach: 'BEACH',
  gym_fitness: 'GYM',
  outdoor: 'OUTDOOR',
  night_out: 'NIGHT OUT',
  home_cozy: 'AT HOME',
  wedding: 'WEDDING',
  everyday: 'EVERYDAY',
  festive_puja: 'FESTIVE',
};

function getOverlayTag(post: OutfitPost): string | null {
  const styles = (post as any).styleCategories ?? (post as any).styles ?? [];
  const occasions = (post as any).occasions ?? [];
  if (styles.length > 0) return STYLE_TAG_MAP[styles[0]] ?? null;
  if (occasions.length > 0) return OCCASION_TAG_MAP[occasions[0]] ?? null;
  return null;
}

function formatCount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

// ─── Card Components ──────────────────────────────────────────

function EditorialCard({
  post,
  style,
  height,
  onPress,
}: {
  post: OutfitPost;
  style?: object;
  height: number;
  onPress: () => void;
}) {
  const media = post.media?.[0] as any;
  const imgUrl = media?.url ?? media?.publicUrl ?? '';
  const creator = (post.creator ?? (post as any).author) as any;
  const username = creator?.username ?? '';
  const likes = post.likesCount ?? 0;
  const tag = getOverlayTag(post);

  return (
    <TouchableOpacity
      style={[styles.editorialCard, { height }, style]}
      activeOpacity={0.88}
      onPress={onPress}
    >
      <Image
        source={{ uri: imgUrl }}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        cachePolicy="memory-disk"
        transition={250}
      />
      {/* Dark scrim */}
      <View style={styles.cardScrim} />

      {/* Bookmark button */}
      <TouchableOpacity style={styles.bookmarkBtn} activeOpacity={0.8}>
        <Ionicons name="bookmark-outline" size={14} color="#fff" />
      </TouchableOpacity>

      {/* Bottom overlay */}
      <View style={styles.cardBottom}>
        {tag && (
          <View style={styles.tagPill}>
            <Text style={styles.tagPillText}>{tag}</Text>
          </View>
        )}
        <View style={styles.cardMeta}>
          <Text style={styles.cardUsername} numberOfLines={1}>@{username}</Text>
          <View style={styles.cardLikes}>
            <Ionicons name="heart" size={10} color={Colors.likeActive} />
            <Text style={styles.cardLikesText}>{formatCount(likes)}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ─── Main Screen ──────────────────────────────────────────────

export default function ExploreScreen() {
  const router = useRouter();
  const [searchText, setSearchText] = useState('');
  const [committedTag, setCommittedTag] = useState<string | undefined>();
  const [selectedStyle, setSelectedStyle] = useState<StyleCategory | undefined>();
  const [selectedOccasion, setSelectedOccasion] = useState<Occasion | undefined>();
  const [filterMode, setFilterMode] = useState<'style' | 'occasion'>('style');
  const [showSearch, setShowSearch] = useState(false);

  const filters: { style?: string; occasion?: string; tag?: string } = {};
  if (selectedStyle) filters.style = selectedStyle;
  if (selectedOccasion) filters.occasion = selectedOccasion;
  if (committedTag) filters.tag = committedTag;

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useExploreFeed(filters);
  const { data: spotlight } = useEditorialSpotlight();
  const { data: featuredCurators = [] } = useFeaturedCurators(8);

  const posts = data?.pages.flatMap((p) => p.posts) ?? [];

  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) void fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const handleSearch = useCallback(() => {
    setCommittedTag(searchText.trim() || undefined);
    setShowSearch(false);
  }, [searchText]);

  const clearFilters = () => {
    setSelectedStyle(undefined);
    setSelectedOccasion(undefined);
    setCommittedTag(undefined);
    setSearchText('');
  };

  const hasActiveFilter = selectedStyle || selectedOccasion || committedTag;

  // Build editorial left/right columns from posts
  // Left col: items at indices 0, 2, 4, ...
  // Right col: items at indices 1, 3, 5, ...
  const leftPosts = posts.filter((_, i) => i % 2 === 0).slice(0, 8);
  const rightPosts = posts.filter((_, i) => i % 2 === 1).slice(0, 8);

  // Alternate tall/short heights for editorial feel
  const leftHeights = [260, 200, 280, 220];
  const rightHeights = [180, 260, 200, 260];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* ─── Editorial Top Bar ─── */}
      <View style={styles.topBar}>
        <View style={styles.topBarLeft}>
          <Text style={styles.topBarBrand}>OOTDi</Text>
          <View style={styles.topBarSlash}><Text style={styles.topBarSlashText}>/</Text></View>
          <View>
            <Text style={styles.topBarSection}>EXPLORE</Text>
            <Text style={styles.topBarSub}>AND TRENDS</Text>
          </View>
        </View>
        <View style={styles.topBarActions}>
          <TouchableOpacity
            style={styles.topBarIcon}
            onPress={() => setShowSearch(!showSearch)}
            activeOpacity={0.7}
          >
            <Ionicons name={showSearch ? 'close' : 'search'} size={19} color={Colors.charcoal} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.topBarIcon} activeOpacity={0.7}>
            <Ionicons name="notifications-outline" size={19} color={Colors.charcoal} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.topBarAvatar}
            onPress={() => router.push('/(tabs)/profile')}
            activeOpacity={0.8}
          />
        </View>
      </View>

      {/* ─── Slide-down Search ─── */}
      {showSearch && (
        <View style={styles.searchBar}>
          <View style={styles.searchInput}>
            <Ionicons name="search-outline" size={15} color={Colors.textTertiary} />
            <TextInput
              style={styles.searchTextField}
              placeholder="Search aesthetics, tags, vibes…"
              placeholderTextColor={Colors.textPlaceholder}
              value={searchText}
              onChangeText={setSearchText}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
              autoFocus
            />
            {searchText.length > 0 && (
              <TouchableOpacity onPress={() => setSearchText('')}>
                <Ionicons name="close-circle" size={15} color={Colors.textTertiary} />
              </TouchableOpacity>
            )}
          </View>
          {searchText.length > 0 && (
            <TouchableOpacity style={styles.searchGo} onPress={handleSearch} activeOpacity={0.85}>
              <Text style={styles.searchGoText}>GO</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      <ScrollView
        showsVerticalScrollIndicator={false}
        onScroll={({ nativeEvent }) => {
          const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
          if (contentOffset.y + layoutMeasurement.height >= contentSize.height - 400) {
            handleEndReached();
          }
        }}
        scrollEventThrottle={32}
      >
        {/* ─── Hero Spotlight Banner ─── */}
        <View style={styles.heroSpotlight}>
          <View style={styles.heroGradient} />
          <View style={styles.heroContent}>
            <View style={styles.issueBadge}>
              <View style={styles.issueDot} />
              <Text style={styles.issueBadgeText}>{spotlight?.issue ?? 'ISSUE SPOTLIGHT'}</Text>
            </View>
            <Text style={styles.heroSeason}>{spotlight?.season ?? 'FW 2025 · SEOUL'}</Text>
            <Text style={styles.heroVolume}>{spotlight?.volume ?? 'VOLUME 04 — EDITORIAL SELECTION'}</Text>
            <Text style={styles.heroTitle}>{spotlight?.title ?? 'Neo-Tailoring & Seoul Minimalism'}</Text>
            <TouchableOpacity style={styles.heroBtn} activeOpacity={0.85}>
              <Text style={styles.heroBtnText}>DISCOVER LOOKBOOK →</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ─── Filter Chips ─── */}
        <View style={styles.filterSection}>
          {/* Mode toggle */}
          <View style={styles.modeRow}>
            <TouchableOpacity
              style={[styles.modeBtn, filterMode === 'style' && styles.modeBtnActive]}
              onPress={() => setFilterMode('style')}
            >
              <Text style={[styles.modeBtnText, filterMode === 'style' && styles.modeBtnTextActive]}>
                AESTHETIC
              </Text>
            </TouchableOpacity>
            <View style={styles.modeSep} />
            <TouchableOpacity
              style={[styles.modeBtn, filterMode === 'occasion' && styles.modeBtnActive]}
              onPress={() => setFilterMode('occasion')}
            >
              <Text style={[styles.modeBtnText, filterMode === 'occasion' && styles.modeBtnTextActive]}>
                SETTING
              </Text>
            </TouchableOpacity>
            {hasActiveFilter && (
              <>
                <View style={styles.modeSep} />
                <TouchableOpacity style={styles.clearPill} onPress={clearFilters}>
                  <Text style={styles.clearPillText}>CLEAR</Text>
                </TouchableOpacity>
              </>
            )}
          </View>

          {/* Chip scroller */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipsRow}
          >
            {filterMode === 'style'
              ? STYLE_TAGS.map(({ key, short }) => {
                  const active = selectedStyle === (key as unknown as StyleCategory);
                  return (
                    <TouchableOpacity
                      key={key}
                      style={[styles.chip, active && styles.chipActive]}
                      onPress={() => setSelectedStyle(active ? undefined : (key as unknown as StyleCategory))}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.chipText, active && styles.chipTextActive]}>{short}</Text>
                    </TouchableOpacity>
                  );
                })
              : OCCASION_TAGS.map(({ key, short }) => {
                  const active = selectedOccasion === (key as unknown as Occasion);
                  return (
                    <TouchableOpacity
                      key={key}
                      style={[styles.chip, active && styles.chipActive]}
                      onPress={() => setSelectedOccasion(active ? undefined : (key as unknown as Occasion))}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.chipText, active && styles.chipTextActive]}>{short}</Text>
                    </TouchableOpacity>
                  );
                })}
          </ScrollView>
        </View>

        {/* ─── Editorial Curation Grid ─── */}
        <View style={styles.curationSection}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionHeaderLeft}>
              <View style={styles.sectionPip} />
              <Text style={styles.sectionTitle}>EDITORIAL CURATION</Text>
            </View>
            <Text style={styles.realtimeLabel}>+ REALTIME INDEX</Text>
          </View>

          {isLoading ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator color={Colors.charcoal} />
            </View>
          ) : posts.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>No Looks Found</Text>
              <Text style={styles.emptyBody}>Refine your filters or explore all.</Text>
              {hasActiveFilter && (
                <TouchableOpacity style={styles.emptyCta} onPress={clearFilters}>
                  <Text style={styles.emptyCtaText}>Clear Filters</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <View style={styles.masonryWrap}>
              {/* Left Column */}
              <View style={styles.masonryCol}>
                {leftPosts.map((post, i) => (
                  <EditorialCard
                    key={post.id}
                    post={post}
                    height={leftHeights[i % leftHeights.length]!}
                    onPress={() => router.push(`/outfit/${post.id}`)}
                    style={{ marginBottom: COL_GAP }}
                  />
                ))}
              </View>
              {/* Right Column */}
              <View style={[styles.masonryCol, { marginLeft: COL_GAP }]}>
                {rightPosts.map((post, i) => (
                  <EditorialCard
                    key={post.id}
                    post={post}
                    height={rightHeights[i % rightHeights.length]!}
                    onPress={() => router.push(`/outfit/${post.id}`)}
                    style={{ marginBottom: COL_GAP }}
                  />
                ))}
              </View>
            </View>
          )}

          {/* Load More */}
          {isFetchingNextPage && (
            <View style={styles.loadMoreRow}>
              <ActivityIndicator color={Colors.charcoal} size="small" />
            </View>
          )}
        </View>

        {/* ─── Atelier Directory ─── */}
        <View style={styles.directorySection}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionHeaderLeft}>
              <Text style={styles.directorySectionLabel}>ATELIER DIRECTORY</Text>
              <Text style={styles.directoryTitle}>Featured Stylists{'\n'}& Creators</Text>
            </View>
            <TouchableOpacity style={styles.directoryBtn} activeOpacity={0.8}>
              <Text style={styles.directoryBtnText}>DIRECTORY</Text>
              <Ionicons name="arrow-forward" size={12} color={Colors.charcoal} />
            </TouchableOpacity>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.creatorsRow}
          >
            {(featuredCurators.length > 0
              ? featuredCurators.map((c) => ({
                  username: c.username,
                  name: c.displayName || c.username,
                  sub: c.styleSignature || 'SEOUL MINIMAL',
                  initials: (c.displayName || c.username).slice(0, 2).toUpperCase(),
                  avatarUrl: c.avatarUrl,
                }))
              : [
                  { username: 'minjae.park', name: 'Minjae Park', sub: 'SEOUL MINIMAL', initials: 'MP', avatarUrl: null },
                  { username: 'chloe.d', name: 'Chloe D.', sub: 'ARCHIVE STUDIO', initials: 'CD', avatarUrl: null },
                  { username: 'aarav.m', name: 'Aarav M.', sub: 'QUIET LUXURY', initials: 'AM', avatarUrl: null },
                  { username: 'zoya.k', name: 'Zoya K.', sub: 'FUSION COUTURE', initials: 'ZK', avatarUrl: null },
                  { username: 'kyoto.fits', name: 'Kyoto Archive', sub: 'STREETWEAR', initials: 'KA', avatarUrl: null },
                ]
            ).map((creator, i) => (
              <TouchableOpacity
                key={i}
                style={styles.creatorCard}
                activeOpacity={0.8}
                onPress={() => router.push(`/user/${creator.username}`)}
              >
                <View style={styles.creatorRingOuter}>
                  <View style={styles.creatorRingInner}>
                    <View style={styles.creatorAvatar}>
                      {creator.avatarUrl ? (
                        <Image
                          source={{ uri: creator.avatarUrl }}
                          style={{ width: '100%', height: '100%' }}
                          contentFit="cover"
                        />
                      ) : (
                        <Text style={styles.creatorInitials}>{creator.initials}</Text>
                      )}
                    </View>
                  </View>
                </View>
                <Text style={styles.creatorName} numberOfLines={1}>{creator.name}</Text>
                <Text style={styles.creatorSub} numberOfLines={1}>{creator.sub}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Bottom padding */}
        <View style={{ height: Spacing[10] }} />
      </ScrollView>
    </SafeAreaView>
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
    paddingHorizontal: H_PAD,
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
  topBarBrand: {
    fontFamily: Typography.fontBody,
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 1,
    color: Colors.charcoal,
  },
  topBarSlash: {
    width: 1.5,
    height: 18,
    backgroundColor: '#D4CEBF',
    transform: [{ rotate: '15deg' }],
    marginHorizontal: 2,
  },
  topBarSlashText: {
    display: 'none',
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
  topBarIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8E3DA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBarAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.charcoal,
  },

  // ─── Search ───────────────────────────────────────────────
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: H_PAD,
    paddingVertical: 8,
    backgroundColor: '#FAF8F5',
    borderBottomWidth: 1,
    borderBottomColor: '#EBE6DE',
    gap: 8,
  },
  searchInput: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8E3DA',
    borderRadius: Radii.md,
    paddingHorizontal: 12,
    height: 38,
    gap: 8,
  },
  searchTextField: {
    flex: 1,
    fontFamily: Typography.fontBody,
    fontSize: Typography.sm,
    color: Colors.charcoal,
    height: 38,
  },
  searchGo: {
    backgroundColor: '#0A0A0C',
    paddingHorizontal: 14,
    height: 38,
    borderRadius: Radii.md,
    justifyContent: 'center',
  },
  searchGoText: {
    fontFamily: Typography.fontBody,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.5,
    color: '#FAF8F5',
  },

  // ─── Hero Spotlight ───────────────────────────────────────
  heroSpotlight: {
    height: 210,
    backgroundColor: '#1C1C1E',
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  heroGradient: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(10,10,12,0.55)',
  },
  heroContent: {
    padding: H_PAD,
    gap: 4,
  },
  issueBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 4,
  },
  issueDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
  },
  issueBadgeText: {
    fontFamily: Typography.fontBody,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 2,
    color: '#FFFFFF',
  },
  heroSeason: {
    fontFamily: Typography.fontBody,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2,
    color: 'rgba(255,255,255,0.6)',
  },
  heroVolume: {
    fontFamily: Typography.fontBody,
    fontSize: 10,
    fontWeight: '400',
    color: 'rgba(255,255,255,0.45)',
    letterSpacing: 0.5,
  },
  heroTitle: {
    fontFamily: Typography.fontDisplay,
    fontSize: 28,
    lineHeight: 32,
    color: '#FFFFFF',
    fontWeight: '500',
    marginVertical: 4,
    letterSpacing: -0.5,
  },
  heroBtn: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radii.sm,
    marginTop: 4,
  },
  heroBtnText: {
    fontFamily: Typography.fontBody,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
    color: '#FFFFFF',
  },

  // ─── Filter Section ───────────────────────────────────────
  filterSection: {
    paddingTop: 12,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#EBE6DE',
  },
  modeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: H_PAD,
    gap: 6,
    marginBottom: 8,
  },
  modeBtn: {
    paddingVertical: 3,
  },
  modeBtnActive: {},
  modeBtnText: {
    fontFamily: Typography.fontBody,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
    color: Colors.textTertiary,
  },
  modeBtnTextActive: {
    color: Colors.charcoal,
  },
  modeSep: {
    width: 1,
    height: 10,
    backgroundColor: '#D4CEBF',
  },
  clearPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: Colors.errorLight,
    borderRadius: Radii.full,
  },
  clearPillText: {
    fontFamily: Typography.fontBody,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
    color: Colors.error,
  },
  chipsRow: {
    paddingHorizontal: H_PAD,
    paddingBottom: 10,
    gap: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: Radii.sm,
    borderWidth: 1,
    borderColor: '#E8E3DA',
    backgroundColor: '#FFFFFF',
  },
  chipActive: {
    backgroundColor: '#0A0A0C',
    borderColor: '#0A0A0C',
  },
  chipText: {
    fontFamily: Typography.fontBody,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
    color: Colors.textSecondary,
  },
  chipTextActive: {
    color: '#FAF8F5',
  },

  // ─── Editorial Curation ───────────────────────────────────
  curationSection: {
    paddingHorizontal: H_PAD,
    paddingTop: 16,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 12,
  },
  sectionHeaderLeft: {
    flex: 1,
  },
  sectionPip: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: Colors.charcoal,
    marginBottom: 4,
  },
  sectionTitle: {
    fontFamily: Typography.fontBody,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.5,
    color: Colors.charcoal,
  },
  realtimeLabel: {
    fontFamily: Typography.fontBody,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1,
    color: Colors.gold,
  },

  // ─── Masonry Grid ─────────────────────────────────────────
  masonryWrap: {
    flexDirection: 'row',
  },
  masonryCol: {
    flex: 1,
  },

  // ─── Editorial Card ───────────────────────────────────────
  editorialCard: {
    borderRadius: Radii.md,
    overflow: 'hidden',
    backgroundColor: '#E8E3DA',
  },
  cardScrim: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.18)',
  },
  bookmarkBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 8,
    gap: 4,
  },
  tagPill: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(0,0,0,0.72)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 3,
    marginBottom: 2,
  },
  tagPillText: {
    fontFamily: Typography.fontBody,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.2,
    color: '#FFFFFF',
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardUsername: {
    fontFamily: Typography.fontBody,
    fontSize: 10,
    fontWeight: '500',
    color: '#FFFFFF',
    flex: 1,
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  cardLikes: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  cardLikesText: {
    fontFamily: Typography.fontBody,
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // ─── Loading / Empty ──────────────────────────────────────
  loadingRow: {
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadMoreRow: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  emptyState: {
    paddingTop: 48,
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 32,
    paddingBottom: 48,
  },
  emptyTitle: {
    fontFamily: Typography.fontDisplay,
    fontSize: Typography['xl'],
    color: Colors.charcoal,
    fontWeight: '500',
  },
  emptyBody: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  emptyCta: {
    marginTop: 8,
    backgroundColor: Colors.charcoal,
    paddingHorizontal: Spacing[5],
    paddingVertical: Spacing[3],
    borderRadius: Radii.full,
  },
  emptyCtaText: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.xs,
    fontWeight: '700',
    color: Colors.warmWhite,
  },

  // ─── Atelier Directory ────────────────────────────────────
  directorySection: {
    paddingHorizontal: H_PAD,
    paddingTop: 24,
  },
  directorySectionLabel: {
    fontFamily: Typography.fontBody,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.8,
    color: Colors.textTertiary,
    marginBottom: 3,
  },
  directoryTitle: {
    fontFamily: Typography.fontDisplay,
    fontSize: 20,
    lineHeight: 23,
    color: Colors.charcoal,
    fontWeight: '500',
  },
  directoryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F5F2EC',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radii.sm,
    borderWidth: 1,
    borderColor: '#E8E3DA',
  },
  directoryBtnText: {
    fontFamily: Typography.fontBody,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    color: Colors.charcoal,
  },
  creatorsRow: {
    marginTop: 14,
    paddingBottom: 4,
    gap: 14,
    flexDirection: 'row',
  },
  creatorCard: {
    alignItems: 'center',
    gap: 6,
    width: 80,
  },
  creatorRingOuter: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 1.5,
    borderColor: '#D4CEBF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  creatorRingInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: '#E8E3DA',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  creatorAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.charcoal,
    alignItems: 'center',
    justifyContent: 'center',
  },
  creatorInitials: {
    fontFamily: Typography.fontBody,
    fontSize: 14,
    fontWeight: '700',
    color: '#FAF8F5',
    letterSpacing: 0.5,
  },
  creatorName: {
    fontFamily: Typography.fontBody,
    fontSize: 12,
    fontWeight: '700',
    color: Colors.charcoal,
    textAlign: 'center',
  },
  creatorSub: {
    fontFamily: Typography.fontBody,
    fontSize: 9,
    fontWeight: '600',
    letterSpacing: 0.8,
    color: Colors.textTertiary,
    textAlign: 'center',
  },
});
