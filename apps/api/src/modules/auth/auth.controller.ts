import type { Request, Response, NextFunction } from 'express';
import { authService } from './auth.service';
import { sendSuccess } from '../../shared/helpers/response';
import type {
  RegisterInput,
  LoginInput,
  RefreshTokenInput,
  ForgotPasswordInput,
  ResetPasswordInput,
  VerifyEmailInput,
  ChangePasswordInput,
} from '@tavallin/shared';

export const authController = {
  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const ip = req.ip ?? req.socket.remoteAddress;
      const result = await authService.register(req.body as RegisterInput, ip);
      sendSuccess(res, result, { statusCode: 201, message: result.message });
    } catch (err) {
      next(err);
    }
  },

  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const ip = req.ip ?? req.socket.remoteAddress;
      const result = await authService.login(req.body as LoginInput, ip);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  },

  async refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const ip = req.ip ?? req.socket.remoteAddress;
      const { refreshToken } = req.body as RefreshTokenInput;
      const tokens = await authService.refresh(refreshToken, ip);
      sendSuccess(res, { tokens });
    } catch (err) {
      next(err);
    }
  },

  async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { refreshToken } = req.body as RefreshTokenInput;
      await authService.logout(refreshToken);
      sendSuccess(res, null, { message: 'Logged out successfully.' });
    } catch (err) {
      next(err);
    }
  },

  async verifyEmail(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { token } = req.body as VerifyEmailInput;
      await authService.verifyEmail(token);
      sendSuccess(res, null, { message: 'Email verified successfully.' });
    } catch (err) {
      next(err);
    }
  },

  async forgotPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email } = req.body as ForgotPasswordInput;
      await authService.forgotPassword(email);
      // Always return success to prevent email enumeration
      sendSuccess(res, null, {
        message: 'If an account with that email exists, a password reset link has been sent.',
      });
    } catch (err) {
      next(err);
    }
  },

  async resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { token, password } = req.body as ResetPasswordInput;
      await authService.resetPassword(token, password);
      sendSuccess(res, null, { message: 'Password reset successfully. Please log in.' });
    } catch (err) {
      next(err);
    }
  },

  async changePassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.sub;
      const { currentPassword, newPassword } = req.body as ChangePasswordInput;
      await authService.changePassword(userId, currentPassword, newPassword);
      sendSuccess(res, null, { message: 'Password changed successfully.' });
    } catch (err) {
      next(err);
    }
  },

  async deleteAccount(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.sub;
      const { password } = req.body as { password: string };
      await authService.deleteAccount(userId, password);
      sendSuccess(res, null, { message: 'Account deleted successfully.' });
    } catch (err) {
      next(err);
    }
  },

  async me(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { UserProfile, User } = await import('../../database/models');
      const user = await User.findByPk(req.user!.sub, {
        include: [{ model: UserProfile, as: 'profile' }],
      });
      if (!user) {
        res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'User not found.' } });
        return;
      }
      sendSuccess(res, {
        id: user.id,
        email: user.email,
        username: user.username,
        displayName: user.profile?.displayName ?? user.username,
        avatarUrl: user.profile?.avatarUrl ?? null,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
        isOnboarded: user.isOnboarded,
        createdAt: user.createdAt.toISOString(),
      });
    } catch (err) {
      next(err);
    }
  },
};
