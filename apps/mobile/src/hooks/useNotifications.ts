// ============================================================
// useNotifications — Notifications list + mark-read hooks
// ============================================================

import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/apiClient';
import type { ApiResponse, NotificationsResponse } from '@tavallin/shared';

export function useNotifications() {
  return useInfiniteQuery({
    queryKey: ['notifications'],
    queryFn: async ({ pageParam }) => {
      const params: Record<string, string | number> = { limit: 30 };
      if (pageParam) params['cursor'] = pageParam as string;
      const res = await apiClient.get<ApiResponse<NotificationsResponse>>('/notifications', { params });
      return res.data.data;
    },
    getNextPageParam: (last) => (last?.meta?.hasMore ? last.meta.cursor ?? undefined : undefined),
    initialPageParam: undefined as string | undefined,
  });
}

export function useMarkAllRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      await apiClient.patch('/notifications/read-all');
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

export function useMarkRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (notifId: string) => {
      await apiClient.patch(`/notifications/${notifId}/read`);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}
