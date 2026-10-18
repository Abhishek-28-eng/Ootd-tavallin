import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import { Op } from 'sequelize';
import { optionalAuthenticate } from '../../shared/middleware/authenticate';
import { OutfitPost, OutfitMedia, User, Tag, StyleCategoryModel } from '../../database/models';
import { respond } from '../../shared/helpers/response';
import { AppError } from '../../shared/errors/AppError';

export const searchRouter = Router();

// ─── Universal Search ─────────────────────────────────────────
searchRouter.get(
  '/',
  optionalAuthenticate,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const q = ((req.query['q'] as string) || '').trim();
      const limit = Number(req.query['limit']) || 10;

      if (!q) {
        throw AppError.badRequest('Search query "q" is required');
      }

      const [users, tags, outfits] = await Promise.all([
        // Search users
        User.findAll({
          where: {
            isSuspended: false,
            [Op.or]: [
              { username: { [Op.like]: `%${q.toLowerCase()}%` } },
              { email: { [Op.like]: `%${q.toLowerCase()}%` } },
            ],
          },
          attributes: ['id', 'username', 'createdAt'],
          limit,
        }),

        // Search tags
        Tag.findAll({
          where: {
            isActive: true,
            slug: { [Op.like]: `%${q.toLowerCase().replace(/\s+/g, '_')}%` },
          },
          attributes: ['id', 'name', 'slug', 'postsCount'],
          order: [['postsCount', 'DESC']],
          limit,
        }),

        // Search outfits
        OutfitPost.findAll({
          where: {
            status: 'published',
            deletedAt: null,
            [Op.or]: [
              { caption: { [Op.like]: `%${q}%` } },
              { styleCategories: { [Op.like]: `%${q}%` } },
              { occasions: { [Op.like]: `%${q}%` } },
            ],
          },
          include: [
            { model: User, as: 'author', attributes: ['id', 'username'] },
            {
              model: OutfitMedia,
              as: 'media',
              attributes: ['publicUrl', 'thumbnailUrl', 'orderIndex'],
              separate: true,
              order: [['orderIndex', 'ASC']],
              limit: 1,
            },
          ],
          order: [['likesCount', 'DESC'], ['createdAt', 'DESC']],
          limit,
        }),
      ]);

      respond(res, 200, {
        query: q,
        users,
        tags,
        outfits: outfits.map((post) => {
          const author = post.get('author') as User;
          const media = (post.get('media') as OutfitMedia[]) || [];
          return {
            id: post.id,
            caption: post.caption,
            author: { id: author?.id, username: author?.username },
            thumbnailUrl: media[0]?.thumbnailUrl || media[0]?.publicUrl || null,
            likesCount: post.likesCount,
            styleCategories: post.styleCategories
              ? JSON.parse(post.styleCategories as string)
              : [],
          };
        }),
      });
    } catch (err) {
      next(err);
    }
  },
);

// ─── Trending Tags ────────────────────────────────────────────
searchRouter.get(
  '/trending-tags',
  async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const tags = await Tag.findAll({
        where: { isActive: true },
        order: [['postsCount', 'DESC']],
        limit: 20,
      });
      respond(res, 200, tags);
    } catch (err) {
      next(err);
    }
  },
);

// ─── Style Categories (Taxonomy) ──────────────────────────────
searchRouter.get(
  '/categories',
  async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const categories = await StyleCategoryModel.findAll({
        where: { isActive: true },
        order: [['postsCount', 'DESC']],
      });
      respond(res, 200, categories);
    } catch (err) {
      next(err);
    }
  },
);
