import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { authController } from './auth.controller';
import { validate } from '../../shared/middleware/validate';
import { authenticate } from '../../shared/middleware/authenticate';
import { env } from '../../config/env';
import {
  RegisterSchema,
  LoginSchema,
  RefreshTokenSchema,
  ForgotPasswordSchema,
  ResetPasswordSchema,
  VerifyEmailSchema,
  ChangePasswordSchema,
} from '@tavallin/shared';
import { z } from 'zod';

export const authRouter = Router();

// Stricter rate limit for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: env.AUTH_RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMITED',
      message: 'Too many attempts. Please wait 15 minutes before trying again.',
    },
  },
});

// POST /api/v1/auth/register
authRouter.post(
  '/register',
  authLimiter,
  validate(RegisterSchema),
  authController.register,
);

// POST /api/v1/auth/login
authRouter.post(
  '/login',
  authLimiter,
  validate(LoginSchema),
  authController.login,
);

// POST /api/v1/auth/refresh
authRouter.post(
  '/refresh',
  validate(RefreshTokenSchema),
  authController.refresh,
);

// POST /api/v1/auth/logout
authRouter.post(
  '/logout',
  validate(RefreshTokenSchema),
  authController.logout,
);

// POST /api/v1/auth/verify-email
authRouter.post(
  '/verify-email',
  validate(VerifyEmailSchema),
  authController.verifyEmail,
);

// POST /api/v1/auth/forgot-password
authRouter.post(
  '/forgot-password',
  authLimiter,
  validate(ForgotPasswordSchema),
  authController.forgotPassword,
);

// POST /api/v1/auth/reset-password
authRouter.post(
  '/reset-password',
  authLimiter,
  validate(ResetPasswordSchema),
  authController.resetPassword,
);

// POST /api/v1/auth/change-password (authenticated)
authRouter.post(
  '/change-password',
  authenticate,
  validate(ChangePasswordSchema),
  authController.changePassword,
);

// DELETE /api/v1/auth/account (authenticated)
authRouter.delete(
  '/account',
  authenticate,
  validate(z.object({ password: z.string().min(1, 'Password is required') })),
  authController.deleteAccount,
);

// GET /api/v1/auth/me (authenticated)
authRouter.get('/me', authenticate, authController.me);
