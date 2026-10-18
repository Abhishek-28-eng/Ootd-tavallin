import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import { requireAuth, optionalAuthenticate } from '../../shared/middleware/authenticate';
import { validate } from '../../shared/middleware/validate';
import { CreateCommentSchema } from '@tavallin/shared';
import { commentsService } from './comments.service';
import { respond } from '../../shared/helpers/response';

export const commentsRouter = Router();

// ─── Get comments for outfit ──────────────────────────────────
commentsRouter.get(
  '/outfit/:outfitId',
  optionalAuthenticate,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { outfitId } = req.params;
      const cursor = req.query['cursor'] as string | undefined;
      const limit = Number(req.query['limit']) || 20;

      const result = await commentsService.getComments(outfitId!, req.user?.id, cursor, limit);
      respond(res, 200, result);
    } catch (err) {
      next(err);
    }
  },
);

// ─── Create comment on outfit ─────────────────────────────────
commentsRouter.post(
  '/outfit/:outfitId',
  requireAuth,
  validate(CreateCommentSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { outfitId } = req.params;
      const comment = await commentsService.createComment(req.user!.id, outfitId!, req.body);
      respond(res, 201, comment, 'Comment added');
    } catch (err) {
      next(err);
    }
  },
);

// ─── Delete comment ───────────────────────────────────────────
commentsRouter.delete(
  '/:id',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const isAdmin = req.user?.role === 'admin' || req.user?.role === 'super_admin';
      await commentsService.deleteComment(req.params['id']!, req.user!.id, isAdmin);
      respond(res, 200, null, 'Comment deleted');
    } catch (err) {
      next(err);
    }
  },
);
