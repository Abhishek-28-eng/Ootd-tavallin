// ============================================================
// Users Service
// ============================================================
import { Op } from 'sequelize';
import {
  User,
  UserProfile,
  UserPreference,
  Follow,
  OutfitPost,
} from '../../database/models';
import { AppError } from '../../shared/errors/AppError';
import type { UpdateProfileInput, UpdatePreferencesInput, UserPrivateProfile, UserPreferences } from '@tavallin/shared';
import type { AuthUser } from '@tavallin/shared';

// ─── Public profile shape returned by API ────────────────────
export interface PublicProfile {
  id: string;
  username: string;
  displayName: string;
  bio: string | null;
  avatarUrl: string | null;
  coverImageUrl: string | null;
  location: string | null;
  followersCount: number;
  followingCount: number;
  postsCount: number;
  isPrivate: boolean;
  isFollowing: boolean;
  isFollowedBy: boolean;
  createdAt: string;
}

export class UsersService {
  // ─── Get own profile ─────────────────────────────────────────
  async getMe(userId: string): Promise<UserPrivateProfile & AuthUser> {
    const user = await User.findByPk(userId, {
      include: [{ model: UserProfile, as: 'profile' }],
    });
    if (!user) throw AppError.notFound('User not found');

    const profile = user.profile ?? (await UserProfile.findOne({ where: { userId: user.id } }));

    const [postsCount, followersCount, followingCount, prefs] = await Promise.all([
      OutfitPost.count({ where: { userId: user.id, status: 'published', deletedAt: null } }),
      Follow.count({ where: { followingId: user.id } }),
      Follow.count({ where: { followerId: user.id } }),
      UserPreference.findOne({ where: { userId: user.id } }),
    ]);

    // Keep cached counters in UserProfile synced
    if (
      profile &&
      (profile.postsCount !== postsCount ||
        profile.followersCount !== followersCount ||
        profile.followingCount !== followingCount)
    ) {
      await profile.update({ postsCount, followersCount, followingCount });
    }

    const defaultPreferences: UserPreferences = {
      styleCategories: [],
      occasions: [],
      colorPreferences: [],
      fitPreferences: [],
      budgetMin: null,
      budgetMax: null,
      currency: 'INR',
      city: null,
      brands: [],
      showBudgetOnProfile: false,
    };

    const preferences: UserPreferences = prefs
      ? {
          styleCategories: prefs.styleCategories
            ? typeof prefs.styleCategories === 'string'
              ? JSON.parse(prefs.styleCategories)
              : prefs.styleCategories
            : [],
          occasions: prefs.occasions
            ? typeof prefs.occasions === 'string'
              ? JSON.parse(prefs.occasions)
              : prefs.occasions
            : [],
          colorPreferences: prefs.colorPreferences
            ? typeof prefs.colorPreferences === 'string'
              ? JSON.parse(prefs.colorPreferences)
              : prefs.colorPreferences
            : [],
          fitPreferences: prefs.fitPreferences
            ? typeof prefs.fitPreferences === 'string'
              ? JSON.parse(prefs.fitPreferences)
              : prefs.fitPreferences
            : [],
          budgetMin: prefs.budgetMin != null ? Number(prefs.budgetMin) : null,
          budgetMax: prefs.budgetMax != null ? Number(prefs.budgetMax) : null,
          currency: prefs.currency ?? 'INR',
          city: prefs.city ?? null,
          brands: prefs.brands
            ? typeof prefs.brands === 'string'
              ? JSON.parse(prefs.brands)
              : prefs.brands
            : [],
          showBudgetOnProfile: prefs.showBudgetOnProfile ?? false,
        }
      : defaultPreferences;

    return {
      id: user.id,
      email: user.email,
      username: user.username,
      displayName: profile?.displayName ?? user.username,
      bio: profile?.bio ?? null,
      avatarUrl: profile?.avatarUrl ?? null,
      location: profile?.location ?? null,
      followersCount,
      followingCount,
      postsCount,
      isPrivate: user.isPrivate ?? false,
      isVerified: false,
      isFollowing: false,
      isFollowedBy: false,
      isBlocked: false,
      role: user.role as AuthUser['role'],
      isEmailVerified: user.isEmailVerified ?? false,
      isOnboarded: user.isOnboarded ?? false,
      isSuspended: user.isSuspended ?? false,
      joinedAt: user.createdAt.toISOString(),
      createdAt: user.createdAt.toISOString(),
      preferences,
    };
  }

