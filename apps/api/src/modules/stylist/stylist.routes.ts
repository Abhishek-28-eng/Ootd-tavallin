import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import { Op } from 'sequelize';
import { optionalAuthenticate, requireAuth } from '../../shared/middleware/authenticate';
import { OutfitPost, OutfitMedia, User, UserPreference, StyleCategoryModel } from '../../database/models';
import { respond } from '../../shared/helpers/response';

export const stylistRouter = Router();

// ─── Stylist Daily Recommendations ────────────────────────────
stylistRouter.get(
  '/recommendations',
  optionalAuthenticate,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const occasion = req.query['occasion'] as string | undefined;
      const weather = req.query['weather'] as string | undefined; // e.g., 'sunny', 'rainy', 'cold'

      let preferredStyles: string[] = [];

      if (req.user) {
        const prefs = await UserPreference.findOne({ where: { userId: req.user.id } });
        if (prefs) {
          try {
            preferredStyles = (prefs.styleCategories as unknown as string[]) || [];
          } catch {
            // fallback
          }
        }
      }

      const where: Record<string, unknown> = {
        status: 'published',
        deletedAt: null,
      };

      if (occasion) {
        where['occasions'] = { [Op.like]: `%${occasion}%` };
      }

      const outfits = await OutfitPost.findAll({
        where,
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
        limit: 10,
      });

      // Style tip generation
      const styleTips = [
        'Balance oversized silhouettes with fitted bottoms for an effortless contemporary look.',
        'Neutral tone-on-tone (cream, oatmeal, warm grey) elevates everyday casuals into quiet luxury.',
        'Add a structured accessory to ground relaxed or fluid textures.',
        'Minimalist silver or muted gold jewelry provides an understated Korean chic accent.',
      ];

      const selectedTip = styleTips[Math.floor(Math.random() * styleTips.length)];

      respond(res, 200, {
        dailyTip: selectedTip,
        weatherContext: weather || 'optimal',
        occasion: occasion || 'everyday_chic',
        preferredStyles,
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

// ─── Color Harmony Matrix ─────────────────────────────────────
stylistRouter.get(
  '/color-harmonies',
  async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const harmonies = [
        {
          name: 'Seoul Minimalist Monochrome',
          palette: ['#1A1A1A', '#4A4A4A', '#E8E8E6', '#FFFFFF'],
          mood: 'Clean, architectural, modern',
          bestFor: ['Streetwear', 'Casual', 'Office Minimal'],
        },
        {
          name: 'Earthy Warmth (Autumn Chic)',
          palette: ['#3D2B1F', '#8C6239', '#D4B499', '#F4EDE4'],
          mood: 'Cozy, organic, refined',
          bestFor: ['Vintage', 'Smart Casual', 'Weekend'],
        },
        {
          name: 'Pastel Sorbet',
          palette: ['#C8D6AF', '#F5D5CB', '#E5E9F0', '#FFFFFF'],
          mood: 'Soft, youthful, playful',
          bestFor: ['Korean Feminine', 'Spring Summer', 'Brunch'],
        },
        {
          name: 'Midnight Navy & Cream',
          palette: ['#0B1B3D', '#2A4365', '#CBD5E0', '#FAF9F6'],
          mood: 'Sophisticated, classic, timeless',
          bestFor: ['Formal', 'Dinner', 'Business Casual'],
        },
      ];
      respond(res, 200, harmonies);
    } catch (err) {
      next(err);
    }
  },
);
