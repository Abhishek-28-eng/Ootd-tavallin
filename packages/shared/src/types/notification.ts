// ============================================================
// Notification Types
// ============================================================

export type NotificationType =
  | 'new_follower'
  | 'outfit_liked'
  | 'outfit_commented'
  | 'comment_replied'
  | 'comment_liked'
  | 'account_suspended'
  | 'account_reactivated'
  | 'content_removed'
  | 'report_resolved'
  | 'system';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  isRead: boolean;
  actorId: string | null;
  actorUsername: string | null;
  actorAvatarUrl: string | null;
  targetId: string | null;       // outfit ID, comment ID, etc.
  targetType: string | null;
  deepLink: string | null;
  createdAt: string;
}

export interface NotificationsResponse {
  notifications: Notification[];
  unreadCount: number;
  meta: {
    hasMore: boolean;
    cursor: string | null;
  };
}

export interface DeviceTokenRequest {
  token: string;
  platform: 'ios' | 'android';
  expoToken?: string;
}
