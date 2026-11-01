// ============================================================
// OutfitCard — OOTDi Editorial Feed Card
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
import { Ionicons, Feather } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { Colors, Typography, Spacing, Radii, Shadows } from '../design/tokens';
import { useToggleFollow } from '../hooks/useUserProfile';
import { useAuthStore } from '../stores/authStore';
import { hapticLight, hapticMedium, hapticSuccess } from '../lib/haptics';
import { ImageZoomLightbox } from './ImageZoomLightbox';
import { EditorialStoryModal } from './EditorialStoryModal';
import type { OutfitPost } from '@tavallin/shared';
import { STYLE_CATEGORY_LABELS } from '@tavallin/shared';

const { width: SW } = Dimensions.get('window');

// ─── Role badges ──────────────────────────────────────────────
const ROLE_LABELS: Record<string, string> = {
  curator: 'CURATOR',
  stylist: 'STYLIST',
  designer: 'DESIGNER',
  creator: 'CREATOR',
  model: 'MODEL',
};

function getRoleBadge(creator: any): string | null {
  const role = creator?.role ?? creator?.userRole ?? creator?.badge;
  if (!role) return null;
  return ROLE_LABELS[role.toLowerCase()] ?? null;
}

// ─── Tag helpers ──────────────────────────────────────────────
function getProductTags(post: OutfitPost): string[] {
  const tags: string[] = [];
  const cats = (post as any).styleCategories ?? (post as any).styles ?? [];
  if (cats.length > 0) {
    const label = STYLE_CATEGORY_LABELS[cats[0] as keyof typeof STYLE_CATEGORY_LABELS]
      ?? cats[0].replace(/_/g, ' ').toUpperCase();
    tags.push(label.toUpperCase());
  }
  const items = (post as any).outfitItems ?? (post as any).items ?? [];
  if (items.length > 0 && items[0]?.name) {
    tags.push(items[0].name.toUpperCase());
  }
  return tags.slice(0, 2);
}

function getHashtags(post: OutfitPost): string[] {
  const cats = (post as any).styleCategories ?? [];
  const occasions = (post as any).occasions ?? [];
  const combined = [...cats, ...occasions].slice(0, 4);
  return combined.map((c: string) => `#${c.replace(/_/g, '').toUpperCase()}`);
}

function getLocation(post: OutfitPost): string | null {
  return (post as any).location ?? (post as any).city ?? null;
}

function getTimeAgo(post: OutfitPost): string {
  const created = post.createdAt ? new Date(post.createdAt) : null;
  if (!created) return '';
  const diffMs = Date.now() - created.getTime();
  const diffH = Math.floor(diffMs / 3_600_000);
  const diffD = Math.floor(diffMs / 86_400_000);
  if (diffH < 1) return 'just now';
  if (diffH < 24) return `${diffH}H AGO`;
  return `${diffD}D AGO`;
}

