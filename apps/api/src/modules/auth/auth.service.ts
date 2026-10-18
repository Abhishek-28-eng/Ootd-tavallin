import argon2 from 'argon2';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { Op } from 'sequelize';
import { sequelize } from '../../config/database';
import { env } from '../../config/env';
import { AppError } from '../../shared/errors/AppError';
import {
  User,
  UserProfile,
  UserPreference,
  RefreshToken,
  PasswordResetToken,
  EmailVerificationToken,
} from '../../database/models';
import { emailService } from '../email/email.service';
import type {
  RegisterInput,
  LoginInput,
  LoginResponse,
  RegisterResponse,
  AuthTokens,
  JwtPayload,
} from '@tavallin/shared';
import { ErrorCodes } from '@tavallin/shared';

// ─────────────────────────────────────────────────────────────────────────────
// Token generation helpers
// ─────────────────────────────────────────────────────────────────────────────

function generateAccessToken(user: User, profile: UserProfile): string {
  const payload: Omit<JwtPayload, 'iat' | 'exp'> = {
    sub: user.id,
    email: user.email,
    username: user.username,
    role: user.role,
  };
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN,
    jwtid: uuidv4(),
  } as jwt.SignOptions);
}

async function generateRefreshToken(
  userId: string,
  ipAddress?: string,
  deviceInfo?: string,
): Promise<{ token: string; record: RefreshToken }> {
  const token = crypto.randomBytes(48).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

  const record = await RefreshToken.create({
    userId,
    tokenHash,
    expiresAt,
    ipAddress: ipAddress ?? null,
    deviceInfo: deviceInfo ?? null,
  });

  return { token, record };
}

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function getExpirySeconds(expiresIn: string): number {
  // Parse "15m", "7d", etc.
  const match = /^(\d+)([smhd])$/.exec(expiresIn);
  if (!match) return 900;
  const [, num, unit] = match;
  const n = parseInt(num!, 10);
  const multipliers: Record<string, number> = { s: 1, m: 60, h: 3600, d: 86400 };
  return n * (multipliers[unit!] ?? 1);
}

// ─────────────────────────────────────────────────────────────────────────────
// AuthService
// ─────────────────────────────────────────────────────────────────────────────

