import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import { requireAuth, optionalAuthenticate } from '../../shared/middleware/authenticate';
import { collectionsService } from './collections.service';
import { respond } from '../../shared/helpers/response';
import { AppError } from '../../shared/errors/AppError';

export const collectionsRouter = Router();

// ─── List my collections ──────────────────────────────────────
collectionsRouter.get(
  '/me',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const collections = await collectionsService.getUserCollections(req.user!.id, req.user!.id);
      respond(res, 200, collections);
    } catch (err) {
      next(err);
    }
  },
);

// ─── List public collections of a user ────────────────────────
collectionsRouter.get(
  '/user/:userId',
  optionalAuthenticate,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const collections = await collectionsService.getUserCollections(
        req.params['userId']!,
        req.user?.id,
      );
      respond(res, 200, collections);
    } catch (err) {
      next(err);
    }
  },
);

// ─── Get single collection ────────────────────────────────────
collectionsRouter.get(
  '/:id',
  optionalAuthenticate,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await collectionsService.getCollectionById(req.params['id']!, req.user?.id);
      respond(res, 200, result);
    } catch (err) {
      next(err);
    }
  },
);

// ─── Create collection ────────────────────────────────────────
collectionsRouter.post(
  '/',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { name, description, coverImageUrl, isPublic } = req.body;
      if (!name || typeof name !== 'string' || !name.trim()) {
        throw AppError.badRequest('Collection name is required');
      }
      const collection = await collectionsService.createCollection(req.user!.id, {
        name: name.trim(),
        description,
        coverImageUrl,
        isPublic: Boolean(isPublic),
      });
      respond(res, 201, collection, 'Collection created');
    } catch (err) {
      next(err);
    }
  },
);

// ─── Update collection ────────────────────────────────────────
collectionsRouter.patch(
  '/:id',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const collection = await collectionsService.updateCollection(
        req.params['id']!,
        req.user!.id,
        req.body,
      );
      respond(res, 200, collection, 'Collection updated');
    } catch (err) {
      next(err);
    }
  },
);

// ─── Delete collection ────────────────────────────────────────
collectionsRouter.delete(
  '/:id',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await collectionsService.deleteCollection(req.params['id']!, req.user!.id);
      respond(res, 200, null, 'Collection deleted');
    } catch (err) {
      next(err);
    }
  },
);

// ─── Add outfit to collection ─────────────────────────────────
collectionsRouter.post(
  '/:id/outfits/:outfitId',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await collectionsService.addOutfitToCollection(
        req.params['id']!,
        req.params['outfitId']!,
        req.user!.id,
      );
      respond(res, 200, null, 'Outfit added to collection');
    } catch (err) {
      next(err);
    }
  },
);

// ─── Remove outfit from collection ────────────────────────────
collectionsRouter.delete(
  '/:id/outfits/:outfitId',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await collectionsService.removeOutfitFromCollection(
        req.params['id']!,
        req.params['outfitId']!,
        req.user!.id,
      );
      respond(res, 200, null, 'Outfit removed from collection');
    } catch (err) {
      next(err);
    }
  },
);
