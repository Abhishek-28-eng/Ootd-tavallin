// ============================================================
// Admin Panel Types
// ============================================================

import type { UserRole } from './auth';
import type { ReportCategory, ReportTargetType } from './social';

export type AccountStatus = 'active' | 'suspended' | 'deleted';
export type ReportStatus = 'pending' | 'under_review' | 'resolved' | 'dismissed';
export type ModerationAction = 'remove_content' | 'restore_content' | 'suspend_user' | 'reactivate_user' | 'warn_user' | 'dismiss_report';

export interface AdminUser {
  id: string;
  email: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  role: UserRole;
  status: AccountStatus;
  isEmailVerified: boolean;
  postsCount: number;
  followersCount: number;
  lastActiveAt: string | null;
  createdAt: string;
}

export interface ContentReport {
  id: string;
  reporter: { id: string; username: string };
  targetType: ReportTargetType;
  targetId: string;
  category: ReportCategory;
  description: string | null;
  status: ReportStatus;
  resolvedBy: { id: string; username: string } | null;
  moderationNote: string | null;
  resolvedAt: string | null;
  createdAt: string;
}

export interface AuditLogEntry {
  id: string;
  actor: { id: string; username: string; role: UserRole };
  action: string;
  targetType: string;
  targetId: string;
  description: string;
  ipAddress: string;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface DashboardStats {
  totalUsers: number;
  newUsersToday: number;
  newUsersThisWeek: number;
  totalPosts: number;
  newPostsToday: number;
  activeUsersToday: number;
  pendingReports: number;
  resolvedReportsThisWeek: number;
}

export interface AdminStyleCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  isActive: boolean;
  postsCount: number;
  createdAt: string;
}

export interface SuspendUserRequest {
  reason: string;
  durationDays?: number; // undefined = indefinite
}

export interface ModerateReportRequest {
  action: ModerationAction;
  note?: string;
}
