// ============================================================
// useCollections — Hooks for collection boards & saved outfits
// ============================================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/apiClient';
import type { ApiResponse, Collection } from '@tavallin/shared';

export interface CollectionOutfitItem {
  id: string;
  caption: string | null;
  author: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl: string | null;
  };
  media: Array<{
    publicUrl: string;
    thumbnailUrl: string | null;
  }>;
  savedAt: string;
}

export interface CollectionDetailResponse {
  collection: Collection;
  outfits: CollectionOutfitItem[];
}

export function useMyCollections() {
  return useQuery({
    queryKey: ['collections', 'me'],
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<Collection[]>>('/collections/me');
      return res.data.data;
    },
    staleTime: 1000 * 60 * 2,
  });
}

export function useCollection(id: string) {
  return useQuery({
    queryKey: ['collection', id],
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<CollectionDetailResponse>>(`/collections/${id}`);
      return res.data.data;
    },
    enabled: !!id,
  });
}

export function useCreateCollection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { name: string; description?: string; isPublic?: boolean }) => {
      const res = await apiClient.post<ApiResponse<Collection>>('/collections', data);
      return res.data.data;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['collections', 'me'] });
    },
  });
}

export function useDeleteCollection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/collections/${id}`);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['collections', 'me'] });
    },
  });
}
