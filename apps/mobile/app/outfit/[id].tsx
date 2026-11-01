// ============================================================
// Outfit Detail Screen — Tavallin Luxury Editorial Post View
// Full post view: photography carousel, creator, interactions, comments
// ============================================================

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  Share,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons, Feather } from '@expo/vector-icons';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withSequence } from 'react-native-reanimated';
import { Colors, Typography, Spacing, Radii, Shadows } from '../../src/design/tokens';
import { apiClient } from '../../src/lib/apiClient';
import { hapticLight, hapticSuccess, hapticMedium } from '../../src/lib/haptics';
import { ImageZoomLightbox } from '../../src/components/ImageZoomLightbox';
import { EditorialStoryModal } from '../../src/components/EditorialStoryModal';
import { STYLE_CATEGORY_LABELS, OCCASION_LABELS } from '@tavallin/shared';
import type { ApiResponse, OutfitPost, CommentsResponse, Comment } from '@tavallin/shared';

const { width: SW } = Dimensions.get('window');
const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export default function OutfitDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const insets = useSafeAreaInsets();
  const [commentText, setCommentText] = useState('');
  const [imgIndex, setImgIndex] = useState(0);
  const [lightboxVisible, setLightboxVisible] = useState(false);
  const [storyModalVisible, setStoryModalVisible] = useState(false);
  const [selectedZoomImg, setSelectedZoomImg] = useState('');

  const likeScale = useSharedValue(1);
  const saveScale = useSharedValue(1);
  const likeStyle = useAnimatedStyle(() => ({ transform: [{ scale: likeScale.value }] }));
  const saveStyle = useAnimatedStyle(() => ({ transform: [{ scale: saveScale.value }] }));

  // Fetch post
  const { data: post, isLoading: postLoading } = useQuery({
    queryKey: ['outfit', id],
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<OutfitPost>>(`/outfits/${id}`);
      return res.data.data;
    },
    enabled: !!id,
  });

  // Fetch comments
  const { data: commentsData, isLoading: commentsLoading } = useQuery({
    queryKey: ['comments', id],
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<CommentsResponse>>(`/comments/outfit/${id}?limit=30`);
      return res.data.data;
    },
    enabled: !!id,
  });

  const comments = commentsData?.comments ?? [];

  // Like mutation
  const likeMutation = useMutation({
    mutationFn: async () => {
      const res = await apiClient.post<{ data: unknown }>(`/outfits/${id}/like`);
      return res.data.data;
    },
    onMutate: () => {
      hapticSuccess();
      likeScale.value = withSequence(withSpring(1.35, { damping: 4 }), withSpring(1, { damping: 8 }));
      qc.setQueryData<OutfitPost>(['outfit', id], (old) =>
        old ? { ...old, isLiked: !old.isLiked, likesCount: old.isLiked ? old.likesCount - 1 : old.likesCount + 1 } : old,
      );
    },
  });

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      const res = await apiClient.post<{ data: unknown }>(`/outfits/${id}/save`);
      return res.data.data;
    },
    onMutate: () => {
      hapticLight();
      saveScale.value = withSequence(withSpring(1.35, { damping: 4 }), withSpring(1, { damping: 8 }));
      qc.setQueryData<OutfitPost>(['outfit', id], (old) =>
        old ? { ...old, isSaved: !old.isSaved, savesCount: old.isSaved ? old.savesCount - 1 : old.savesCount + 1 } : old,
      );
    },
  });

  // Post comment
  const commentMutation = useMutation({
    mutationFn: async (content: string) => {
      await apiClient.post(`/comments/outfit/${id}`, { content });
    },
    onSuccess: () => {
      hapticSuccess();
      setCommentText('');
      void qc.invalidateQueries({ queryKey: ['comments', id] });
      void qc.invalidateQueries({ queryKey: ['outfit', id] });
    },
    onError: () => Alert.alert('Failed', 'Could not post comment.'),
  });

  const handlePostComment = () => {
    if (commentText.trim()) commentMutation.mutate(commentText.trim());
  };

  const handleShareLook = () => {
    hapticLight();
    setStoryModalVisible(true);
  };

  if (postLoading || !post) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => router.back()} style={styles.topBarIconBtn} activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={20} color={Colors.charcoal} />
          </TouchableOpacity>
        </View>
        <View style={styles.loading}>
          <ActivityIndicator color={Colors.charcoal} />
        </View>
      </SafeAreaView>
    );
  }

  const creator = post.creator ?? (post as any).author ?? { username: '', displayName: '', avatarUrl: null };

  const renderComment = ({ item }: { item: Comment }) => (
    <View style={styles.commentItem}>
      <View style={styles.commentAvatarWrap}>
        {item.author.avatarUrl ? (
          <Image source={{ uri: item.author.avatarUrl }} style={styles.commentAvatar} contentFit="cover" cachePolicy="memory-disk" />
        ) : (
          <View style={styles.commentAvatarFallback}>
            <Text style={styles.commentAvatarInitial}>
              {(item.author.username || 'U')[0]?.toUpperCase()}
            </Text>
          </View>
        )}
      </View>
      <View style={styles.commentContent}>
        <View style={styles.commentMeta}>
          <Text style={styles.commentAuthor}>@{item.author.username}</Text>
          <Text style={styles.commentTime}>{_timeAgo(item.createdAt)}</Text>
        </View>
        <Text style={styles.commentText}>{item.content}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        {/* Top Navigation Bar */}
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => router.back()} style={styles.topBarIconBtn} activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={20} color={Colors.charcoal} />
          </TouchableOpacity>

          <View style={styles.topBarCenter}>
            <Text style={styles.topBarEyebrow}>✦ LOOKBOOK ENTRY</Text>
            <Text style={styles.topBarTitle}>EDITORIAL ARCHIVE</Text>
          </View>

          <View style={styles.topBarRight}>
            <TouchableOpacity onPress={handleShareLook} style={styles.topBarIconBtn} activeOpacity={0.7}>
              <Ionicons name="share-outline" size={19} color={Colors.charcoal} />
            </TouchableOpacity>

            {post.isOwner && (
              <TouchableOpacity
                onPress={() =>
                  Alert.alert('Archive Post', 'Remove this outfit look from your portfolio?', [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Delete',
                      style: 'destructive',
                      onPress: async () => {
                        await apiClient.delete(`/outfits/${id}`);
                        void qc.invalidateQueries({ queryKey: ['feed'] });
                        void qc.invalidateQueries({ queryKey: ['userPosts'] });
                        router.back();
                      },
                    },
                  ])
                }
                style={[styles.topBarIconBtn, styles.deleteBtn]}
                activeOpacity={0.7}
              >
                <Ionicons name="trash-outline" size={18} color={Colors.error} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Creator Profile Row (Header) */}
          <View style={styles.authorRow}>
            <TouchableOpacity
              style={styles.authorLeft}
              onPress={() => router.push(`/user/${creator.username}`)}
              activeOpacity={0.8}
            >
              <View style={styles.avatarBorderRing}>
                {creator.avatarUrl ? (
                  <Image source={{ uri: creator.avatarUrl }} style={styles.avatar} contentFit="cover" cachePolicy="memory-disk" />
                ) : (
                  <View style={styles.avatarFallback}>
                    <Text style={styles.avatarFallbackText}>{(creator.username || 'U')[0]?.toUpperCase()}</Text>
                  </View>
                )}
              </View>
              <View>
                <View style={styles.creatorNameRow}>
                  <Text style={styles.displayName}>{creator.displayName || creator.username}</Text>
                  <Text style={styles.goldStar}>✦</Text>
                </View>
                <Text style={styles.username}>@{creator.username}</Text>
              </View>
            </TouchableOpacity>

            <View style={styles.tierPill}>
              <Text style={styles.tierPillText}>CURATOR</Text>
            </View>
          </View>

          {/* Image carousel */}
          <View style={styles.mediaContainer}>
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={(e) => {
                setImgIndex(Math.round(e.nativeEvent.contentOffset.x / SW));
              }}
            >
              {post.media.map((m, idx) => {
                const imgUrl = m.url ?? (m as any).publicUrl ?? '';
                const ratio = m.width && m.height ? Math.min(Math.max(m.width / m.height, 0.75), 1.25) : 0.8;
                return (
                  <TouchableOpacity
                    key={m.id || idx}
                    activeOpacity={0.95}
                    onPress={() => {
                      hapticLight();
                      setSelectedZoomImg(imgUrl);
                      setLightboxVisible(true);
                    }}
                  >
                    <Image
                      source={{ uri: imgUrl }}
                      style={[styles.mainImage, { aspectRatio: ratio }]}
                      contentFit="cover"
                      cachePolicy="memory-disk"
                      transition={200}
                    />
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Inspect Lightbox Badge */}
            <TouchableOpacity
              style={styles.inspectBadge}
              onPress={() => {
                hapticLight();
                const currentImg = post.media[imgIndex]?.url ?? (post.media[imgIndex] as any)?.publicUrl ?? '';
                setSelectedZoomImg(currentImg);
                setLightboxVisible(true);
              }}
              activeOpacity={0.8}
            >
              <Ionicons name="expand-outline" size={13} color="#FFFFFF" />
              <Text style={styles.inspectBadgeText}>INSPECT</Text>
            </TouchableOpacity>

            {/* Pagination badge if multiple */}
            {post.media.length > 1 && (
              <View style={styles.counterBadge}>
                <Text style={styles.counterText}>{imgIndex + 1} / {post.media.length}</Text>
              </View>
            )}
          </View>

          {/* Dots Indicator */}
          {post.media.length > 1 && (
            <View style={styles.dotsRow}>
              {post.media.map((_, i) => (
                <View key={i} style={[styles.dot, i === imgIndex && styles.dotActive]} />
              ))}
            </View>
          )}

          {/* Actions & Metrics Row */}
          <View style={styles.actionSection}>
            <View style={styles.actionLeftGroup}>
              <AnimatedTouchable style={[styles.iconButton, likeStyle]} onPress={() => likeMutation.mutate()} activeOpacity={0.8}>
                <Ionicons
                  name={post.isLiked ? 'heart' : 'heart-outline'}
                  size={24}
                  color={post.isLiked ? Colors.likeActive : Colors.charcoal}
                />
                <Text style={[styles.actionCount, post.isLiked && styles.actionCountLiked]}>
                  {post.likesCount ?? 0}
                </Text>
              </AnimatedTouchable>

              <View style={styles.iconButton}>
                <Ionicons name="chatbubble-outline" size={22} color={Colors.charcoal} />
                <Text style={styles.actionCount}>{post.commentsCount ?? 0}</Text>
              </View>

              <TouchableOpacity style={styles.iconButton} onPress={handleShareLook} activeOpacity={0.8}>
                <Feather name="send" size={20} color={Colors.charcoal} />
              </TouchableOpacity>
            </View>

            <AnimatedTouchable style={saveStyle} onPress={() => saveMutation.mutate()} activeOpacity={0.8}>
              <Ionicons
                name={post.isSaved ? 'bookmark' : 'bookmark-outline'}
                size={24}
                color={post.isSaved ? Colors.gold : Colors.charcoal}
              />
            </AnimatedTouchable>
          </View>

          {/* Caption & Story */}
          {post.caption ? (
            <View style={styles.captionSection}>
              <Text style={styles.captionUser}>@{creator.username}</Text>
              <Text style={styles.captionText}>{post.caption}</Text>
            </View>
          ) : null}

          {/* Style Category & Occasion Badges */}
          {(((post.styleCategories && post.styleCategories.length > 0)) || ((post.occasions && post.occasions.length > 0))) && (
            <View style={styles.tagsContainer}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tagsScroll}>
                {(post.styleCategories || []).map((s) => (
                  <View key={s} style={styles.goldTag}>
                    <Text style={styles.goldTagText}>
                      ✦ {STYLE_CATEGORY_LABELS[s] || s}
                    </Text>
                  </View>
                ))}
                {(post.occasions || []).map((o) => (
                  <View key={o} style={styles.occasionTag}>
                    <Text style={styles.occasionTagText}>
                      {OCCASION_LABELS[o] || o}
                    </Text>
                  </View>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Tagged Garments / Products ("Shop This Look") */}
          {post.products && post.products.length > 0 && (
            <View style={styles.productsSection}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionHeaderTitle}>FEATURED GARMENTS & ACCESSORIES</Text>
                <View style={styles.productBadge}>
                  <Text style={styles.productBadgeText}>{post.products.length} PIECES</Text>
                </View>
              </View>

              {post.products.map((p) => (
                <View key={p.id} style={styles.productCard}>
                  {p.imageUrl ? (
                    <Image source={{ uri: p.imageUrl }} style={styles.productThumb} contentFit="cover" cachePolicy="memory-disk" />
                  ) : (
                    <View style={styles.productThumbFallback}>
                      <Ionicons name="pricetag-outline" size={20} color={Colors.gold} />
                    </View>
                  )}
                  <View style={styles.productInfo}>
                    <Text style={styles.productName} numberOfLines={1}>{p.productName}</Text>
                    {p.brand && <Text style={styles.productBrand}>{p.brand}</Text>}
                  </View>
                  {p.price ? (
                    <View style={styles.pricePill}>
                      <Text style={styles.priceText}>{p.currency || '$'}{p.price}</Text>
                    </View>
                  ) : null}
                </View>
              ))}
            </View>
          )}

          {/* Comments Discussion Section */}
          <View style={styles.commentsSection}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionHeaderTitle}>CRITIQUE & CONVERSATION</Text>
              <Text style={styles.commentCountBadge}>({comments.length})</Text>
            </View>

            {commentsLoading ? (
              <ActivityIndicator color={Colors.charcoal} style={{ marginVertical: Spacing[4] }} />
            ) : comments.length === 0 ? (
              <View style={styles.noCommentsWrap}>
                <Text style={styles.noCommentsIcon}>✦</Text>
                <Text style={styles.noComments}>Be the first to share style feedback on this look.</Text>
              </View>
            ) : (
              comments.map((c) => <View key={c.id}>{renderComment({ item: c })}</View>)
            )}
          </View>

          <View style={{ height: 90 + insets.bottom }} />
        </ScrollView>

        {/* Sticky Comment Input Bar */}
        <View style={[styles.commentInputBar, { paddingBottom: insets.bottom || Spacing[3] }]}>
          <View style={styles.commentInputContainer}>
            <TextInput
              style={styles.commentInput}
              placeholder="Add style critique or feedback…"
              placeholderTextColor={Colors.textPlaceholder}
              value={commentText}
              onChangeText={setCommentText}
              returnKeyType="send"
              onSubmitEditing={handlePostComment}
            />
            <TouchableOpacity
              onPress={handlePostComment}
              disabled={!commentText.trim() || commentMutation.isPending}
              style={[
                styles.sendCircleBtn,
                (!commentText.trim() || commentMutation.isPending) && styles.sendBtnDisabled,
              ]}
              activeOpacity={0.8}
            >
              {commentMutation.isPending ? (
                <ActivityIndicator color={Colors.warmWhite} size="small" />
              ) : (
                <Ionicons name="arrow-up" size={16} color={Colors.warmWhite} />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* Lightbox Inspection Studio */}
      <ImageZoomLightbox
        visible={lightboxVisible}
        imageUrl={selectedZoomImg || (post.media[0]?.url ?? (post.media[0] as any)?.publicUrl ?? '')}
        creatorName={creator?.username}
        onClose={() => setLightboxVisible(false)}
      />

      {/* 9:16 Editorial Lookbook Export */}
      <EditorialStoryModal
        visible={storyModalVisible}
        post={post}
        onClose={() => setStoryModalVisible(false)}
      />
    </SafeAreaView>
  );
}

function _timeAgo(d: string) {
  const min = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
  if (min < 1) return 'now';
  if (min < 60) return `${min}m`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h`;
  return `${Math.floor(hr / 24)}d`;
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
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[2],
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    backgroundColor: Colors.warmWhite,
  },
  topBarIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBarCenter: {
    alignItems: 'center',
  },
  topBarEyebrow: {
    fontFamily: Typography.fontBody,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.5,
    color: Colors.textGold,
  },
  topBarTitle: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.xs,
    fontWeight: '800',
    letterSpacing: 2,
    color: Colors.charcoal,
  },
  topBarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
  },
  deleteBtn: {
    backgroundColor: Colors.errorLight,
    borderColor: 'rgba(198,40,40,0.2)',
  },

  // ─── Author Row ────────────────────────────────────────────
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing[5],
    paddingVertical: Spacing[3],
    backgroundColor: Colors.warmWhite,
  },
  authorLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
    flex: 1,
  },
  avatarBorderRing: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: Colors.gold,
    padding: 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
  },
  avatar: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
    backgroundColor: Colors.softGray,
  },
  avatarFallback: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
    backgroundColor: Colors.charcoal,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarFallbackText: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.sm,
    fontWeight: '700',
    color: Colors.warmWhite,
  },
  creatorNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  displayName: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.sm + 1,
    fontWeight: '700',
    color: Colors.charcoal,
  },
  goldStar: {
    fontSize: 10,
    color: Colors.gold,
  },
  username: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.xs,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  tierPill: {
    backgroundColor: Colors.goldDust,
    paddingHorizontal: Spacing[2] + 2,
    paddingVertical: 3,
    borderRadius: Radii.full,
    borderWidth: 1,
    borderColor: Colors.borderGold,
  },
  tierPillText: {
    fontFamily: Typography.fontBody,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
    color: Colors.textGold,
  },

  // ─── Media Carousel ────────────────────────────────────────
  mediaContainer: {
    position: 'relative',
    backgroundColor: Colors.softGray,
  },
  mainImage: {
    width: SW,
    backgroundColor: Colors.softGray,
  },
  counterBadge: {
    position: 'absolute',
    top: Spacing[3],
    right: Spacing[4],
    backgroundColor: 'rgba(10,10,12,0.7)',
    paddingHorizontal: Spacing[2] + 2,
    paddingVertical: 3,
    borderRadius: Radii.full,
  },
  counterText: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.xs - 1,
    fontWeight: '700',
    color: Colors.warmWhite,
    letterSpacing: 1,
  },
  inspectBadge: {
    position: 'absolute',
    top: Spacing[3],
    left: Spacing[4],
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(10,10,12,0.7)',
    paddingHorizontal: Spacing[2] + 4,
    paddingVertical: 4,
    borderRadius: Radii.full,
    zIndex: 5,
  },
  inspectBadgeText: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.xs - 2,
    fontWeight: '800',
    color: Colors.warmWhite,
    letterSpacing: 1,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    paddingVertical: Spacing[3],
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.midGray,
  },
  dotActive: {
    backgroundColor: Colors.charcoal,
    width: 18,
    borderRadius: 3,
  },

  // ─── Actions Row ───────────────────────────────────────────
  actionSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing[5],
    paddingVertical: Spacing[2],
  },
  actionLeftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[5],
  },
  iconButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionCount: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.sm,
    fontWeight: '700',
    color: Colors.charcoal,
  },
  actionCountLiked: {
    color: Colors.likeActive,
  },

  // ─── Caption Section ───────────────────────────────────────
  captionSection: {
    paddingHorizontal: Spacing[5],
    paddingTop: Spacing[2],
    paddingBottom: Spacing[3],
  },
  captionUser: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.sm,
    fontWeight: '800',
    color: Colors.charcoal,
    marginBottom: 2,
  },
  captionText: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.sm + 1,
    color: Colors.charcoal,
    lineHeight: (Typography.sm + 1) * 1.5,
  },

  // ─── Tags ──────────────────────────────────────────────────
  tagsContainer: {
    paddingVertical: Spacing[2],
  },
  tagsScroll: {
    paddingHorizontal: Spacing[5],
    gap: Spacing[2],
  },
  goldTag: {
    backgroundColor: Colors.goldDust,
    paddingHorizontal: Spacing[3],
    paddingVertical: 5,
    borderRadius: Radii.full,
    borderWidth: 1,
    borderColor: Colors.borderGold,
  },
  goldTagText: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.xs,
    fontWeight: '700',
    color: Colors.textGold,
  },
  occasionTag: {
    backgroundColor: Colors.surfaceElevated,
    paddingHorizontal: Spacing[3],
    paddingVertical: 5,
    borderRadius: Radii.full,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  occasionTagText: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.xs,
    fontWeight: '600',
    color: Colors.textSecondary,
  },

  // ─── Products ──────────────────────────────────────────────
  productsSection: {
    paddingHorizontal: Spacing[5],
    paddingTop: Spacing[5],
    paddingBottom: Spacing[3],
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing[3],
  },
  sectionHeaderTitle: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.xs - 1,
    fontWeight: '800',
    letterSpacing: 1.5,
    color: Colors.textSecondary,
  },
  productBadge: {
    backgroundColor: Colors.softGray,
    paddingHorizontal: Spacing[2],
    paddingVertical: 2,
    borderRadius: Radii.sm,
  },
  productBadgeText: {
    fontFamily: Typography.fontBody,
    fontSize: 9,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  productCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Radii.xl,
    padding: Spacing[3],
    marginBottom: Spacing[2],
    borderWidth: 1,
    borderColor: Colors.borderLight,
    ...Shadows.sm,
  },
  productThumb: {
    width: 48,
    height: 48,
    borderRadius: Radii.md,
    backgroundColor: Colors.softGray,
  },
  productThumbFallback: {
    width: 48,
    height: 48,
    borderRadius: Radii.md,
    backgroundColor: Colors.softGray,
    alignItems: 'center',
    justifyContent: 'center',
  },
  productInfo: {
    flex: 1,
    marginLeft: Spacing[3],
  },
  productName: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.sm,
    fontWeight: '700',
    color: Colors.charcoal,
  },
  productBrand: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.xs,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  pricePill: {
    backgroundColor: Colors.surfaceElevated,
    paddingHorizontal: Spacing[3],
    paddingVertical: 4,
    borderRadius: Radii.full,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  priceText: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.xs,
    fontWeight: '800',
    color: Colors.charcoal,
  },

  // ─── Comments ──────────────────────────────────────────────
  commentsSection: {
    paddingHorizontal: Spacing[5],
    paddingTop: Spacing[5],
  },
  commentCountBadge: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.xs,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  noCommentsWrap: {
    alignItems: 'center',
    paddingVertical: Spacing[6],
    gap: Spacing[2],
  },
  noCommentsIcon: {
    fontSize: 18,
    color: Colors.gold,
  },
  noComments: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  commentItem: {
    flexDirection: 'row',
    gap: Spacing[3],
    marginBottom: Spacing[4],
  },
  commentAvatarWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    overflow: 'hidden',
  },
  commentAvatar: {
    width: '100%',
    height: '100%',
  },
  commentAvatarFallback: {
    width: '100%',
    height: '100%',
    backgroundColor: Colors.charcoal,
    alignItems: 'center',
    justifyContent: 'center',
  },
  commentAvatarInitial: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.xs,
    fontWeight: '700',
    color: Colors.warmWhite,
  },
  commentContent: {
    flex: 1,
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[2],
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  commentMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  commentAuthor: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.xs,
    fontWeight: '800',
    color: Colors.charcoal,
  },
  commentTime: {
    fontFamily: Typography.fontBody,
    fontSize: 10,
    color: Colors.textTertiary,
  },
  commentText: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.sm,
    color: Colors.charcoal,
    lineHeight: Typography.sm * 1.45,
  },

  // ─── Comment Input Bar ─────────────────────────────────────
  commentInputBar: {
    paddingHorizontal: Spacing[4],
    paddingTop: Spacing[2],
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    backgroundColor: Colors.warmWhite,
  },
  commentInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Radii.full,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingLeft: Spacing[4],
    paddingRight: Spacing[1],
    paddingVertical: Spacing[1],
    ...Shadows.sm,
  },
  commentInput: {
    flex: 1,
    fontFamily: Typography.fontBody,
    fontSize: Typography.sm,
    color: Colors.charcoal,
    paddingVertical: Platform.OS === 'ios' ? Spacing[2] : Spacing[1],
  },
  sendCircleBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.charcoal,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.sm,
  },
  sendBtnDisabled: {
    backgroundColor: Colors.midGray,
    opacity: 0.5,
  },
});