  // ─── Get public profile by username ──────────────────────────
  async getProfile(username: string, requesterId?: string): Promise<PublicProfile> {
    const user = await User.findOne({
      where: { username: username.toLowerCase(), isSuspended: false },
      include: [{ model: UserProfile, as: 'profile' }],
    });

    if (!user) throw AppError.notFound(`User @${username} not found`);

    const profile = user.profile ?? (await UserProfile.findOne({ where: { userId: user.id } }));

    const [postsCount, followersCount, followingCount] = await Promise.all([
      OutfitPost.count({ where: { userId: user.id, status: 'published', deletedAt: null } }),
      Follow.count({ where: { followingId: user.id } }),
      Follow.count({ where: { followerId: user.id } }),
    ]);

    if (
      profile &&
      (profile.postsCount !== postsCount ||
        profile.followersCount !== followersCount ||
        profile.followingCount !== followingCount)
    ) {
      await profile.update({ postsCount, followersCount, followingCount });
    }

    let isFollowing = false;
    let isFollowedBy = false;

    if (requesterId && requesterId !== user.id) {
      const [followingRecord, followedByRecord] = await Promise.all([
        Follow.findOne({ where: { followerId: requesterId, followingId: user.id } }),
        Follow.findOne({ where: { followerId: user.id, followingId: requesterId } }),
      ]);
      isFollowing = !!followingRecord;
      isFollowedBy = !!followedByRecord;
    }

    return {
      id: user.id,
      username: user.username,
      displayName: profile?.displayName ?? user.username,
      bio: profile?.bio ?? null,
      avatarUrl: profile?.avatarUrl ?? null,
      coverImageUrl: null,
      location: profile?.location ?? null,
      followersCount,
      followingCount,
      postsCount,
      isPrivate: user.isPrivate ?? false,
      isFollowing,
      isFollowedBy,
      createdAt: user.createdAt.toISOString(),
    };
  }

  // ─── Update own profile ───────────────────────────────────────
  async updateProfile(userId: string, data: UpdateProfileInput): Promise<UserPrivateProfile> {
    const user = await User.findByPk(userId);
    if (!user) throw AppError.notFound('User not found');

    if (data.isPrivate !== undefined) {
      await user.update({ isPrivate: data.isPrivate });
    }

    const profileData: Record<string, unknown> = {};
    if (data.displayName !== undefined) profileData['displayName'] = data.displayName;
    if (data.bio !== undefined) profileData['bio'] = data.bio;
    if (data.location !== undefined) profileData['location'] = data.location;
    if (data.avatarUrl !== undefined) profileData['avatarUrl'] = data.avatarUrl;

    if (Object.keys(profileData).length > 0) {
      await UserProfile.update(profileData, { where: { userId } });
    }

    return this.getMe(userId);
  }

  // ─── Update style preferences ─────────────────────────────────
  async updatePreferences(userId: string, data: UpdatePreferencesInput): Promise<void> {
    const [prefs] = await UserPreference.findOrCreate({
      where: { userId },
      defaults: { userId },
    });
    const updateData: Record<string, unknown> = {};
    if (data.styleCategories !== undefined) updateData['styleCategories'] = JSON.stringify(data.styleCategories);
    if (data.occasions !== undefined) updateData['occasions'] = JSON.stringify(data.occasions);
    if (data.colorPreferences !== undefined) updateData['colorPreferences'] = JSON.stringify(data.colorPreferences);
    if (data.fitPreferences !== undefined) updateData['fitPreferences'] = JSON.stringify(data.fitPreferences);
    if (data.budgetMin !== undefined) updateData['budgetMin'] = data.budgetMin;
    if (data.budgetMax !== undefined) updateData['budgetMax'] = data.budgetMax;
    if (data.currency !== undefined) updateData['currency'] = data.currency;
    if (data.city !== undefined) updateData['city'] = data.city;
    if (data.brands !== undefined) updateData['brands'] = JSON.stringify(data.brands);
    if (data.showBudgetOnProfile !== undefined) updateData['showBudgetOnProfile'] = data.showBudgetOnProfile;
    await prefs.update(updateData);
  }

  // ─── Follow a user ────────────────────────────────────────────
  async follow(followerId: string, targetUsername: string): Promise<void> {
    const target = await User.findOne({ where: { username: targetUsername.toLowerCase() } });
    if (!target) throw AppError.notFound(`User @${targetUsername} not found`);
    if (target.id === followerId) throw AppError.badRequest('Cannot follow yourself', 'VALIDATION_ERROR');
    if (target.isSuspended) throw AppError.notFound(`User @${targetUsername} not found`);

    const [, created] = await Follow.findOrCreate({
      where: { followerId, followingId: target.id },
      defaults: { followerId, followingId: target.id },
    });

    if (created) {
      await Promise.all([
        UserProfile.increment({ followingCount: 1 }, { where: { userId: followerId } }),
        UserProfile.increment({ followersCount: 1 }, { where: { userId: target.id } }),
      ]);
    }
  }

  // ─── Unfollow a user ──────────────────────────────────────────
  async unfollow(followerId: string, targetUsername: string): Promise<void> {
    const target = await User.findOne({ where: { username: targetUsername.toLowerCase() } });
    if (!target) throw AppError.notFound(`User @${targetUsername} not found`);

    const deleted = await Follow.destroy({ where: { followerId, followingId: target.id } });

    if (deleted > 0) {
      await Promise.all([
        UserProfile.decrement({ followingCount: 1 }, { where: { userId: followerId } }),
        UserProfile.decrement({ followersCount: 1 }, { where: { userId: target.id } }),
      ]);
    }
  }

