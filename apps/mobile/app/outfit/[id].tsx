// ============================================================
// Outfit Detail Screen — /outfit/[id]
// Full post view: images, author, likes/saves, comments
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
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withSequence } from 'react-native-reanimated';
import { Colors, Typography, Spacing, Radii } from '../../src/design/tokens';
import { apiClient } from '../../src/lib/apiClient';
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
      likeScale.value = withSequence(withSpring(1.4, { damping: 4 }), withSpring(1, { damping: 8 }));
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
      saveScale.value = withSequence(withSpring(1.4, { damping: 4 }), withSpring(1, { damping: 8 }));
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
      setCommentText('');
      void qc.invalidateQueries({ queryKey: ['comments', id] });
      void qc.invalidateQueries({ queryKey: ['outfit', id] });
    },
    onError: () => Alert.alert('Failed', 'Could not post comment.'),
  });

  const handlePostComment = () => {
    if (commentText.trim()) commentMutation.mutate(commentText.trim());
  };

  if (postLoading || !post) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loading}><ActivityIndicator color={Colors.midGray} /></View>
      </SafeAreaView>
    );
  }

  const renderComment = ({ item }: { item: Comment }) => (
    <View style={styles.commentItem}>
      <Image source={item.author.avatarUrl ? { uri: item.author.avatarUrl } : null} style={styles.commentAvatar} contentFit="cover" cachePolicy="memory-disk" />
      <View style={styles.commentContent}>
        <Text style={styles.commentAuthor}>{item.author.username}</Text>
        <Text style={styles.commentText}>{item.content}</Text>
        <Text style={styles.commentTime}>{_timeAgo(item.createdAt)}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        {/* Back */}
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          {post.isOwner && (
            <TouchableOpacity
              onPress={() =>
                Alert.alert('Delete Post', 'Are you sure?', [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Delete', style: 'destructive',
                    onPress: async () => {
                      await apiClient.delete(`/outfits/${id}`);
                      void qc.invalidateQueries({ queryKey: ['feed'] });
                      router.back();
                    },
                  },
                ])
              }
            >
              <Text style={styles.deleteText}>Delete</Text>
            </TouchableOpacity>
          )}
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Image carousel */}
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
              return (
                <Image
                  key={m.id || idx}
                  source={{ uri: imgUrl }}
                  style={[styles.mainImage, { aspectRatio: m.width && m.height ? m.width / m.height : 0.8 }]}
                  contentFit="cover"
                  cachePolicy="memory-disk"
                />
              );
            })}
          </ScrollView>

          {/* Page dots */}
          {post.media.length > 1 && (
            <View style={styles.dots}>
              {post.media.map((_, i) => (
                <View key={i} style={[styles.dot, i === imgIndex && styles.dotActive]} />
              ))}
            </View>
          )}

          {/* Author row */}
          {(() => {
            const creator = post.creator ?? (post as any).author ?? { username: '', displayName: '', avatarUrl: null };
            return (
              <View style={styles.authorRow}>
                <TouchableOpacity
                  style={styles.authorLeft}
                  onPress={() => router.push(`/user/${creator.username}`)}
                >
                  <Image source={creator.avatarUrl ? { uri: creator.avatarUrl } : null} style={styles.avatar} contentFit="cover" cachePolicy="memory-disk" />
                  <View>
                    <Text style={styles.displayName}>{creator.displayName || creator.username}</Text>
                    <Text style={styles.username}>@{creator.username}</Text>
                  </View>
                </TouchableOpacity>
                <View style={styles.actionsRow}>
                  <AnimatedTouchable style={likeStyle} onPress={() => likeMutation.mutate()}>
                    <Text style={[styles.actionBtn, post.isLiked && { color: Colors.likeActive }]}>
                      {post.isLiked ? '♥' : '♡'}
                    </Text>
                  </AnimatedTouchable>
                  <AnimatedTouchable style={saveStyle} onPress={() => saveMutation.mutate()}>
                    <Text style={[styles.actionBtn, post.isSaved && { color: Colors.charcoal }]}>
                      {post.isSaved ? '⊡' : '⊞'}
                    </Text>
                  </AnimatedTouchable>
                </View>
              </View>
            );
          })()}

          {/* Stats */}
          <View style={styles.statsRow}>
            <Text style={styles.stat}>{post.likesCount ?? 0} likes</Text>
            <Text style={styles.statDot}>·</Text>
            <Text style={styles.stat}>{post.commentsCount ?? 0} comments</Text>
          </View>

          {/* Caption */}
          {post.caption && (
            <View style={styles.captionWrap}>
              <Text style={styles.captionUser}>{(post.creator?.username ?? (post as any).author?.username ?? '')} </Text>
              <Text style={styles.captionText}>{post.caption}</Text>
            </View>
          )}

          {/* Tags */}
          {(((post.styleCategories && post.styleCategories.length > 0)) || ((post.occasions && post.occasions.length > 0))) && (
            <View style={styles.tagsSection}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tagsScroll}>
                {(post.styleCategories || []).map((s) => (
                  <View key={s} style={styles.tag}>
                    <Text style={styles.tagText}>{STYLE_CATEGORY_LABELS[s]}</Text>
                  </View>
                ))}
                {(post.occasions || []).map((o) => (
                  <View key={o} style={[styles.tag, styles.tagOccasion]}>
                    <Text style={styles.tagText}>{OCCASION_LABELS[o]}</Text>
                  </View>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Products */}
          {post.products && post.products.length > 0 && (
            <View style={styles.productsSection}>
              <Text style={styles.sectionTitle}>Shop this look</Text>
              {(post.products || []).map((p) => (
                <View key={p.id} style={styles.productRow}>
                  {p.imageUrl && (
                    <Image source={{ uri: p.imageUrl }} style={styles.productThumb} contentFit="cover" cachePolicy="memory-disk" />
                  )}
                  <View style={styles.productInfo}>
                    <Text style={styles.productName} numberOfLines={1}>{p.productName}</Text>
                    {p.brand && <Text style={styles.productBrand}>{p.brand}</Text>}
                    {p.price && <Text style={styles.productPrice}>{p.currency} {p.price}</Text>}
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Comments */}
          <View style={styles.commentsSection}>
            <Text style={styles.sectionTitle}>Comments</Text>
            {commentsLoading ? (
              <ActivityIndicator color={Colors.midGray} style={{ marginTop: Spacing[4] }} />
            ) : comments.length === 0 ? (
              <Text style={styles.noComments}>Be the first to comment.</Text>
            ) : (
              comments.map((c) => <View key={c.id}>{renderComment({ item: c })}</View>)
            )}
          </View>

          <View style={{ height: 80 + insets.bottom }} />
        </ScrollView>

        {/* Comment input */}
        <View style={[styles.commentInputWrap, { paddingBottom: insets.bottom || Spacing[3] }]}>
          <TextInput
            style={styles.commentInput}
            placeholder="Add a comment…"
            placeholderTextColor={Colors.textPlaceholder}
            value={commentText}
            onChangeText={setCommentText}
            returnKeyType="send"
            onSubmitEditing={handlePostComment}
          />
          <TouchableOpacity
            onPress={handlePostComment}
            disabled={!commentText.trim() || commentMutation.isPending}
            style={[styles.sendBtn, (!commentText.trim() || commentMutation.isPending) && { opacity: 0.4 }]}
          >
            {commentMutation.isPending ? (
              <ActivityIndicator color={Colors.warmWhite} size="small" />
            ) : (
              <Text style={styles.sendBtnText}>Post</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
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
  container: { flex: 1, backgroundColor: Colors.warmWhite },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing[5],
    paddingVertical: Spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  backBtn: {},
  backText: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.sm,
    color: Colors.textSecondary,
  },
  deleteText: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.sm,
    color: Colors.error,
    fontWeight: '500',
  },
  mainImage: { width: SW, backgroundColor: Colors.softGray },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 5, paddingVertical: Spacing[2] },
  dot: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: Colors.midGray },
  dotActive: { backgroundColor: Colors.charcoal, width: 14 },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing[5],
    paddingVertical: Spacing[4],
  },
  authorLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing[3], flex: 1 },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.softGray },
  displayName: { fontFamily: Typography.fontBody, fontSize: Typography.sm, fontWeight: '700', color: Colors.charcoal },
  username: { fontFamily: Typography.fontBody, fontSize: Typography.xs, color: Colors.textSecondary },
  actionsRow: { flexDirection: 'row', gap: Spacing[4] },
  actionBtn: { fontSize: 26, color: Colors.charcoal },
  statsRow: { flexDirection: 'row', paddingHorizontal: Spacing[5], gap: Spacing[2], marginBottom: Spacing[2] },
  stat: { fontFamily: Typography.fontBody, fontSize: Typography.sm, fontWeight: '600', color: Colors.charcoal },
  statDot: { fontFamily: Typography.fontBody, fontSize: Typography.sm, color: Colors.textSecondary },
  captionWrap: { paddingHorizontal: Spacing[5], marginBottom: Spacing[3], flexDirection: 'row', flexWrap: 'wrap' },
  captionUser: { fontFamily: Typography.fontBody, fontSize: Typography.sm, fontWeight: '700', color: Colors.charcoal },
  captionText: { fontFamily: Typography.fontBody, fontSize: Typography.sm, color: Colors.charcoal, lineHeight: Typography.sm * 1.5 },
  tagsSection: { paddingBottom: Spacing[3] },
  tagsScroll: { paddingHorizontal: Spacing[5], gap: Spacing[2] },
  tag: { paddingHorizontal: Spacing[3], paddingVertical: Spacing[1] + 1, borderRadius: Radii.full, backgroundColor: Colors.softGray },
  tagOccasion: { backgroundColor: Colors.blushLight },
  tagText: { fontFamily: Typography.fontBody, fontSize: Typography.xs, color: Colors.textSecondary, fontWeight: '500' },
  productsSection: { paddingHorizontal: Spacing[5], paddingBottom: Spacing[5] },
  sectionTitle: { fontFamily: Typography.fontBody, fontSize: Typography.sm, fontWeight: '700', color: Colors.charcoal, marginBottom: Spacing[3] },
  productRow: { flexDirection: 'row', gap: Spacing[3], marginBottom: Spacing[3], alignItems: 'center' },
  productThumb: { width: 56, height: 56, borderRadius: Radii.md, backgroundColor: Colors.softGray },
  productInfo: { flex: 1 },
  productName: { fontFamily: Typography.fontBody, fontSize: Typography.sm, fontWeight: '600', color: Colors.charcoal },
  productBrand: { fontFamily: Typography.fontBody, fontSize: Typography.xs, color: Colors.textSecondary },
  productPrice: { fontFamily: Typography.fontBody, fontSize: Typography.sm, fontWeight: '700', color: Colors.charcoal, marginTop: 2 },
  commentsSection: { paddingHorizontal: Spacing[5], paddingBottom: Spacing[5] },
  noComments: { fontFamily: Typography.fontBody, fontSize: Typography.sm, color: Colors.textSecondary, marginTop: Spacing[3] },
  commentItem: { flexDirection: 'row', gap: Spacing[3], marginBottom: Spacing[4] },
  commentAvatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.softGray },
  commentContent: { flex: 1 },
  commentAuthor: { fontFamily: Typography.fontBody, fontSize: Typography.sm, fontWeight: '700', color: Colors.charcoal },
  commentText: { fontFamily: Typography.fontBody, fontSize: Typography.sm, color: Colors.charcoal, lineHeight: Typography.sm * 1.5 },
  commentTime: { fontFamily: Typography.fontBody, fontSize: Typography.xs, color: Colors.textTertiary, marginTop: 2 },
  commentInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
    paddingHorizontal: Spacing[4],
    paddingTop: Spacing[2],
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    backgroundColor: Colors.warmWhite,
  },
  commentInput: {
    flex: 1,
    height: 40,
    backgroundColor: Colors.softGray,
    borderRadius: Radii.full,
    paddingHorizontal: Spacing[4],
    fontFamily: Typography.fontBody,
    fontSize: Typography.sm,
    color: Colors.charcoal,
  },
  sendBtn: {
    backgroundColor: Colors.charcoal,
    borderRadius: Radii.full,
    paddingHorizontal: Spacing[4],
    height: 40,
    justifyContent: 'center',
  },
  sendBtnText: { fontFamily: Typography.fontBody, fontSize: Typography.sm, fontWeight: '600', color: Colors.warmWhite },
});
