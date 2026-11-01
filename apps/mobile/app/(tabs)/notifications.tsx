// ============================================================
// Notifications Screen — Tavallin Premium Activity Feed
// ============================================================

import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radii, Shadows } from '../../src/design/tokens';
import { useNotifications, useMarkAllRead, useMarkRead } from '../../src/hooks/useNotifications';
import type { Notification } from '@tavallin/shared';

type NotifIconName = React.ComponentProps<typeof Ionicons>['name'];

const NOTIF_ICON: Record<string, NotifIconName> = {
  new_follower:        'person-add-outline',
  outfit_liked:        'heart-outline',
  outfit_commented:    'chatbubble-outline',
  comment_replied:     'return-down-forward-outline',
  comment_liked:       'heart-outline',
  account_suspended:   'warning-outline',
  account_reactivated: 'checkmark-circle-outline',
  content_removed:     'close-circle-outline',
  report_resolved:     'checkmark-circle-outline',
  system:              'notifications-outline',
};

const NOTIF_ICON_COLOR: Record<string, string> = {
  new_follower:        Colors.charcoal,
  outfit_liked:        Colors.likeActive,
  outfit_commented:    Colors.charcoal,
  comment_replied:     Colors.charcoal,
  comment_liked:       Colors.likeActive,
  account_suspended:   Colors.warning,
  account_reactivated: Colors.success,
  content_removed:     Colors.error,
  report_resolved:     Colors.success,
  system:              Colors.gold,
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'just now';
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const d = Math.floor(hr / 24);
  if (d < 7) return `${d}d ago`;
  return `${Math.floor(d / 7)}w ago`;
}