  // ─── List followers ───────────────────────────────────────────
  async getFollowers(
    username: string,
    cursor?: string,
    limit = 20,
  ): Promise<Array<{ id: string; username: string; displayName: string; avatarUrl: string | null }>> {
    const user = await User.findOne({ where: { username: username.toLowerCase() } });
    if (!user) throw AppError.notFound(`User @${username} not found`);

    const follows = await Follow.findAll({
      where: {
        followingId: user.id,
        ...(cursor ? { createdAt: { [Op.lt]: new Date(cursor) } } : {}),
      },
      include: [
        {
          model: User,
          as: 'follower',
          attributes: ['id', 'username'],
          include: [{ model: UserProfile, as: 'profile', attributes: ['displayName', 'avatarUrl'] }],
        },
      ],
      order: [['createdAt', 'DESC']],
      limit: limit + 1,
    });

    return follows
      .map((f) => {
        const follower = (f as any).follower as (User & { profile?: UserProfile }) | undefined;
        if (!follower) return null;
        return {
          id: follower.id,
          username: follower.username,
          displayName: follower.profile?.displayName ?? follower.username,
          avatarUrl: follower.profile?.avatarUrl ?? null,
        };
      })
      .filter((u): u is NonNullable<typeof u> => Boolean(u))
      .slice(0, limit);
  }

  // ─── List following ───────────────────────────────────────────
  async getFollowing(
    username: string,
    cursor?: string,
    limit = 20,
  ): Promise<Array<{ id: string; username: string; displayName: string; avatarUrl: string | null }>> {
    const user = await User.findOne({ where: { username: username.toLowerCase() } });
    if (!user) throw AppError.notFound(`User @${username} not found`);

    const follows = await Follow.findAll({
      where: {
        followerId: user.id,
        ...(cursor ? { createdAt: { [Op.lt]: new Date(cursor) } } : {}),
      },
      include: [
        {
          model: User,
          as: 'following',
          attributes: ['id', 'username'],
          include: [{ model: UserProfile, as: 'profile', attributes: ['displayName', 'avatarUrl'] }],
        },
      ],
      order: [['createdAt', 'DESC']],
      limit: limit + 1,
    });

    return follows
      .map((f) => {
        const following = (f as any).following as (User & { profile?: UserProfile }) | undefined;
        if (!following) return null;
        return {
          id: following.id,
          username: following.username,
          displayName: following.profile?.displayName ?? following.username,
          avatarUrl: following.profile?.avatarUrl ?? null,
        };
      })
      .filter((u): u is NonNullable<typeof u> => Boolean(u))
      .slice(0, limit);
  }

  // ─── Search users ─────────────────────────────────────────────
  async search(
    query: string,
    limit = 20,
  ): Promise<Array<{ id: string; username: string; displayName: string; avatarUrl: string | null }>> {
    const userByUsername = await User.findAll({
      where: {
        username: { [Op.like]: `%${query.toLowerCase()}%` },
        isSuspended: false,
      },
      include: [{ model: UserProfile, as: 'profile', attributes: ['displayName', 'avatarUrl'] }],
      limit,
    });

    const profiles = await UserProfile.findAll({
      where: {
        displayName: { [Op.like]: `%${query}%` },
      },
      include: [
        {
          model: User,
          as: 'user',
          where: { isSuspended: false },
          attributes: ['id', 'username'],
        },
      ],
      limit,
    });

    const map = new Map<string, { id: string; username: string; displayName: string; avatarUrl: string | null }>();

    for (const u of userByUsername) {
      const prof = (u as any).profile as UserProfile | undefined;
      map.set(u.id, {
        id: u.id,
        username: u.username,
        displayName: prof?.displayName ?? u.username,
        avatarUrl: prof?.avatarUrl ?? null,
      });
    }

    for (const p of profiles) {
      const u = (p as any).user as User | undefined;
      if (u && !map.has(u.id)) {
        map.set(u.id, {
          id: u.id,
          username: u.username,
          displayName: p.displayName,
          avatarUrl: p.avatarUrl ?? null,
        });
      }
    }

    return Array.from(map.values()).slice(0, limit);
  }

  // ─── Update avatar URL (called after media upload) ────────────
  async updateAvatar(userId: string, avatarUrl: string): Promise<void> {
    await UserProfile.update({ avatarUrl }, { where: { userId } });
  }

  // ─── Complete onboarding ──────────────────────────────────────
  async completeOnboarding(userId: string): Promise<void> {
    await User.update({ isOnboarded: true }, { where: { id: userId } });
  }
}

export const usersService = new UsersService();
