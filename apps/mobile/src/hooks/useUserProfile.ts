// ============================================================
// useUserProfile — Profile, follow, and user posts hooks
// ============================================================

import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { apiClient } from '../lib/apiClient';
import type { ApiResponse, UserPublicProfile, UserPrivateProfile, FollowResponse, FeedResponse, UserSummary, OutfitPost } from '@tavallin/shared';

export function useMyProfile() {
  return useQuery({
    queryKey: ['profile', 'me'],
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<UserPrivateProfile>>('/users/me');
      return res.data.data;
    },
    staleTime: 1000 * 60 * 2,
  });
}

export function useUserProfile(username: string) {
  return useQuery({
    queryKey: ['profile', username],
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<UserPublicProfile>>(`/users/${username}`);
      return res.data.data;
    },
    enabled: !!username,
  });
}

export function useUserPosts(username: string) {
  return useInfiniteQuery({
    queryKey: ['userPosts', username],
    queryFn: async ({ pageParam }): Promise<FeedResponse> => {
      const params: Record<string, string | number> = { limit: 18 };
      if (pageParam) params['cursor'] = pageParam as string;
      const res = await apiClient.get<ApiResponse<FeedResponse | OutfitPost[]>>(`/outfits/user/${username}`, { params });
      const raw = res.data.data;
      if (Array.isArray(raw)) {
        return { posts: raw as unknown as OutfitPost[], meta: { hasMore: false, cursor: null } };
      }
      return raw ?? { posts: [], meta: { hasMore: false, cursor: null } };
    },
    getNextPageParam: (last) => (last?.meta?.hasMore ? last.meta.cursor ?? undefined : undefined),
    initialPageParam: undefined as string | undefined,
    enabled: !!username,
  });
}

export function useToggleFollow(username: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (currentlyFollowing: boolean) => {
      if (currentlyFollowing) {
        const res = await apiClient.delete<ApiResponse<FollowResponse>>(`/users/${username}/follow`);
        return res.data.data;
      } else {
        const res = await apiClient.post<ApiResponse<FollowResponse>>(`/users/${username}/follow`);
        return res.data.data;
      }
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['profile', username] });
    },
  });
}

export function useFollowers(username: string) {
  return useQuery({
    queryKey: ['followers', username],
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<UserSummary[]>>(`/users/${username}/followers`);
      return res.data.data;
    },
    enabled: !!username,
  });
}

export function useFollowing(username: string) {
  return useQuery({
    queryKey: ['following', username],
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<UserSummary[]>>(`/users/${username}/following`);
      return res.data.data;
    },
    enabled: !!username,
  });
}
