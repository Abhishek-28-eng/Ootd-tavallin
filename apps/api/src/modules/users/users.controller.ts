import type { Request, Response, NextFunction } from 'express';
import { usersService } from './users.service';
import { mediaService, type UploadedFile } from '../media/media.service';
import type { UpdateProfileInput, UpdatePreferencesInput } from '@tavallin/shared';
import { respond } from '../../shared/helpers/response';
import { AppError } from '../../shared/errors/AppError';

export const getMe = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await usersService.getMe(req.user!.id);
    respond(res, 200, user);
  } catch (err) {
    next(err);
  }
};

export const getProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const profile = await usersService.getProfile(req.params['username']!, req.user?.id);
    respond(res, 200, profile);
  } catch (err) {
    next(err);
  }
};

export const updateProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await usersService.updateProfile(req.user!.id, req.body as UpdateProfileInput);
    respond(res, 200, user, 'Profile updated');
  } catch (err) {
    next(err);
  }
};

export const updatePreferences = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    await usersService.updatePreferences(req.user!.id, req.body as UpdatePreferencesInput);
    respond(res, 200, null, 'Preferences updated');
  } catch (err) {
    next(err);
  }
};

export const followUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    await usersService.follow(req.user!.id, req.params['username']!);
    respond(res, 200, null, `Now following @${req.params['username']}`);
  } catch (err) {
    next(err);
  }
};

export const unfollowUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    await usersService.unfollow(req.user!.id, req.params['username']!);
    respond(res, 200, null, `Unfollowed @${req.params['username']}`);
  } catch (err) {
    next(err);
  }
};

export const getFollowers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const users = await usersService.getFollowers(
      req.params['username']!,
      req.query['cursor'] as string | undefined,
      Number(req.query['limit']) || 20,
    );
    respond(res, 200, users);
  } catch (err) {
    next(err);
  }
};

export const getFollowing = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const users = await usersService.getFollowing(
      req.params['username']!,
      req.query['cursor'] as string | undefined,
      Number(req.query['limit']) || 20,
    );
    respond(res, 200, users);
  } catch (err) {
    next(err);
  }
};

export const searchUsers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const q = req.query['q'] as string;
    if (!q || q.trim().length < 1) throw AppError.badRequest('Query is required', 'VALIDATION_ERROR');
    const results = await usersService.search(q.trim(), Number(req.query['limit']) || 20);
    respond(res, 200, results);
  } catch (err) {
    next(err);
  }
};

export const completeOnboarding = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    await usersService.completeOnboarding(req.user!.id);
    respond(res, 200, null, 'Onboarding complete');
  } catch (err) {
    next(err);
  }
};

export const uploadAvatar = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const file = req.file;
    if (!file) throw AppError.badRequest('No image file uploaded');
    const uploadedFile: UploadedFile = {
      fieldname: file.fieldname,
      originalname: file.originalname,
      encoding: file.encoding,
      mimetype: file.mimetype,
      buffer: file.buffer,
      size: file.size,
    };
    const result = await mediaService.processAndStore(uploadedFile, req.user!.id, 'avatars');
    await usersService.updateAvatar(req.user!.id, result.publicUrl);
    respond(res, 200, { avatarUrl: result.publicUrl }, 'Profile photo updated successfully');
  } catch (err) {
    next(err);
  }
};