export const authService = {
  async register(
    input: RegisterInput,
    ipAddress?: string,
  ): Promise<RegisterResponse> {
    // Check duplicates
    const existingEmail = await User.findOne({ where: { email: input.email } });
    if (existingEmail) {
      throw AppError.conflict('An account with this email already exists', ErrorCodes.EMAIL_ALREADY_EXISTS);
    }

    const existingUsername = await User.findOne({ where: { username: input.username } });
    if (existingUsername) {
      throw AppError.conflict('This username is already taken', ErrorCodes.USERNAME_ALREADY_EXISTS);
    }

    const passwordHash = await argon2.hash(input.password, {
      type: argon2.argon2id,
      memoryCost: 65536,
      timeCost: 3,
      parallelism: 4,
    });

    const transaction = await sequelize.transaction();
    try {
      const user = await User.create(
        {
          email: input.email,
          username: input.username.toLowerCase(),
          passwordHash,
          role: 'user',
          isEmailVerified: !env.FEATURE_EMAIL_VERIFICATION,
        },
        { transaction },
      );

      await UserProfile.create(
        { userId: user.id, displayName: input.displayName },
        { transaction },
      );

      await UserPreference.create({ userId: user.id }, { transaction });

      // Generate email verification token if needed
      if (env.FEATURE_EMAIL_VERIFICATION) {
        const verifyToken = crypto.randomBytes(32).toString('hex');
        const tokenHash = hashToken(verifyToken);
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + env.EMAIL_VERIFY_TOKEN_EXPIRES_HOURS);

        await EmailVerificationToken.create(
          { userId: user.id, tokenHash, expiresAt },
          { transaction },
        );

        await transaction.commit();

        // Send async — don't block registration on email delivery
        void emailService.sendVerificationEmail(user.email, input.displayName, verifyToken);
      } else {
        await transaction.commit();
      }

      const profile = await UserProfile.findOne({ where: { userId: user.id } });
      const accessToken = generateAccessToken(user, profile!);
      const { token: refreshToken } = await generateRefreshToken(user.id, ipAddress);

      return {
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          displayName: input.displayName,
          avatarUrl: null,
          role: user.role,
          isEmailVerified: user.isEmailVerified,
          isOnboarded: false,
          createdAt: user.createdAt.toISOString(),
        },
        tokens: {
          accessToken,
          refreshToken,
          expiresIn: getExpirySeconds(env.JWT_ACCESS_EXPIRES_IN),
        },
        message: env.FEATURE_EMAIL_VERIFICATION
          ? 'Registration successful. Please check your email to verify your account.'
          : 'Registration successful.',
      };
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  },

  async login(input: LoginInput, ipAddress?: string): Promise<LoginResponse> {
    const user = await User.findOne({
      where: { email: input.email },
      include: [{ model: UserProfile, as: 'profile' }],
    });

    if (!user) {
      // Constant-time response to prevent enumeration
      await argon2.hash('dummy', { type: argon2.argon2id });
      throw AppError.unauthorized('Invalid email or password', ErrorCodes.INVALID_CREDENTIALS);
    }

    const valid = await argon2.verify(user.passwordHash, input.password);
    if (!valid) {
      throw AppError.unauthorized('Invalid email or password', ErrorCodes.INVALID_CREDENTIALS);
    }

    if (user.isSuspended) {
      throw AppError.forbidden('Your account has been suspended', ErrorCodes.ACCOUNT_SUSPENDED);
    }

    if (user.deletedAt) {
      throw AppError.unauthorized('Account not found', ErrorCodes.INVALID_CREDENTIALS);
    }

    // Update last active
    void user.update({ lastActiveAt: new Date() });

    const profile = user.profile ?? (await UserProfile.findOne({ where: { userId: user.id } }));
    const accessToken = generateAccessToken(user, profile!);
    const { token: refreshToken } = await generateRefreshToken(user.id, ipAddress);

    return {
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        displayName: profile?.displayName ?? user.username,
        avatarUrl: profile?.avatarUrl ?? null,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
        isOnboarded: user.isOnboarded,
        createdAt: user.createdAt.toISOString(),
      },
      tokens: {
        accessToken,
        refreshToken,
        expiresIn: getExpirySeconds(env.JWT_ACCESS_EXPIRES_IN),
      },
    };
  },

  async refresh(refreshTokenValue: string, ipAddress?: string): Promise<AuthTokens> {
    const tokenHash = hashToken(refreshTokenValue);

    const tokenRecord = await RefreshToken.findOne({
      where: {
        tokenHash,
        isRevoked: false,
        expiresAt: { [Op.gt]: new Date() },
      },
    });

    if (!tokenRecord) {
      throw AppError.unauthorized('Invalid or expired refresh token', ErrorCodes.TOKEN_INVALID);
    }

    const user = await User.findByPk(tokenRecord.userId, {
      include: [{ model: UserProfile, as: 'profile' }],
    });

    if (!user || user.isSuspended || user.deletedAt) {
      await tokenRecord.update({ isRevoked: true, revokedAt: new Date() });
      throw AppError.unauthorized('Account unavailable', ErrorCodes.UNAUTHORIZED);
    }

    // Rotate: revoke old token, issue new one
    const transaction = await sequelize.transaction();
    try {
      await tokenRecord.update({ isRevoked: true, revokedAt: new Date() }, { transaction });
      const { token: newRefreshToken } = await generateRefreshToken(user.id, ipAddress);

      const profile = user.profile ?? (await UserProfile.findOne({ where: { userId: user.id } }));
      const accessToken = generateAccessToken(user, profile!);

      await transaction.commit();
      return {
        accessToken,
        refreshToken: newRefreshToken,
        expiresIn: getExpirySeconds(env.JWT_ACCESS_EXPIRES_IN),
      };
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  },

  async logout(refreshTokenValue: string): Promise<void> {
    const tokenHash = hashToken(refreshTokenValue);
    await RefreshToken.update(
      { isRevoked: true, revokedAt: new Date() },
      { where: { tokenHash } },
    );
  },

  async logoutAll(userId: string): Promise<void> {
    await RefreshToken.update(
      { isRevoked: true, revokedAt: new Date() },
      { where: { userId, isRevoked: false } },
    );
  },

  async verifyEmail(token: string): Promise<void> {
    const tokenHash = hashToken(token);
    const tokenRecord = await EmailVerificationToken.findOne({
      where: {
        tokenHash,
        usedAt: null,
        expiresAt: { [Op.gt]: new Date() },
      },
    });

    if (!tokenRecord) {
      throw AppError.badRequest(
        'Invalid or expired verification token.',
        ErrorCodes.TOKEN_INVALID,
      );
    }

    const transaction = await sequelize.transaction();
    try {
      await User.update(
        { isEmailVerified: true },
        { where: { id: tokenRecord.userId }, transaction },
      );
      await tokenRecord.update({ usedAt: new Date() }, { transaction });
      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  },

  async forgotPassword(email: string): Promise<void> {
    const user = await User.findOne({ where: { email } });
    if (!user) {
      // Don't reveal whether email exists
      return;
    }

    // Invalidate existing tokens
    await PasswordResetToken.update(
      { usedAt: new Date() },
      { where: { userId: user.id, usedAt: null } },
    );

    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = hashToken(token);
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + env.PASSWORD_RESET_TOKEN_EXPIRES_MIN);

    await PasswordResetToken.create({ userId: user.id, tokenHash, expiresAt });

    const profile = await UserProfile.findOne({ where: { userId: user.id } });
    void emailService.sendPasswordResetEmail(user.email, profile?.displayName ?? user.username, token);
  },

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const tokenHash = hashToken(token);
    const tokenRecord = await PasswordResetToken.findOne({
      where: {
        tokenHash,
        usedAt: null,
        expiresAt: { [Op.gt]: new Date() },
      },
    });

    if (!tokenRecord) {
      throw AppError.badRequest(
        'Invalid or expired password reset token.',
        ErrorCodes.TOKEN_INVALID,
      );
    }

    const passwordHash = await argon2.hash(newPassword, {
      type: argon2.argon2id,
      memoryCost: 65536,
      timeCost: 3,
      parallelism: 4,
    });

    const transaction = await sequelize.transaction();
    try {
      await User.update(
        { passwordHash },
        { where: { id: tokenRecord.userId }, transaction },
      );
      // Mark token as used
      await tokenRecord.update({ usedAt: new Date() }, { transaction });
      // Revoke all refresh tokens (security: all sessions)
      await RefreshToken.update(
        { isRevoked: true, revokedAt: new Date() },
        { where: { userId: tokenRecord.userId, isRevoked: false }, transaction },
      );
      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  },

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    const user = await User.findByPk(userId);
    if (!user) throw AppError.notFound();

    const valid = await argon2.verify(user.passwordHash, currentPassword);
    if (!valid) {
      throw AppError.badRequest('Current password is incorrect', ErrorCodes.INVALID_CREDENTIALS);
    }

    const passwordHash = await argon2.hash(newPassword, {
      type: argon2.argon2id,
      memoryCost: 65536,
      timeCost: 3,
      parallelism: 4,
    });

    await user.update({ passwordHash });
    // Optionally revoke all refresh tokens
    await RefreshToken.update(
      { isRevoked: true, revokedAt: new Date() },
      { where: { userId, isRevoked: false } },
    );
  },

  async deleteAccount(userId: string, password: string): Promise<void> {
    const user = await User.findByPk(userId);
    if (!user) throw AppError.notFound();

    const valid = await argon2.verify(user.passwordHash, password);
    if (!valid) {
      throw AppError.badRequest('Password is incorrect', ErrorCodes.INVALID_CREDENTIALS);
    }

    const transaction = await sequelize.transaction();
    try {
      // Soft delete user and revoke all tokens
      await user.update(
        {
          deletedAt: new Date(),
          email: `deleted_${user.id}@deleted.tavallin.com`,
          username: `deleted_${user.id}`,
        },
        { transaction },
      );
      await RefreshToken.update(
        { isRevoked: true, revokedAt: new Date() },
        { where: { userId }, transaction },
      );
      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  },
};