function _fmt(n?: number | null): string {
  if (n == null || isNaN(n)) return '0';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

interface OutfitCardProps {
  post: OutfitPost;
  onLike?: (id: string) => void;
  onSave?: (id: string) => void;
  onFollow?: (username: string) => void;
  style?: object;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// ─── Main Editorial Card ──────────────────────────────────────
export const EditorialOutfitCard = React.memo(function EditorialOutfitCard({
  post,
  onLike,
  onSave,
  onFollow,
}: OutfitCardProps) {
  const router = useRouter();
  const [isExpanded, setIsExpanded] = useState(false);
  const [lightboxVisible, setLightboxVisible] = useState(false);
  const [storyModalVisible, setStoryModalVisible] = useState(false);

  const likeScale = useSharedValue(1);
  const saveScale = useSharedValue(1);
  const heartBurstScale = useSharedValue(0);
  const heartBurstOpacity = useSharedValue(0);
  const lastTapRef = useRef<number>(0);

  const likeAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: likeScale.value }],
  }));
  const saveAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: saveScale.value }],
  }));
  const heartBurstStyle = useAnimatedStyle(() => ({
    transform: [{ scale: heartBurstScale.value }],
    opacity: heartBurstOpacity.value,
  }));

  const triggerHeartBurst = useCallback(() => {
    hapticSuccess();
    heartBurstScale.value = 0;
    heartBurstOpacity.value = 1;
    heartBurstScale.value = withSequence(
      withSpring(1.4, { damping: 5, stiffness: 200 }),
      withTiming(1, { duration: 150 }),
      withTiming(0, { duration: 280 }),
    );
    heartBurstOpacity.value = withSequence(
      withTiming(1, { duration: 300 }),
      withTiming(0, { duration: 280 }),
    );
  }, [heartBurstScale, heartBurstOpacity]);

  const handleLike = useCallback(() => {
    hapticSuccess();
    likeScale.value = withSequence(
      withSpring(1.4, { damping: 4 }),
      withSpring(1, { damping: 8 }),
    );
    onLike?.(post.id);
  }, [likeScale, onLike, post.id]);

  const handleSave = useCallback(() => {
    hapticLight();
    saveScale.value = withSequence(
      withSpring(1.35, { damping: 4 }),
      withSpring(1, { damping: 8 }),
    );
    onSave?.(post.id);
  }, [saveScale, onSave, post.id]);

  const handleImagePress = () => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;
    if (now - lastTapRef.current < DOUBLE_TAP_DELAY) {
      triggerHeartBurst();
      if (!post.isLiked) handleLike();
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

  const handleShare = () => {
    hapticLight();
    setStoryModalVisible(true);
  };

  const firstImage = (post.media && post.media[0]) as any;
  const imageUrl = firstImage?.url ?? firstImage?.publicUrl ?? '';
  const thumbnailUrl = firstImage?.thumbnailUrl ?? null;
  // Force close-to-portrait ratio for editorial full-width feel
  const rawAr = firstImage?.width && firstImage?.height ? firstImage.width / firstImage.height : 0.7;
  const aspectRatio = Math.min(Math.max(rawAr, 0.5), 1.0); // clamp to portrait-ish

  const creator = post.creator ?? (post as any).author ?? {
    username: 'creator',
    displayName: 'Creator',
    avatarUrl: null,
  };

  const currentUser = useAuthStore((s) => s.user);
  const isMe =
    Boolean(currentUser?.id && creator?.id && currentUser.id === creator.id) ||
    Boolean(
      currentUser?.username &&
      creator?.username &&
      currentUser.username.toLowerCase() === creator.username.toLowerCase()
    );

  const initialFollowing = Boolean((creator as any)?.isFollowing ?? (post as any)?.isFollowing);
  const [isFollowing, setIsFollowing] = useState(initialFollowing);
  const { mutate: toggleFollow, isPending: followPending } = useToggleFollow(creator?.username ?? '');

  const handleFollowPress = useCallback(() => {
    if (!creator?.username || creator.username === 'creator' || isMe || followPending) return;
    hapticMedium();
    const nextFollowing = !isFollowing;
    setIsFollowing(nextFollowing);
    toggleFollow(isFollowing);
    onFollow?.(creator.username);
  }, [creator?.username, isFollowing, isMe, followPending, toggleFollow, onFollow]);

  const saves = post.savesCount ?? (post as any).savedCount ?? 0;
  const likes = post.likesCount ?? 0;
  const comments = post.commentsCount ?? 0;
  const mediaCount = post.media?.length ?? 1;

  const roleBadge = getRoleBadge(creator);
  const productTags = getProductTags(post);
  const hashtags = getHashtags(post);
  const location = getLocation(post);
  const timeAgo = getTimeAgo(post);

  return (
    <View style={styles.card}>
      {/* ─── Creator Header ─── */}
      <View style={styles.creatorHeader}>
        <TouchableOpacity
          style={styles.creatorLeft}
          activeOpacity={0.8}
          onPress={() => router.push(`/user/${creator?.username ?? ''}`)}
        >
          {/* Avatar */}
          <View style={styles.avatarRing}>
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

          {/* Name + role */}
          <View style={styles.creatorInfo}>
            <View style={styles.creatorNameRow}>
              <Text style={styles.displayName} numberOfLines={1}>
                {creator?.username}
              </Text>
              {roleBadge && (
                <View style={styles.rolePill}>
                  <Text style={styles.rolePillText}>{roleBadge}</Text>
                </View>
              )}
            </View>
            {location && (
              <Text style={styles.locationText} numberOfLines={1}>
                {location.toUpperCase()}
              </Text>
            )}
          </View>
        </TouchableOpacity>

        {/* Follow + more */}
        <View style={styles.creatorRight}>
          {!isMe && creator?.username && creator.username !== 'creator' && (
            <TouchableOpacity
              style={[styles.followBtn, isFollowing && styles.followingBtn]}
              onPress={handleFollowPress}
              disabled={followPending}
              activeOpacity={0.75}
            >
              <Text style={[styles.followBtnText, isFollowing && styles.followingBtnText]}>
                {isFollowing ? 'FOLLOWING' : '+ FOLLOW'}
              </Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.moreBtn} onPress={handleShare} activeOpacity={0.7}>
            <Ionicons name="ellipsis-horizontal" size={16} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* ─── Image ─── */}
      <Pressable style={styles.imageContainer} onPress={handleImagePress}>
        <Image
          source={{ uri: imageUrl }}
          style={[styles.image, { aspectRatio }]}
          contentFit="cover"
          transition={220}
          cachePolicy="memory-disk"
          placeholder={thumbnailUrl ? { uri: thumbnailUrl } : null}
        />

        {/* Zoom Lightbox Trigger */}
        <TouchableOpacity
          style={styles.zoomBadge}
          onPress={() => {
            hapticLight();
            setLightboxVisible(true);
          }}
          activeOpacity={0.8}
        >
          <Ionicons name="expand-outline" size={12} color="#FFFFFF" />
          <Text style={styles.zoomBadgeText}>INSPECT</Text>
        </TouchableOpacity>

        {/* Carousel counter */}
        {mediaCount > 1 && (
          <View style={styles.counterBadge}>
            <Text style={styles.counterText}>01 / {String(mediaCount).padStart(2, '0')}</Text>
          </View>
        )}

        {/* Product tag overlays at bottom of image */}
        {productTags.length > 0 && (
          <View style={styles.productTagsRow}>
            {productTags.map((tag, i) => (
              <View key={i} style={styles.productTag}>
                <View style={styles.productTagDot} />
                <Text style={styles.productTagText}>{tag}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Double-tap Heart Burst */}
        <Animated.View pointerEvents="none" style={[styles.heartBurstWrap, heartBurstStyle]}>
          <Text style={styles.heartBurstIcon}>♥</Text>
        </Animated.View>
      </Pressable>

      {/* ─── Action Row ─── */}
      <View style={styles.actionRow}>
        <View style={styles.actionLeft}>
          {/* Like */}
          <AnimatedPressable style={[styles.actionItem, likeAnimStyle]} onPress={handleLike}>
            <Ionicons
              name={post.isLiked ? 'heart' : 'heart-outline'}
              size={21}
              color={post.isLiked ? Colors.likeActive : Colors.charcoal}
            />
            <Text style={[styles.actionCount, post.isLiked && styles.likedCount]}>
              {_fmt(likes)}
            </Text>
          </AnimatedPressable>

          {/* Comment */}
          <TouchableOpacity
            style={styles.actionItem}
            onPress={() => router.push(`/outfit/${post.id}`)}
            activeOpacity={0.75}
          >
            <Ionicons name="chatbubble-outline" size={20} color={Colors.charcoal} />
            <Text style={styles.actionCount}>{_fmt(comments)}</Text>
          </TouchableOpacity>

          {/* Share */}
          <TouchableOpacity style={styles.actionItem} onPress={handleShare} activeOpacity={0.75}>
            <Feather name="send" size={19} color={Colors.charcoal} />
          </TouchableOpacity>
        </View>

        {/* Separator dash */}
        <View style={styles.actionSep} />

        {/* Save */}
        <AnimatedPressable style={[styles.actionItem, saveAnimStyle]} onPress={handleSave}>
          <Ionicons
            name={post.isSaved ? 'bookmark' : 'bookmark-outline'}
            size={21}
            color={post.isSaved ? Colors.gold : Colors.charcoal}
          />
          <Text style={[styles.actionCount, post.isSaved && styles.savedCount]}>
            {_fmt(saves)}
          </Text>
        </AnimatedPressable>
      </View>

      {/* ─── Caption & Meta ─── */}
      <View style={styles.contentWrap}>
        {/* Username + caption combined */}
        {post.caption ? (
          <Text
            style={styles.caption}
            numberOfLines={isExpanded ? undefined : 3}
            onPress={() => setIsExpanded(!isExpanded)}
          >
            <Text
              style={styles.captionAuthor}
              onPress={() => router.push(`/user/${creator?.username ?? ''}`)}
            >
              {creator?.username}{' '}
            </Text>
            {post.caption}
            {post.caption.length > 100 && !isExpanded && (
              <Text style={styles.moreText}> more</Text>
            )}
          </Text>
        ) : null}

        {/* Hashtags */}
        {hashtags.length > 0 && (
          <Text style={styles.hashtagRow} numberOfLines={1}>
            {hashtags.join('  ')}
          </Text>
        )}

        {/* Time + location + view notes */}
        <View style={styles.metaRow}>
          <Text style={styles.metaText}>
            {[timeAgo, location?.toUpperCase()].filter(Boolean).join(' · ')}
          </Text>
          {comments > 0 && (
            <TouchableOpacity
              onPress={() => router.push(`/outfit/${post.id}`)}
              activeOpacity={0.75}
            >
              <Text style={styles.viewNotes}>View all {comments} notes</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* ─── Lightbox Inspection Studio ─── */}
      <ImageZoomLightbox
        visible={lightboxVisible}
        imageUrl={imageUrl}
        creatorName={creator?.username}
        onClose={() => setLightboxVisible(false)}
      />

      {/* ─── 9:16 Editorial Lookbook Export ─── */}
      <EditorialStoryModal
        visible={storyModalVisible}
        post={post}
        onClose={() => setStoryModalVisible(false)}
      />
    </View>
  );
});

// ─── Legacy export for back-compat ───────────────────────────
export const OutfitCard = EditorialOutfitCard;

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FAF8F5',
    borderBottomWidth: 1,
    borderBottomColor: '#EBE6DE',
    paddingBottom: 4,
    marginBottom: 0,
  },

  // ─── Creator Header ───────────────────────────────────────
  creatorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 8,
  },
  creatorLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 10,
  },
  avatarRing: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#E8E3DA',
    borderWidth: 1.5,
    borderColor: '#D4CEBF',
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#1C1C1E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontFamily: Typography.fontBody,
    fontSize: 15,
    fontWeight: '700',
    color: '#FAF8F5',
  },
  creatorInfo: {
    flex: 1,
    gap: 2,
  },
  creatorNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  displayName: {
    fontFamily: Typography.fontBody,
    fontSize: 13,
    fontWeight: '700',
    color: Colors.charcoal,
  },
  rolePill: {
    backgroundColor: '#1C1C1E',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 3,
  },
  rolePillText: {
    fontFamily: Typography.fontBody,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
    color: '#FAF8F5',
  },
  locationText: {
    fontFamily: Typography.fontBody,
    fontSize: 10,
    fontWeight: '500',
    color: Colors.textTertiary,
    letterSpacing: 0.5,
  },
  creatorRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  followBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: Colors.charcoal,
    backgroundColor: 'transparent',
  },
  followingBtn: {
    backgroundColor: Colors.charcoal,
    borderColor: Colors.charcoal,
  },
  followBtnText: {
    fontFamily: Typography.fontBody,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
    color: Colors.charcoal,
  },
  followingBtnText: {
    color: '#FAF8F5',
  },
  moreBtn: {
    padding: 4,
  },

  // ─── Image ────────────────────────────────────────────────
  imageContainer: {
    position: 'relative',
    width: '100%',
    backgroundColor: '#E8E3DA',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    backgroundColor: '#E8E3DA',
  },
  counterBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 4,
  },
  counterText: {
    fontFamily: Typography.fontBody,
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  zoomBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(10,10,12,0.65)',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 4,
    zIndex: 5,
  },
  zoomBadgeText: {
    fontFamily: Typography.fontBody,
    fontSize: 9,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.8,
  },
  productTagsRow: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
    maxWidth: SW - 80,
  },
  productTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(10,10,12,0.78)',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 4,
  },
  productTagDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#FFFFFF',
    opacity: 0.8,
  },
  productTagText: {
    fontFamily: Typography.fontBody,
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.4,
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
    fontSize: 80,
    color: Colors.likeActive,
    textShadowColor: 'rgba(0,0,0,0.25)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 10,
  },

  // ─── Action Row ───────────────────────────────────────────
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 6,
    gap: 0,
  },
  actionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    flex: 1,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 2,
  },
  actionSep: {
    width: 28,
    height: 1,
    backgroundColor: '#D4CEBF',
    marginHorizontal: 8,
  },
  actionCount: {
    fontFamily: Typography.fontBody,
    fontSize: 13,
    fontWeight: '600',
    color: Colors.charcoal,
  },
  likedCount: {
    color: Colors.likeActive,
  },
  savedCount: {
    color: Colors.gold,
  },

  // ─── Content / Caption ────────────────────────────────────
  contentWrap: {
    paddingHorizontal: 14,
    paddingBottom: 10,
    gap: 4,
  },
  caption: {
    fontFamily: Typography.fontBody,
    fontSize: 13,
    color: Colors.charcoal,
    lineHeight: 19,
  },
  captionAuthor: {
    fontWeight: '700',
    color: Colors.charcoal,
  },
  moreText: {
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  hashtagRow: {
    fontFamily: Typography.fontBody,
    fontSize: 12,
    color: Colors.textSecondary,
    letterSpacing: 0.2,
    marginTop: 2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  metaText: {
    fontFamily: Typography.fontBody,
    fontSize: 11,
    fontWeight: '500',
    color: Colors.textTertiary,
    letterSpacing: 0.5,
  },
  viewNotes: {
    fontFamily: Typography.fontBody,
    fontSize: 11,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
});
