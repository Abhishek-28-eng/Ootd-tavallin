// ============================================================
// Notifications Screen — Grouped notification feed
// ============================================================

import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Colors, Typography, Spacing } from '../../src/design/tokens';
import { useNotifications, useMarkAllRead, useMarkRead } from '../../src/hooks/useNotifications';
import type { Notification } from '@tavallin/shared';

const NOTIF_ICON: Record<string, string> = {
  new_follower: '👤',
  outfit_liked: '♥',
  outfit_commented: '💬',
  comment_replied: '↩',
  comment_liked: '♥',
  account_suspended: '⚠',
  account_reactivated: '✓',
  content_removed: '✕',
  report_resolved: '✓',
  system: '✦',
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'now';
  if (min < 60) return `${min}m`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h`;
  const d = Math.floor(hr / 24);
  if (d < 7) return `${d}d`;
  return `${Math.floor(d / 7)}w`;
}

export default function NotificationsScreen() {
  const router = useRouter();
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, refetch, isRefetching } =
    useNotifications();
  const { mutate: markAllRead } = useMarkAllRead();
  const { mutate: markRead } = useMarkRead();

  const notifications = data?.pages.flatMap((p) => p.notifications) ?? [];
  const unreadCount = data?.pages[0]?.unreadCount ?? 0;

  const handlePress = useCallback(
    (n: Notification) => {
      if (!n.isRead) markRead(n.id);
      if (n.deepLink) {
        // Navigate based on deep link type
        if (n.targetType === 'outfit' && n.targetId) {
          router.push(`/outfit/${n.targetId}`);
        } else if (n.actorUsername) {
          router.push(`/user/${n.actorUsername}`);
        }
      }
    },
    [markRead, router],
  );

  const renderItem = useCallback(
    ({ item }: { item: Notification }) => (
      <TouchableOpacity
        style={[styles.item, !item.isRead && styles.itemUnread]}
        onPress={() => handlePress(item)}
        activeOpacity={0.75}
      >
        {/* Actor avatar / icon */}
        <View style={styles.iconWrap}>
          {item.actorAvatarUrl ? (
            <Image source={{ uri: item.actorAvatarUrl }} style={styles.avatar} contentFit="cover" cachePolicy="memory-disk" />
          ) : (
            <View style={styles.iconCircle}>
              <Text style={styles.iconEmoji}>{NOTIF_ICON[item.type] ?? '✦'}</Text>
            </View>
          )}
          {!item.isRead && <View style={styles.unreadDot} />}
        </View>

        {/* Content */}
        <View style={styles.content}>
          <Text style={styles.notifTitle} numberOfLines={1}>{item.title}</Text>
          <Text style={styles.notifBody} numberOfLines={2}>{item.body}</Text>
          <Text style={styles.notifTime}>{timeAgo(item.createdAt)}</Text>
        </View>
      </TouchableOpacity>
    ),
    [handlePress],
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.brand}>ACTIVITY</Text>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={() => markAllRead()} style={styles.markAllBtn}>
            <Text style={styles.markAllText}>Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>

      {isLoading ? (
        <View style={styles.loading}>
          <ActivityIndicator color={Colors.midGray} />
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          refreshing={isRefetching}
          onRefresh={() => {
            void refetch();
          }}
          onEndReached={() => {
            if (hasNextPage && !isFetchingNextPage) void fetchNextPage();
          }}
          onEndReachedThreshold={0.4}
          showsVerticalScrollIndicator={false}
          ListFooterComponent={
            isFetchingNextPage ? (
              <View style={styles.footer}><ActivityIndicator color={Colors.midGray} /></View>
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>🔔</Text>
              <Text style={styles.emptyTitle}>All caught up</Text>
              <Text style={styles.emptyBody}>
                When someone likes or follows you, it'll show up here.
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.warmWhite },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing[5],
    paddingVertical: Spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  brand: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.sm,
    fontWeight: '700',
    letterSpacing: 3,
    color: Colors.charcoal,
  },
  markAllBtn: { paddingVertical: Spacing[1] },
  markAllText: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.xs,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  item: {
    flexDirection: 'row',
    paddingHorizontal: Spacing[5],
    paddingVertical: Spacing[4],
    gap: Spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  itemUnread: { backgroundColor: Colors.blushLight },
  iconWrap: { position: 'relative' },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.softGray,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.softGray,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconEmoji: { fontSize: 18 },
  unreadDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.error,
    borderWidth: 2,
    borderColor: Colors.warmWhite,
  },
  content: { flex: 1, gap: 2 },
  notifTitle: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.sm,
    fontWeight: '600',
    color: Colors.charcoal,
  },
  notifBody: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    lineHeight: Typography.sm * 1.5,
  },
  notifTime: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.xs,
    color: Colors.textTertiary,
    marginTop: 2,
  },
  footer: { paddingVertical: Spacing[6], alignItems: 'center' },
  empty: {
    paddingTop: 100,
    alignItems: 'center',
    gap: Spacing[3],
    paddingHorizontal: Spacing[10],
  },
  emptyIcon: { fontSize: 40 },
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
    lineHeight: Typography.sm * 1.6,
  },
});
