// ============================================================
// User & Profile Types
// ============================================================

import type { UserRole } from './auth';
import type { StyleCategory, Occasion, FitPreference, ColorPreference } from '../constants/fashion';

export interface UserPublicProfile {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  bio: string | null;
  location: string | null;
  isPrivate: boolean;
  isVerified: boolean;
  followersCount: number;
  followingCount: number;
  postsCount: number;
  isFollowing: boolean;
  isFollowedBy: boolean;
  isBlocked: boolean;
  joinedAt: string;
}

export interface UserPrivateProfile extends UserPublicProfile {
  email: string;
  role: UserRole;
  isEmailVerified: boolean;
  isOnboarded: boolean;
  isSuspended: boolean;
  preferences: UserPreferences;
}

export interface UserPreferences {
  styleCategories: StyleCategory[];
  occasions: Occasion[];
  colorPreferences: ColorPreference[];
  fitPreferences: FitPreference[];
  budgetMin: number | null;
  budgetMax: number | null;
  currency: string;
  city: string | null;
  brands: string[];
  showBudgetOnProfile: boolean;
}

export interface UserSummary {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  isFollowing: boolean;
}

export interface UpdateProfileRequest {
  displayName?: string;
  bio?: string;
  location?: string;
  avatarUrl?: string | null;
  isPrivate?: boolean;
}

export interface UpdatePreferencesRequest {
  styleCategories?: StyleCategory[];
  occasions?: Occasion[];
  colorPreferences?: ColorPreference[];
  fitPreferences?: FitPreference[];
  budgetMin?: number;
  budgetMax?: number;
  currency?: string;
  city?: string;
  brands?: string[];
  showBudgetOnProfile?: boolean;
}

export interface FollowersResponse {
  users: UserSummary[];
  meta: {
    hasMore: boolean;
    cursor: string | null;
  };
}

export interface BlockedUsersResponse {
  users: UserSummary[];
}
