// ============================================================
// Social Feature Types — Comments, Reports, etc.
// ============================================================

import type { UserSummary } from './user';

export interface Comment {
  id: string;
  author: UserSummary;
  content: string;
  likesCount: number;
  isLiked: boolean;
  isOwner: boolean;
  parentId: string | null;
  repliesCount: number;
  replies?: Comment[];
  createdAt: string;
  updatedAt: string;
}

export interface CommentsResponse {
  comments: Comment[];
  meta: {
    hasMore: boolean;
    cursor: string | null;
    total: number;
  };
}

export interface CreateCommentRequest {
  content: string;
  parentId?: string;
}

export type ReportTargetType = 'outfit' | 'user' | 'comment';
export type ReportCategory =
  | 'spam'
  | 'nudity_or_sexual_content'
  | 'hate_speech'
  | 'violence'
  | 'harassment'
  | 'intellectual_property'
  | 'false_information'
  | 'other';

export interface CreateReportRequest {
  targetType: ReportTargetType;
  targetId: string;
  category: ReportCategory;
  description?: string;
}

export interface LikeResponse {
  liked: boolean;
  likesCount: number;
}

export interface SaveResponse {
  saved: boolean;
  savesCount: number;
  collectionId?: string;
}

export interface FollowResponse {
  following: boolean;
  followersCount: number;
}
