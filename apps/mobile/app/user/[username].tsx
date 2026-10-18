// ============================================================
// User Profile Screen — /user/[username]
// Public profile: avatar, stats, follow button, posts grid
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Colors, Typography, Spacing, Radii } from '../../src/design/tokens';
import { useUserProfile, useUserPosts, useToggleFollow } from '../../src/hooks/useUserProfile';
import { useAuthStore } from '../../src/stores/authStore';
import { GridSkeleton } from '../../src/components/Skeletons';
import type { OutfitSummary } from '@tavallin/shared';

const { width: SW } = Dimensions.get('window');
const THUMB = (SW - 3) / 3;

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

  const renderThumb = useCallback(
    ({ item }: { item: OutfitSummary }) => {
      const thumb =
        item.thumbnailUrl ||
        (item as any).media?.[0]?.thumbnailUrl ||
        (item as any).media?.[0]?.publicUrl ||
        (item as any).media?.[0]?.url;

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
        </TouchableOpacity>
      );
    },
    [router],
  );

  if (profileLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loading}><ActivityIndicator color={Colors.midGray} /></View>
      </SafeAreaView>
    );
  }

  if (!profile) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>User not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const ListHeader = () => (
    <View>
      {/* Top bar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Text style={styles.headerUsername}>@{profile.username}</Text>
          {profile.isPrivate && <Text style={{ fontSize: 13 }}>🔒</Text>}
        </View>
        <View style={{ width: 32 }} />
      </View>

      {/* Profile info */}
      <View style={styles.profileRow}>
        <Image
          source={profile?.avatarUrl ? { uri: profile.avatarUrl } : null}
          style={styles.avatar}
          contentFit="cover"
          cachePolicy="memory-disk"
        />
        <View style={styles.statsRow}>
          <StatBlock label="Posts" value={profile.postsCount} />
          <StatBlock label="Followers" value={profile.followersCount} />
          <StatBlock label="Following" value={profile.followingCount} />
        </View>
      </View>

      <View style={styles.bioSection}>
        <Text style={styles.displayName}>{profile.displayName}</Text>
        {profile.bio ? <Text style={styles.bio}>{profile.bio}</Text> : null}
        {profile.location ? <Text style={styles.location}>📍 {profile.location}</Text> : null}
      </View>

      {/* Follow / message actions */}
      {!isMe && (
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={[styles.followBtn, profile.isFollowing && styles.followingBtn]}
            onPress={() => toggleFollow(profile.isFollowing)}
            disabled={followPending}
            activeOpacity={0.8}
          >
            {followPending ? (
              <ActivityIndicator color={profile.isFollowing ? Colors.charcoal : Colors.warmWhite} size="small" />
            ) : (
              <Text style={[styles.followBtnText, profile.isFollowing && styles.followingBtnText]}>
                {profile.isFollowing ? 'Following' : 'Follow'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* Grid divider */}
      <View style={styles.gridBar}>
        <View style={styles.gridBarLine} />
        <Text style={styles.gridBarLabel}>POSTS</Text>
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
        numColumns={3}
        columnWrapperStyle={styles.columnWrapper}
        ListHeaderComponent={<ListHeader />}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.4}
        ListFooterComponent={
          postsLoading ? <GridSkeleton /> :
          isFetchingNextPage ? <ActivityIndicator color={Colors.midGray} style={{ marginVertical: Spacing[4] }} /> : null
        }
        ListEmptyComponent={
          !postsLoading ? (
            profile.isPrivate && !isMe && !profile.isFollowing ? (
              <View style={styles.privateWrap}>
                <View style={styles.lockCircle}>
                  <Text style={styles.lockIcon}>🔒</Text>
                </View>
                <Text style={styles.privateTitle}>This Account is Private</Text>
                <Text style={styles.privateSubtitle}>
                  Follow @{profile.username} to view their curated looks and moodboards.
                </Text>
              </View>
            ) : (
              <View style={styles.empty}>
                <Text style={styles.emptyIcon}>◻</Text>
                <Text style={styles.emptyTitle}>No posts yet</Text>
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
  container: { flex: 1, backgroundColor: Colors.warmWhite },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  backBtn: { padding: Spacing[5] },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing[5],
    paddingVertical: Spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  backText: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.md,
    color: Colors.charcoal,
    fontWeight: '400',
  },
  headerUsername: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.sm,
    fontWeight: '700',
    color: Colors.charcoal,
    letterSpacing: 0.5,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing[5],
    paddingTop: Spacing[5],
    gap: Spacing[5],
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.softGray,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  statsRow: { flex: 1, flexDirection: 'row', justifyContent: 'space-around' },
  statBlock: { alignItems: 'center', gap: 2 },
  statValue: { fontFamily: Typography.fontBody, fontSize: Typography.md, fontWeight: '700', color: Colors.charcoal },
  statLabel: { fontFamily: Typography.fontBody, fontSize: Typography.xs, color: Colors.textSecondary, fontWeight: '500' },
  bioSection: { paddingHorizontal: Spacing[5], paddingTop: Spacing[3], gap: Spacing[1] },
  displayName: { fontFamily: Typography.fontBody, fontSize: Typography.base, fontWeight: '700', color: Colors.charcoal },
  bio: { fontFamily: Typography.fontBody, fontSize: Typography.sm, color: Colors.charcoal, lineHeight: Typography.sm * 1.5 },
  location: { fontFamily: Typography.fontBody, fontSize: Typography.xs, color: Colors.textSecondary },
  actionsRow: { flexDirection: 'row', paddingHorizontal: Spacing[5], paddingTop: Spacing[4], paddingBottom: Spacing[5], gap: Spacing[3] },
  followBtn: {
    flex: 1,
    backgroundColor: Colors.charcoal,
    borderRadius: Radii.md,
    paddingVertical: Spacing[2] + 2,
    alignItems: 'center',
  },
  followingBtn: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  followBtnText: { fontFamily: Typography.fontBody, fontSize: Typography.sm, fontWeight: '700', color: Colors.warmWhite },
  followingBtnText: { color: Colors.charcoal },
  gridBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    paddingVertical: Spacing[3],
    paddingHorizontal: Spacing[5],
    gap: Spacing[3],
  },
  gridBarLine: { flex: 1, height: 1, backgroundColor: Colors.borderLight },
  gridBarLabel: { fontFamily: Typography.fontBody, fontSize: Typography.xs, fontWeight: '700', letterSpacing: 2, color: Colors.textSecondary },
  columnWrapper: { gap: 1.5 },
  thumb: { width: THUMB, height: THUMB, backgroundColor: Colors.softGray },
  thumbImage: { width: '100%', height: '100%' },
  empty: { paddingTop: 60, alignItems: 'center', gap: Spacing[3] },
  emptyIcon: { fontSize: 36, color: Colors.midGray },
  emptyTitle: { fontFamily: Typography.fontDisplay, fontSize: Typography['2xl'], color: Colors.charcoal },
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
    backgroundColor: Colors.softGray,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing[2],
  },
  lockIcon: {
    fontSize: 26,
  },
  privateTitle: {
    fontFamily: Typography.fontDisplay,
    fontSize: Typography.xl,
    fontWeight: '700',
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
});
