// ============================================================
// useOutfitFeed — React Query infinite scroll hook for feeds
// ============================================================

import React from 'react';
import { useInfiniteQuery, useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { apiClient } from '../lib/apiClient';
import type { FeedResponse, OutfitPost, LikeResponse, SaveResponse } from '@tavallin/shared';
import type { ApiResponse } from '@tavallin/shared';


type FeedType = 'personalized' | 'following' | 'trending' | 'latest';

export function useHomeFeed(type: FeedType = 'personalized') {
  const qc = useQueryClient();
  // Ref-based refresh flag — avoids extra re-renders, readable in queryFn closure
  const refreshFlagRef = React.useRef(false);

  const query = useInfiniteQuery({
    queryKey: ['feed', type],
    queryFn: async ({ pageParam }): Promise<FeedResponse> => {
      const params: Record<string, string> = { type, limit: '20' };
      if (pageParam) params['cursor'] = pageParam as string;
      // If pull-to-refresh was triggered, bypass the server Redis cache
      if (refreshFlagRef.current && !pageParam) params['refresh'] = 'true';
      const res = await apiClient.get<ApiResponse<FeedResponse | OutfitPost[]>>('/outfits/feed', { params });
      const raw = res.data.data;
      if (Array.isArray(raw)) {
        return { posts: raw as unknown as OutfitPost[], meta: { hasMore: false, cursor: null } };
      }
      return raw ?? { posts: [], meta: { hasMore: false, cursor: null } };
    },
    getNextPageParam: (last) => (last?.meta?.hasMore ? last.meta.cursor ?? undefined : undefined),
    initialPageParam: undefined as string | undefined,
    staleTime: 30_000, // 30s — matches backend first-page cache TTL
  });

  // Pull-to-refresh: invalidate RQ cache + bypass Redis via refresh=true on next fetch
  const refresh = async () => {
    refreshFlagRef.current = true;
    await qc.invalidateQueries({ queryKey: ['feed', type] });
    await query.refetch();
    refreshFlagRef.current = false;
  };

  return { ...query, refresh };
}


export function useExploreFeed(filters: {
  style?: string;
  occasion?: string;
  tag?: string;
  budgetMin?: number;
  budgetMax?: number;
}) {
  return useInfiniteQuery({
    queryKey: ['explore', filters],
    queryFn: async ({ pageParam }): Promise<FeedResponse> => {
      const params: Record<string, string | number> = { limit: 20 };
      if (pageParam) params['cursor'] = pageParam as string;
      if (filters.style) params['style'] = filters.style;
      if (filters.occasion) params['occasion'] = filters.occasion;
      if (filters.tag) params['tag'] = filters.tag;
      if (filters.budgetMin != null) params['budgetMin'] = filters.budgetMin;
      if (filters.budgetMax != null) params['budgetMax'] = filters.budgetMax;
      const res = await apiClient.get<ApiResponse<FeedResponse | OutfitPost[]>>('/outfits/explore', { params });
      const raw = res.data.data;
      if (Array.isArray(raw)) {
        return { posts: raw as unknown as OutfitPost[], meta: { hasMore: false, cursor: null } };
      }
      return raw ?? { posts: [], meta: { hasMore: false, cursor: null } };
    },
    getNextPageParam: (last) => (last?.meta?.hasMore ? last.meta.cursor ?? undefined : undefined),
    initialPageParam: undefined as string | undefined,
  });
}

export function useToggleLike() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (postId: string) => {
      const res = await apiClient.post<ApiResponse<LikeResponse>>(`/outfits/${postId}/like`);
      return res.data.data;
    },
    onMutate: async (postId) => {
      // Optimistic update across all feed caches
      await qc.cancelQueries({ queryKey: ['feed'] });
      await qc.cancelQueries({ queryKey: ['explore'] });
      _optimisticToggle(qc, postId, 'like');
    },
    onError: (_err, postId) => {
      _optimisticToggle(qc, postId, 'like'); // revert
    },
  });
}

export function useToggleSave() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ postId, collectionId }: { postId: string; collectionId?: string }) => {
      const res = await apiClient.post<ApiResponse<SaveResponse>>(`/outfits/${postId}/save`, { collectionId });
      return res.data.data;
    },
    onMutate: async ({ postId }) => {
      await qc.cancelQueries({ queryKey: ['feed'] });
      await qc.cancelQueries({ queryKey: ['explore'] });
      _optimisticToggle(qc, postId, 'save');
    },
    onError: (_err, { postId }) => {
      _optimisticToggle(qc, postId, 'save');
    },
  });
}

export function useSavedOutfits() {
  return useInfiniteQuery({
    queryKey: ['savedOutfits'],
    queryFn: async ({ pageParam }): Promise<FeedResponse> => {
      const params: Record<string, string> = { limit: '20' };
      if (pageParam) params['cursor'] = pageParam as string;
      const res = await apiClient.get<ApiResponse<FeedResponse | OutfitPost[]>>('/outfits/saved', { params });
      const raw = res.data.data;
      if (Array.isArray(raw)) {
        return { posts: raw as unknown as OutfitPost[], meta: { hasMore: false, cursor: null } };
      }
      return raw ?? { posts: [], meta: { hasMore: false, cursor: null } };
    },
    getNextPageParam: (last) => (last?.meta?.hasMore ? last.meta.cursor ?? undefined : undefined),
    initialPageParam: undefined as string | undefined,
  });
}

export function useEditorialSpotlight() {
  return useQuery({
    queryKey: ['editorialSpotlight'],
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<{
        issue: string;
        season: string;
        volume: string;
        title: string;
        curator: string;
        lookbookCount: number;
        trendingCategories: Array<{ key: string; label: string; count: number }>;
      }>>('/outfits/spotlight');
      return res.data.data;
    },
    staleTime: 1000 * 60 * 10,
  });
}

function _optimisticToggle(qc: ReturnType<typeof useQueryClient>, postId: string, field: 'like' | 'save') {
  const keys = [['feed'], ['explore'], ['userPosts'], ['savedOutfits']];
  for (const key of keys) {
    qc.setQueriesData<{ pages: { posts: OutfitPost[] }[] }>(
      { queryKey: key },
      (old) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((page) => ({
            ...page,
            posts: page.posts.map((p) => {
              if (p.id !== postId) return p;
              if (field === 'like') {
                return { ...p, isLiked: !p.isLiked, likesCount: p.isLiked ? p.likesCount - 1 : p.likesCount + 1 };
              } else {
                return { ...p, isSaved: !p.isSaved, savesCount: p.isSaved ? p.savesCount - 1 : p.savesCount + 1 };
              }
            }),
          })),
        };
      },
    );
  }
}

