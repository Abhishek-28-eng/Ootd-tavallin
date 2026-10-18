// ============================================================
// OutfitCard — Luxury Editorial Feed Card
// ============================================================

import React, { useCallback, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Pressable,
  Share,
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { Colors, Typography, Spacing, Radii, Shadows } from '../design/tokens';
import type { OutfitPost } from '@tavallin/shared';
import { STYLE_CATEGORY_LABELS } from '@tavallin/shared';

const { width: SW } = Dimensions.get('window');

interface OutfitCardProps {
  post: OutfitPost;
  onLike?: (id: string) => void;
  onSave?: (id: string) => void;
  style?: object;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const OutfitCard = React.memo(function OutfitCard({ post, onLike, onSave }: OutfitCardProps) {
  const router = useRouter();
  const [isExpanded, setIsExpanded] = useState(false);

  const likeScale = useSharedValue(1);
  const saveScale = useSharedValue(1);
  const heartBurstScale = useSharedValue(0);
  const heartBurstOpacity = useSharedValue(0);

  const lastTapRef = useRef<number>(0);

  const likeAnimStyle = useAnimatedStyle(() => ({ transform: [{ scale: likeScale.value }] }));
  const saveAnimStyle = useAnimatedStyle(() => ({ transform: [{ scale: saveScale.value }] }));
  const heartBurstStyle = useAnimatedStyle(() => ({
    transform: [{ scale: heartBurstScale.value }],
    opacity: heartBurstOpacity.value,
  }));

  const triggerHeartBurst = useCallback(() => {
    heartBurstScale.value = 0;
    heartBurstOpacity.value = 1;
    heartBurstScale.value = withSequence(
      withSpring(1.4, { damping: 5, stiffness: 200 }),
      withTiming(1, { duration: 150 }),
      withTiming(0, { duration: 250 }),
    );
    heartBurstOpacity.value = withSequence(
      withTiming(1, { duration: 300 }),
      withTiming(0, { duration: 250 }),
    );
  }, [heartBurstScale, heartBurstOpacity]);

  const handleLike = useCallback(() => {
    likeScale.value = withSequence(withSpring(1.35, { damping: 4 }), withSpring(1, { damping: 8 }));
    onLike?.(post.id);
  }, [likeScale, onLike, post.id]);

  const handleSave = useCallback(() => {
    saveScale.value = withSequence(withSpring(1.35, { damping: 4 }), withSpring(1, { damping: 8 }));
    onSave?.(post.id);
  }, [saveScale, onSave, post.id]);

  const handleImagePress = () => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;
    if (now - lastTapRef.current < DOUBLE_TAP_DELAY) {
      // Double tap detected
      triggerHeartBurst();
      if (!post.isLiked) {
        handleLike();
      }
      lastTapRef.current = 0;
    } else {
      lastTapRef.current = now;
      setTimeout(() => {
        if (Date.now() - lastTapRef.current >= DOUBLE_TAP_DELAY && lastTapRef.current !== 0) {
          router.push(`/outfit/${post.id}`);
        }
      }, DOUBLE_TAP_DELAY);
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out this look by @${creator.username} on Tavallin:\n${post.caption || 'Curated fashion look'}`,
      });
    } catch {
      // Ignore cancel
    }
  };

  const firstImage = (post.media && post.media[0]) as any;
  const imageUrl = firstImage?.url ?? firstImage?.publicUrl ?? '';
  const thumbnailUrl = firstImage?.thumbnailUrl ?? null;
  const aspectRatio =
    firstImage?.width && firstImage?.height ? firstImage.width / firstImage.height : 3 / 4;

  const creator = post.creator ?? (post as any).author ?? {
    username: 'creator',
    displayName: 'Creator',
    avatarUrl: null,
  };

  const saves = post.savesCount ?? (post as any).savedCount ?? 0;
  const likes = post.likesCount ?? 0;
  const comments = post.commentsCount ?? 0;

  return (
    <View style={styles.card}>
      {/* ─── Top Creator Header ──────────────────────── */}
      <View style={styles.authorHeader}>
        <TouchableOpacity
          style={styles.authorLeft}
          activeOpacity={0.8}
          onPress={() => router.push(`/user/${creator?.username ?? ''}`)}
        >
          <View style={styles.avatarWrap}>
            {creator?.avatarUrl ? (
              <Image
                source={{ uri: creator.avatarUrl }}
                style={styles.avatar}
                contentFit="cover"
                cachePolicy="memory-disk"
              />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarInitial}>
                  {(creator?.displayName || creator?.username || 'U')[0]?.toUpperCase()}
                </Text>
              </View>
            )}
          </View>
          <View style={styles.authorInfo}>
            <Text style={styles.displayName} numberOfLines={1}>
              {creator?.displayName || creator?.username}
            </Text>
            <Text style={styles.username} numberOfLines={1}>
              @{creator?.username}
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.moreBtn} onPress={handleShare} activeOpacity={0.7}>
          <Text style={styles.moreIcon}>↗</Text>
        </TouchableOpacity>
      </View>

      {/* ─── Main Image with Double Tap & Heart Burst ─── */}
      <Pressable style={styles.imageContainer} onPress={handleImagePress}>
        <Image
          source={{ uri: imageUrl }}
          style={[styles.image, { aspectRatio }]}
          contentFit="cover"
          transition={200}
          cachePolicy="memory-disk"
          placeholder={thumbnailUrl ? { uri: thumbnailUrl } : null}
        />

        {/* Carousel indicator badge */}
        {post.media?.length > 1 && (
          <View style={styles.mediaCountBadge}>
            <Text style={styles.mediaCountText}>1/{post.media.length}</Text>
          </View>
        )}

        {/* Center Double-Tap Heart Burst */}
        <Animated.View pointerEvents="none" style={[styles.heartBurstWrap, heartBurstStyle]}>
          <Text style={styles.heartBurstIcon}>♥</Text>
        </Animated.View>
      </Pressable>

      {/* ─── Interactive Action Row ────────────────────── */}
      <View style={styles.actionRow}>
        <View style={styles.actionGroupLeft}>
          {/* Like */}
          <AnimatedPressable style={[styles.actionBtn, likeAnimStyle]} onPress={handleLike}>
            <Text style={[styles.actionIcon, post.isLiked && styles.likedIcon]}>
              {post.isLiked ? '♥' : '♡'}
            </Text>
            <Text style={[styles.actionCount, post.isLiked && styles.likedText]}>
              {_fmt(likes)}
            </Text>
          </AnimatedPressable>

          {/* Comment */}
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => router.push(`/outfit/${post.id}`)}
            activeOpacity={0.75}
          >
            <Text style={styles.actionIcon}>💬</Text>
            <Text style={styles.actionCount}>{_fmt(comments)}</Text>
          </TouchableOpacity>

          {/* Share */}
          <TouchableOpacity style={styles.actionBtn} onPress={handleShare} activeOpacity={0.75}>
            <Text style={styles.actionIcon}>↗</Text>
          </TouchableOpacity>
        </View>

        {/* Save */}
        <AnimatedPressable style={[styles.actionBtn, saveAnimStyle]} onPress={handleSave}>
          <Text style={[styles.actionIcon, post.isSaved && styles.savedIcon]}>
            {post.isSaved ? '⊡' : '⊞'}
          </Text>
          <Text style={[styles.actionCount, post.isSaved && styles.savedText]}>
            {_fmt(saves)}
          </Text>
        </AnimatedPressable>
      </View>

      {/* ─── Caption & Metadata ───────────────────────── */}
      <View style={styles.contentWrap}>
        {post.caption ? (
          <View style={styles.captionRow}>
            <Text
              style={styles.caption}
              numberOfLines={isExpanded ? undefined : 2}
              onPress={() => setIsExpanded(!isExpanded)}
            >
              <Text
                style={styles.captionAuthor}
                onPress={() => router.push(`/user/${creator?.username ?? ''}`)}
              >
                {creator?.username}{' '}
              </Text>
              {post.caption}
            </Text>
            {post.caption.length > 80 && !isExpanded && (
              <Text style={styles.moreText} onPress={() => setIsExpanded(true)}>
                more
              </Text>
            )}
          </View>
        ) : null}

        {/* Style Category Tags */}
        {post.styleCategories && post.styleCategories.length > 0 && (
          <View style={styles.tagRow}>
            {post.styleCategories.slice(0, 3).map((s) => (
              <View key={s} style={styles.tag}>
                <Text style={styles.tagText}>#{STYLE_CATEGORY_LABELS[s] || s.replace(/_/g, ' ').toUpperCase()}</Text>
              </View>
            ))}
          </View>
        )}

        {/* View all comments shortcut */}
        {comments > 0 && (
          <TouchableOpacity
            style={styles.commentPrompt}
            onPress={() => router.push(`/outfit/${post.id}`)}
            activeOpacity={0.75}
          >
            <Text style={styles.commentPromptText}>
              View all {comments} {comments === 1 ? 'comment' : 'comments'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
});

function _fmt(n?: number | null): string {
  if (n == null || isNaN(n)) return '0';
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    marginBottom: Spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    paddingBottom: Spacing[3],
  },
  authorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[3],
  },
  authorLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: Colors.softGray,
    marginRight: Spacing[3],
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: Colors.charcoal,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.sm,
    fontWeight: '700',
    color: Colors.warmWhite,
  },
  authorInfo: {
    flex: 1,
    gap: 1,
  },
  displayName: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.sm,
    fontWeight: '700',
    color: Colors.charcoal,
  },
  username: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.xs,
    color: Colors.textSecondary,
  },
  moreBtn: {
    padding: Spacing[2],
  },
  moreIcon: {
    fontSize: 16,
    color: Colors.textSecondary,
    fontWeight: '700',
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    backgroundColor: Colors.softGray,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    backgroundColor: Colors.softGray,
  },
  mediaCountBadge: {
    position: 'absolute',
    top: Spacing[3],
    right: Spacing[3],
    backgroundColor: 'rgba(26, 26, 26, 0.7)',
    borderRadius: Radii.full,
    paddingHorizontal: Spacing[2] + 2,
    paddingVertical: 3,
  },
  mediaCountText: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.xs - 1,
    fontWeight: '700',
    color: Colors.warmWhite,
    letterSpacing: 0.5,
  },
  heartBurstWrap: {
    position: 'absolute',
    top: '35%',
    left: '35%',
    width: '30%',
    height: '30%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heartBurstIcon: {
    fontSize: 72,
    color: Colors.likeActive,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing[4],
    paddingTop: Spacing[3],
    paddingBottom: Spacing[2],
  },
  actionGroupLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[4],
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 2,
  },
  actionIcon: {
    fontSize: 20,
    color: Colors.charcoal,
  },
  likedIcon: {
    color: Colors.likeActive,
  },
  savedIcon: {
    color: Colors.charcoal,
  },
  actionCount: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.xs,
    color: Colors.charcoal,
    fontWeight: '600',
  },
  likedText: {
    color: Colors.likeActive,
  },
  savedText: {
    color: Colors.charcoal,
  },
  contentWrap: {
    paddingHorizontal: Spacing[4],
    gap: Spacing[2],
  },
  captionRow: {
    marginTop: 2,
  },
  caption: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.sm,
    color: Colors.charcoal,
    lineHeight: Typography.sm * 1.5,
  },
  captionAuthor: {
    fontWeight: '700',
    color: Colors.charcoal,
  },
  moreText: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  tagRow: {
    flexDirection: 'row',
    gap: Spacing[2],
    flexWrap: 'wrap',
    marginTop: 2,
  },
  tag: {
    backgroundColor: Colors.softGray,
    borderRadius: Radii.sm,
    paddingHorizontal: Spacing[2] + 2,
    paddingVertical: 3,
  },
  tagText: {
    fontFamily: Typography.fontBody,
    fontSize: 10,
    color: Colors.textSecondary,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  commentPrompt: {
    marginTop: 2,
  },
  commentPromptText: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.xs,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
});
