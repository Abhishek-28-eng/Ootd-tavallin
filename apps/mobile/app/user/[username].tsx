// ============================================================
// User Profile Screen — Tavallin Luxury Public Curator Lookbook
// ============================================================

import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons, Feather } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radii, Shadows } from '../../src/design/tokens';
import { useUserProfile, useUserPosts, useToggleFollow } from '../../src/hooks/useUserProfile';
import { useAuthStore } from '../../src/stores/authStore';
import { GridSkeleton } from '../../src/components/Skeletons';
import type { OutfitSummary } from '@tavallin/shared';

const { width: SW } = Dimensions.get('window');
const COLS = 3;
const GAP = 2;
const THUMB_SIZE = (SW - GAP * (COLS - 1)) / COLS;

function StatBlock({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.statBlock}>
      <Text style={styles.statValue}>
        {value && value >= 1000 ? `${(value / 1000).toFixed(1)}k` : (value ?? 0)}
      </Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export default function UserProfileScreen() {
  const { username } = useLocalSearchParams<{ username: string }>();
  const router = useRouter();
  const { user: me } = useAuthStore();

  const { data: profile, isLoading: profileLoading } = useUserProfile(username ?? '');
  const { data: postsData, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading: postsLoading } =
    useUserPosts(username ?? '');
  const { mutate: toggleFollow, isPending: followPending } = useToggleFollow(username ?? '');

  const posts = postsData?.pages.flatMap((p) => p.posts as unknown as OutfitSummary[]) ?? [];
  const isMe = me?.username === username;

  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) void fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const handleShareProfile = async () => {
    try {
      await Share.share({
        message: `Discover @${username}'s curated lookbook and aesthetic formulas on OOTDi: https://ootdi.app/@${username}`,
      });
    } catch {
      // Ignore
    }
  };

  const renderThumb = useCallback(
    ({ item }: { item: OutfitSummary }) => {
      const thumb =
        item.thumbnailUrl ||
        (item as any).media?.[0]?.thumbnailUrl ||
        (item as any).media?.[0]?.publicUrl ||
        (item as any).media?.[0]?.url;

      const mediaCount = (item as any).media?.length ?? 1;

      return (
        <TouchableOpacity
          style={styles.thumb}
          activeOpacity={0.88}
          onPress={() => router.push(`/outfit/${item.id}`)}
        >
          <Image
            source={thumb ? { uri: thumb } : null}
            style={styles.thumbImage}
            contentFit="cover"
            cachePolicy="memory-disk"
            transition={150}
          />
          {mediaCount > 1 && (
            <View style={styles.multiMediaBadge}>
              <Ionicons name="copy-outline" size={10} color={Colors.warmWhite} />
            </View>
          )}
        </TouchableOpacity>
      );
    },
    [router],
  );

  if (profileLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => router.back()} style={styles.iconCircleBtn} activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={18} color={Colors.charcoal} />
          </TouchableOpacity>
        </View>
        <View style={styles.loading}>
          <ActivityIndicator color={Colors.charcoal} />
        </View>
      </SafeAreaView>
    );
  }

  if (!profile) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => router.back()} style={styles.iconCircleBtn} activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={18} color={Colors.charcoal} />
          </TouchableOpacity>
        </View>
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>Curator Not Found</Text>
          <Text style={styles.emptySubtitle}>The requested profile does not exist or has been archived.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const ListHeader = () => (
    <View style={styles.headerContainer}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconCircleBtn} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={18} color={Colors.charcoal} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.headerUsername}>@{profile.username.toUpperCase()}</Text>
          <View style={styles.curatorPill}>
            <Text style={styles.curatorPillText}>✦ CURATOR</Text>
          </View>
        </View>

        <TouchableOpacity onPress={handleShareProfile} style={styles.iconCircleBtn} activeOpacity={0.7}>
          <Ionicons name="share-outline" size={18} color={Colors.charcoal} />
        </TouchableOpacity>
      </View>

      {/* Hero Avatar & Stats */}
      <View style={styles.heroRow}>
        <View style={styles.avatarRing}>
          {profile?.avatarUrl ? (
            <Image
              source={{ uri: profile.avatarUrl }}
              style={styles.avatar}
              contentFit="cover"
              cachePolicy="memory-disk"
            />
          ) : (
            <View style={styles.avatarFallback}>
              <Text style={styles.avatarInitial}>
                {(profile.displayName || profile.username || 'U')[0]?.toUpperCase()}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.statsCard}>
          <StatBlock label="Looks" value={profile.postsCount} />
          <View style={styles.statDivider} />
          <StatBlock label="Followers" value={profile.followersCount} />
          <View style={styles.statDivider} />
          <StatBlock label="Following" value={profile.followingCount} />
        </View>
      </View>

      {/* Bio Section */}
      <View style={styles.bioSection}>
        <View style={styles.nameRow}>
          <Text style={styles.displayName}>{profile.displayName || profile.username}</Text>
          <View style={styles.verifiedBadgeWrap}>
            <Ionicons name="checkmark-circle" size={16} color={Colors.gold} />
          </View>
          {profile.isPrivate && (
            <View style={styles.privatePill}>
              <Ionicons name="lock-closed" size={11} color={Colors.textSecondary} />
              <Text style={styles.privatePillText}>Private</Text>
            </View>
          )}
        </View>

        {profile.bio ? <Text style={styles.bioText}>{profile.bio}</Text> : null}

        {profile.location ? (
          <View style={styles.locationPill}>
            <Ionicons name="location-outline" size={11} color={Colors.darkGray} />
            <Text style={styles.locationText}>{profile.location}</Text>
          </View>
        ) : null}
      </View>

      {/* Follow / Actions Row */}
      {!isMe && (
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.followBtn, profile.isFollowing && styles.followingBtn]}
            onPress={() => toggleFollow(profile.isFollowing)}
            disabled={followPending}
            activeOpacity={0.85}
          >
            {followPending ? (
              <ActivityIndicator color={profile.isFollowing ? Colors.charcoal : Colors.warmWhite} size="small" />
            ) : profile.isFollowing ? (
              <>
                <Ionicons name="checkmark-sharp" size={16} color={Colors.gold} />
                <Text style={styles.followingBtnText}>Following</Text>
              </>
            ) : (
              <>
                <Feather name="plus" size={16} color={Colors.warmWhite} />
                <Text style={styles.followBtnText}>Follow Lookbook</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* Section Divider */}
      <View style={styles.gridSectionBar}>
        <View style={styles.gridBarLine} />
        <Text style={styles.gridBarLabel}>CURATED LOOKS ({posts.length})</Text>
        <View style={styles.gridBarLine} />
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={renderThumb}
        numColumns={COLS}
        columnWrapperStyle={styles.columnWrapper}
        ListHeaderComponent={<ListHeader />}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.4}
        ListFooterComponent={
          postsLoading ? (
            <GridSkeleton />
          ) : isFetchingNextPage ? (
            <ActivityIndicator color={Colors.charcoal} style={{ marginVertical: Spacing[4] }} />
          ) : null
        }
        ListEmptyComponent={
          !postsLoading ? (
            profile.isPrivate && !isMe && !profile.isFollowing ? (
              <View style={styles.privateWrap}>
                <View style={styles.lockCircle}>
                  <Ionicons name="lock-closed" size={28} color={Colors.gold} />
                </View>
                <Text style={styles.privateTitle}>Private Wardrobe Archive</Text>
                <Text style={styles.privateSubtitle}>
                  Follow @{profile.username} to view their full outfit entries and curated moodboards.
                </Text>
              </View>
            ) : (
              <View style={styles.empty}>
                <View style={styles.emptyIconWrap}>
                  <Text style={styles.emptyIcon}>✦</Text>
                </View>
                <Text style={styles.emptyTitle}>No Outfits Yet</Text>
                <Text style={styles.emptySubtitle}>This curator hasn't shared any looks to their digital closet yet.</Text>
              </View>
            )
          ) : null
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
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerContainer: {
    backgroundColor: Colors.warmWhite,
    paddingBottom: Spacing[1],
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
  },
  headerUsername: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.sm,
    fontWeight: '800',
    letterSpacing: 1.5,
    color: Colors.charcoal,
  },
  curatorPill: {
    backgroundColor: Colors.goldDust,
    paddingHorizontal: Spacing[2],
    paddingVertical: 2,
    borderRadius: Radii.full,
    borderWidth: 1,
    borderColor: Colors.borderGold,
  },
  curatorPillText: {
    fontFamily: Typography.fontBody,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
    color: Colors.textGold,
  },

  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing[4],
    paddingTop: Spacing[4],
    gap: Spacing[4],
  },
  avatarRing: {
    width: 82,
    height: 82,
    borderRadius: 41,
    borderWidth: 2,
    borderColor: Colors.gold,
    padding: 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
  },
  avatar: {
    width: '100%',
    height: '100%',
    borderRadius: 39,
    backgroundColor: Colors.softGray,
  },
  avatarFallback: {
    width: '100%',
    height: '100%',
    borderRadius: 39,
    backgroundColor: Colors.charcoal,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontFamily: Typography.fontBody,
    fontSize: Typography['2xl'],
    fontWeight: '700',
    color: Colors.warmWhite,
  },

  statsCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: Colors.surface,
    paddingVertical: Spacing[3],
    paddingHorizontal: Spacing[2],
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    ...Shadows.sm,
  },
  statBlock: {
    alignItems: 'center',
    gap: 2,
  },
  statValue: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.base,
    fontWeight: '800',
    color: Colors.charcoal,
  },
  statLabel: {
    fontFamily: Typography.fontBody,
    fontSize: 10,
    color: Colors.textSecondary,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statDivider: {
    width: 1,
    height: 20,
    backgroundColor: Colors.borderLight,
  },

  bioSection: {
    paddingHorizontal: Spacing[4],
    paddingTop: Spacing[3],
    gap: Spacing[1],
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  displayName: {
    fontFamily: Typography.fontDisplay,
    fontSize: 22,
    fontWeight: '600',
    color: Colors.charcoal,
  },
  verifiedBadgeWrap: {
    marginTop: 1,
  },
  privatePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: Colors.softGray,
    paddingHorizontal: Spacing[2],
    paddingVertical: 2,
    borderRadius: Radii.full,
    marginLeft: 4,
  },
  privatePillText: {
    fontFamily: Typography.fontBody,
    fontSize: 10,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  bioText: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.sm,
    color: Colors.charcoal,
    lineHeight: Typography.sm * 1.5,
  },
  locationPill: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.softGray,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: Spacing[2] + 2,
    paddingVertical: 3,
    borderRadius: Radii.full,
    marginTop: 4,
  },
  locationText: {
    fontFamily: Typography.fontBody,
    fontSize: 10,
    color: Colors.darkGray,
    fontWeight: '600',
  },

  actionRow: {
    paddingHorizontal: Spacing[4],
    paddingTop: Spacing[4],
    paddingBottom: Spacing[2],
  },
  followBtn: {
    backgroundColor: Colors.charcoal,
    borderRadius: Radii.full,
    paddingVertical: Spacing[3],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing[2],
    ...Shadows.sm,
  },
  followingBtn: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.borderGold,
  },
  followBtnText: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.sm,
    fontWeight: '700',
    color: Colors.warmWhite,
  },
  followingBtnText: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.sm,
    fontWeight: '700',
    color: Colors.charcoal,
  },

  gridSectionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing[3],
    paddingHorizontal: Spacing[4],
    gap: Spacing[3],
    marginTop: Spacing[2],
  },
  gridBarLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.borderLight,
  },
  gridBarLabel: {
    fontFamily: Typography.fontBody,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
    color: Colors.textSecondary,
  },

  columnWrapper: {
    gap: GAP,
  },
  thumb: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    backgroundColor: Colors.softGray,
    position: 'relative',
  },
  thumbImage: {
    width: '100%',
    height: '100%',
  },
  multiMediaBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: 'rgba(0,0,0,0.65)',
    padding: 3,
    borderRadius: 4,
  },

  privateWrap: {
    paddingTop: 60,
    alignItems: 'center',
    paddingHorizontal: Spacing[6],
    gap: Spacing[2],
  },
  lockCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.goldDust,
    borderWidth: 1,
    borderColor: Colors.borderGold,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing[2],
  },
  privateTitle: {
    fontFamily: Typography.fontDisplay,
    fontSize: Typography.xl,
    color: Colors.charcoal,
    textAlign: 'center',
  },
  privateSubtitle: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: Typography.sm * 1.5,
    maxWidth: 280,
  },

  empty: {
    paddingTop: 60,
    alignItems: 'center',
    paddingHorizontal: Spacing[6],
    gap: Spacing[2],
  },
  emptyIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.goldDust,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing[1],
  },
  emptyIcon: {
    fontSize: 20,
    color: Colors.gold,
  },
  emptyTitle: {
    fontFamily: Typography.fontDisplay,
    fontSize: Typography['2xl'],
    color: Colors.charcoal,
  },
  emptySubtitle: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});
