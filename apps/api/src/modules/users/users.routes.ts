import { Router } from 'express';
import { authenticate, requireAuth, optionalAuthenticate } from '../../shared/middleware/authenticate';
import { validate } from '../../shared/middleware/validate';
import { UpdateProfileSchema, UpdatePreferencesSchema } from '@tavallin/shared';
import * as ctrl from './users.controller';

export const usersRouter = Router();

import multer from 'multer';
import { AppError } from '../../shared/errors/AppError';

const uploadAvatar = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(AppError.badRequest('Only image files (JPEG, PNG, WebP) are allowed'));
    }
  },
});

// ─── Own profile ────────────────────────────────────────────────────────────
usersRouter.get('/me', requireAuth, ctrl.getMe);
usersRouter.patch('/me', requireAuth, validate(UpdateProfileSchema), ctrl.updateProfile);
usersRouter.post('/me/avatar', requireAuth, uploadAvatar.single('avatar'), ctrl.uploadAvatar);
usersRouter.patch('/me/preferences', requireAuth, validate(UpdatePreferencesSchema), ctrl.updatePreferences);
usersRouter.post('/me/onboard', requireAuth, ctrl.completeOnboarding);

// ─── Search ─────────────────────────────────────────────────────────────────
usersRouter.get('/search', optionalAuthenticate, ctrl.searchUsers);

// ─── Public profile & social ────────────────────────────────────────────────
usersRouter.get('/:username', optionalAuthenticate, ctrl.getProfile);
usersRouter.get('/:username/followers', optionalAuthenticate, ctrl.getFollowers);
usersRouter.get('/:username/following', optionalAuthenticate, ctrl.getFollowing);
usersRouter.post('/:username/follow', requireAuth, ctrl.followUser);
usersRouter.delete('/:username/follow', requireAuth, ctrl.unfollowUser);
