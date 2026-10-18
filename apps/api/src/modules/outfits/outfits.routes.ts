import { Router } from 'express';
import multer from 'multer';
import { authenticate, requireAuth, optionalAuthenticate } from '../../shared/middleware/authenticate';
import { validate } from '../../shared/middleware/validate';
import { CreateOutfitSchema, FeedQuerySchema, ExploreQuerySchema } from '@tavallin/shared';
import type { Request, Response, NextFunction } from 'express';
import { outfitsService } from './outfits.service';
import { respond } from '../../shared/helpers/response';
import type { UploadedFile } from '../media/media.service';

export const outfitsRouter = Router();

// Multer — memory storage, 10 images max, 10MB each
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024, files: 10 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
    cb(null, allowed.includes(file.mimetype.toLowerCase()));
  },
});

// ─── Create post ─────────────────────────────────────────────────────────────
outfitsRouter.post(
  '/',
  requireAuth,
  upload.array('media', 10),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const files = ((req.files as Express.Multer.File[]) ?? []).map((f) => ({
        fieldname: f.fieldname,
        originalname: f.originalname,
        encoding: f.encoding,
        mimetype: f.mimetype,
        buffer: f.buffer,
        size: f.size,
      })) as UploadedFile[];

      const body = { ...req.body };

      // Normalize multipart array fields
      if (typeof body.styleCategories === 'string') {
        try {
          const parsed = JSON.parse(body.styleCategories);
          body.styleCategories = Array.isArray(parsed) ? parsed : [parsed];
        } catch {
          body.styleCategories = [body.styleCategories];
        }
      }
      if (typeof body.occasions === 'string') {
        try {
          const parsed = JSON.parse(body.occasions);
          body.occasions = Array.isArray(parsed) ? parsed : [parsed];
        } catch {
          body.occasions = [body.occasions];
        }
      }
      if (typeof body.tags === 'string') {
        try {
          const parsed = JSON.parse(body.tags);
          body.tags = Array.isArray(parsed) ? parsed : [parsed];
        } catch {
          body.tags = [body.tags];
        }
      }
      if (typeof body.budgetMin === 'string' && body.budgetMin.trim() !== '') {
        body.budgetMin = Number(body.budgetMin);
      }
      if (typeof body.budgetMax === 'string' && body.budgetMax.trim() !== '') {
        body.budgetMax = Number(body.budgetMax);
      }

      if (!files.length && (!body.mediaKeys || !body.mediaKeys.length)) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'At least one photo is required',
          },
        });
        return;
      }

      const parsed = CreateOutfitSchema.safeParse(body);
      if (!parsed.success) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Validation failed',
            details: parsed.error.errors,
          },
        });
        return;
      }

      const post = await outfitsService.createPost(req.user!.id, parsed.data, files);
      respond(res, 201, post, 'Outfit posted!');
    } catch (err) {
      next(err);
    }
  },
);

// ─── Feed ────────────────────────────────────────────────────────────────────
outfitsRouter.get('/feed', requireAuth, validate(FeedQuerySchema, 'query'), async (req, res, next) => {
  try {
    const { type, cursor, limit } = req.query as { type?: 'personalized' | 'following' | 'trending' | 'latest'; cursor?: string; limit?: string };
    const numLimit = Number(limit) || 20;
    const posts = await outfitsService.getFeed(req.user!.id, type ?? 'personalized', cursor, numLimit + 1);
    const hasMore = posts.length > numLimit;
    const resultPosts = hasMore ? posts.slice(0, numLimit) : posts;
    const nextCursor = resultPosts.length ? resultPosts[resultPosts.length - 1]!.createdAt : null;
    respond(res, 200, {
      posts: resultPosts,
      meta: {
        hasMore,
        cursor: hasMore ? nextCursor : null,
      },
    });
  } catch (err) {
    next(err);
  }
});

// ─── Explore ─────────────────────────────────────────────────────────────────
outfitsRouter.get('/explore', optionalAuthenticate, validate(ExploreQuerySchema, 'query'), async (req, res, next) => {
  try {
    const { style, occasion, budgetMin, budgetMax, tag, cursor, limit } = req.query as Record<string, string>;
    const numLimit = Number(limit) || 20;
    const filters: {
      style?: string;
      occasion?: string;
      budgetMin?: number;
      budgetMax?: number;
      tag?: string;
    } = {};
    if (style) filters.style = style;
    if (occasion) filters.occasion = occasion;
    if (budgetMin) filters.budgetMin = Number(budgetMin);
    if (budgetMax) filters.budgetMax = Number(budgetMax);
    if (tag) filters.tag = tag;

    const posts = await outfitsService.getExploreFeed(
      filters,
      cursor,
      numLimit + 1,
      req.user?.id,
    );
    const hasMore = posts.length > numLimit;
    const resultPosts = hasMore ? posts.slice(0, numLimit) : posts;
    const nextCursor = resultPosts.length ? resultPosts[resultPosts.length - 1]!.createdAt : null;
    respond(res, 200, {
      posts: resultPosts,
      meta: {
        hasMore,
        cursor: hasMore ? nextCursor : null,
      },
    });
  } catch (err) {
    next(err);
  }
});

// ─── Single post ──────────────────────────────────────────────────────────────
outfitsRouter.get('/:id', optionalAuthenticate, async (req, res, next) => {
  try {
    const post = await outfitsService.getPostById(req.params['id']!, req.user?.id);
    respond(res, 200, post);
  } catch (err) {
    next(err);
  }
});

// ─── Delete post ──────────────────────────────────────────────────────────────
outfitsRouter.delete('/:id', requireAuth, async (req, res, next) => {
  try {
    await outfitsService.deletePost(req.params['id']!, req.user!.id);
    respond(res, 200, null, 'Post deleted');
  } catch (err) {
    next(err);
  }
});

// ─── Like toggle ──────────────────────────────────────────────────────────────
outfitsRouter.post('/:id/like', requireAuth, async (req, res, next) => {
  try {
    const result = await outfitsService.toggleLike(req.user!.id, req.params['id']!);
    respond(res, 200, result);
  } catch (err) {
    next(err);
  }
});

// ─── Save toggle ──────────────────────────────────────────────────────────────
outfitsRouter.post('/:id/save', requireAuth, async (req, res, next) => {
  try {
    const { collectionId } = req.body as { collectionId?: string };
    const result = await outfitsService.toggleSave(req.user!.id, req.params['id']!, collectionId);
    respond(res, 200, result);
  } catch (err) {
    next(err);
  }
});

// ─── User posts grid ──────────────────────────────────────────────────────────
outfitsRouter.get('/user/:username', optionalAuthenticate, async (req, res, next) => {
  try {
    const numLimit = Number(req.query['limit']) || 20;
    const posts = await outfitsService.getUserPosts(
      req.params['username']!,
      req.query['cursor'] as string | undefined,
      numLimit + 1,
      req.user?.id,
    );
    const hasMore = posts.length > numLimit;
    const resultPosts = hasMore ? posts.slice(0, numLimit) : posts;
    const nextCursor = resultPosts.length ? resultPosts[resultPosts.length - 1]!.createdAt : null;
    respond(res, 200, {
      posts: resultPosts,
      meta: {
        hasMore,
        cursor: hasMore ? nextCursor : null,
      },
    });
  } catch (err) {
    next(err);
  }
});
