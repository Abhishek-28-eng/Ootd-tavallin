import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import { requireAuth } from '../../shared/middleware/authenticate';
import { validate } from '../../shared/middleware/validate';
import { CreateReportSchema } from '@tavallin/shared';
import { ContentReport, OutfitPost, User, Comment } from '../../database/models';
import { respond } from '../../shared/helpers/response';
import { AppError } from '../../shared/errors/AppError';

export const reportsRouter = Router();

// ─── Submit a content report ──────────────────────────────────
reportsRouter.post(
  '/',
  requireAuth,
  validate(CreateReportSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { targetType, targetId, category, description } = req.body;

      // Verify target existence
      if (targetType === 'outfit') {
        const post = await OutfitPost.findByPk(targetId);
        if (!post) throw AppError.notFound('Target outfit post not found');
      } else if (targetType === 'user') {
        const user = await User.findByPk(targetId);
        if (!user) throw AppError.notFound('Target user not found');
      } else if (targetType === 'comment') {
        const comment = await Comment.findByPk(targetId);
        if (!comment) throw AppError.notFound('Target comment not found');
      }

      // Check if user has already reported this target
      const existing = await ContentReport.findOne({
        where: {
          reporterId: req.user!.id,
          targetType,
          targetId,
          status: 'pending',
        },
      });

      if (existing) {
        respond(res, 200, { reportId: existing.id }, 'Report has already been received and is under review.');
        return;
      }

      const report = await ContentReport.create({
        reporterId: req.user!.id,
        targetType,
        targetId,
        category,
        description: description || null,
        status: 'pending',
      });

      respond(res, 201, { reportId: report.id }, 'Report submitted. Thank you for keeping our community safe.');
    } catch (err) {
      next(err);
    }
  },
);

// ─── Get my reports ───────────────────────────────────────────
reportsRouter.get(
  '/mine',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const reports = await ContentReport.findAll({
        where: { reporterId: req.user!.id },
        order: [['createdAt', 'DESC']],
        limit: 50,
      });
      respond(res, 200, reports);
    } catch (err) {
      next(err);
    }
  },
);