export default function NotificationsScreen() {
  const router = useRouter();
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    refetch,
    isRefetching,
  } = useNotifications();
  const { mutate: markAllRead } = useMarkAllRead();
  const { mutate: markRead } = useMarkRead();

  const notifications = data?.pages.flatMap((p) => p.notifications) ?? [];
  const unreadCount = data?.pages[0]?.unreadCount ?? 0;

  const handlePress = useCallback(
    (n: Notification) => {
      if (!n.isRead) markRead(n.id);
      if (n.deepLink) {
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
    ({ item }: { item: Notification }) => {
      const iconName = NOTIF_ICON[item.type] ?? 'notifications-outline';
      const iconColor = NOTIF_ICON_COLOR[item.type] ?? Colors.charcoal;
      return (
        <TouchableOpacity
          style={[styles.item, !item.isRead && styles.itemUnread]}
          onPress={() => handlePress(item)}
          activeOpacity={0.78}
        >
          {/* Avatar / Icon */}
          <View style={styles.avatarWrap}>
            {item.actorAvatarUrl ? (
              <Image
                source={{ uri: item.actorAvatarUrl }}
                style={styles.avatar}
                contentFit="cover"
                cachePolicy="memory-disk"
              />
            ) : (
              <View style={[styles.iconCircle, { borderColor: iconColor + '33' }]}>
                <Ionicons name={iconName} size={20} color={iconColor} />
              </View>
            )}
            {!item.isRead && <View style={styles.unreadDot} />}
          </View>

          {/* Content */}
          <View style={styles.content}>
            <Text style={styles.notifTitle} numberOfLines={1}>
              {item.title}
            </Text>
            <Text style={styles.notifBody} numberOfLines={2}>
              {item.body}
            </Text>
            <Text style={styles.notifTime}>{timeAgo(item.createdAt)}</Text>
          </View>

          {/* Unread accent bar */}
          {!item.isRead && <View style={styles.unreadAccent} />}
        </TouchableOpacity>
      );
    },
    [handlePress],
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* ─── Header ──────────────────────────────────────── */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.brandTitle}>ACTIVITY</Text>
          {unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadBadgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
            </View>
          )}
        </View>
        {unreadCount > 0 && (
          <TouchableOpacity
            onPress={() => markAllRead()}
            style={styles.markAllBtn}
            activeOpacity={0.75}
          >
            <Ionicons name="checkmark-done-outline" size={15} color={Colors.charcoal} />
            <Text style={styles.markAllText}>Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* ─── List ────────────────────────────────────────── */}
      {isLoading ? (
        <View style={styles.loading}>
          <ActivityIndicator color={Colors.charcoal} size="large" />
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={() => void refetch()}
              tintColor={Colors.charcoal}
            />
          }
          onEndReached={() => {
            if (hasNextPage && !isFetchingNextPage) void fetchNextPage();
          }}
          onEndReachedThreshold={0.4}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListFooterComponent={
            isFetchingNextPage ? (
              <View style={styles.footer}>
                <ActivityIndicator color={Colors.midGray} size="small" />
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <View style={styles.emptyRing}>
                <Ionicons name="notifications-outline" size={36} color={Colors.midGray} />
              </View>
              <Text style={styles.emptyTitle}>All Caught Up</Text>
              <Text style={styles.emptyBody}>
                When someone likes, comments, or follows you, it'll appear here.
              </Text>
            </View>
          }
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

  // ─── Header ───────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing[5],
    paddingVertical: Spacing[3] + 2,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    ...Shadows.xs,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
  },
  brandTitle: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.md,
    fontWeight: '800',
    letterSpacing: Typography.letterSpacingMega,
    color: Colors.charcoal,
  },
  unreadBadge: {
    backgroundColor: Colors.likeActive,
    borderRadius: Radii.full,
    paddingHorizontal: Spacing[2],
    paddingVertical: 2,
    minWidth: 20,
    alignItems: 'center',
  },
  unreadBadgeText: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.xs - 1,
    fontWeight: '700',
    color: Colors.textInverse,
  },
  markAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[2],
    backgroundColor: Colors.softGray,
    borderRadius: Radii.full,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  markAllText: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.xs,
    color: Colors.charcoal,
    fontWeight: '600',
  },

  // ─── List Items ───────────────────────────────────────────
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  item: {
    flexDirection: 'row',
    paddingHorizontal: Spacing[5],
    paddingVertical: Spacing[4],
    gap: Spacing[3],
    backgroundColor: Colors.surface,
    alignItems: 'center',
    position: 'relative',
  },
  itemUnread: {
    backgroundColor: Colors.blushLight,
  },
  unreadAccent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    backgroundColor: Colors.gold,
    borderRadius: 2,
  },
  separator: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginLeft: Spacing[5] + 44 + Spacing[3], // align with content
  },
  avatarWrap: {
    position: 'relative',
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: Colors.softGray,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  iconCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: Colors.softGray,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  unreadDot: {
    position: 'absolute',
    bottom: 1,
    right: 1,
    width: 11,
    height: 11,
    borderRadius: 5.5,
    backgroundColor: Colors.likeActive,
    borderWidth: 2,
    borderColor: Colors.warmWhite,
  },
  content: {
    flex: 1,
    gap: 3,
  },
  notifTitle: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.sm,
    fontWeight: '700',
    color: Colors.charcoal,
  },
  notifBody: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    lineHeight: Typography.sm * Typography.lineHeightBase,
  },
  notifTime: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.xs,
    color: Colors.textTertiary,
    marginTop: 2,
  },

  // ─── Footer / Empty ───────────────────────────────────────
  footer: {
    paddingVertical: Spacing[6],
    alignItems: 'center',
  },
  emptyState: {
    paddingTop: Spacing[20],
    alignItems: 'center',
    gap: Spacing[3],
    paddingHorizontal: Spacing[10],
  },
  emptyRing: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.softGray,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing[2],
  },
  emptyTitle: {
    fontFamily: Typography.fontDisplay,
    fontSize: Typography['2xl'],
    color: Colors.charcoal,
    fontWeight: '500',
  },
  emptyBody: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: Typography.sm * Typography.lineHeightRelaxed,
  },
});
