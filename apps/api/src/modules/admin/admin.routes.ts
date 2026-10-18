import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import { Op } from 'sequelize';
import { requireAuth, requireAdmin, requireModerator } from '../../shared/middleware/authenticate';
import {
  User,
  UserProfile,
  OutfitPost,
  OutfitMedia,
  ContentReport,
  ModerationAction,
  StyleCategoryModel,
  Tag,
  Comment,
  AuditLog,
} from '../../database/models';
import { respond } from '../../shared/helpers/response';
import { AppError } from '../../shared/errors/AppError';

export const adminRouter = Router();

// Apply admin authentication to all admin routes
adminRouter.use(requireAuth, requireModerator);

// ─── 1. Dashboard Overview Stats ──────────────────────────────
adminRouter.get(
  '/stats',
  async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

      const [
        totalUsers,
        newUsersThisWeek,
        totalOutfits,
        pendingReports,
        totalComments,
        suspendedUsers,
      ] = await Promise.all([
        User.count(),
        User.count({ where: { createdAt: { [Op.gte]: sevenDaysAgo } } }),
        OutfitPost.count({ where: { deletedAt: null } }),
        ContentReport.count({ where: { status: 'pending' } }),
        Comment.count({ where: { deletedAt: null } }),
        User.count({ where: { isSuspended: true } }),
      ]);

      // Category breakdown
      const categories = await StyleCategoryModel.findAll({
        attributes: ['name', 'slug', 'postsCount'],
        order: [['postsCount', 'DESC']],
        limit: 8,
      });

      respond(res, 200, {
        totalUsers,
        newUsersThisWeek,
        totalOutfits,
        pendingReports,
        totalComments,
        suspendedUsers,
        topCategories: categories,
      });
    } catch (err) {
      next(err);
    }
  },
);

// ─── 2. User Management ───────────────────────────────────────
adminRouter.get(
  '/users',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const page = Math.max(1, Number(req.query['page']) || 1);
      const limit = Math.min(100, Math.max(1, Number(req.query['limit']) || 20));
      const search = (req.query['search'] as string) || '';
      const role = req.query['role'] as string;
      const status = req.query['status'] as string; // 'suspended' | 'active'

      const where: Record<string | symbol, unknown> = {};

      if (search) {
        where[Op.or] = [
          { username: { [Op.like]: `%${search.toLowerCase()}%` } },
          { email: { [Op.like]: `%${search.toLowerCase()}%` } },
        ];
      }

      if (role) {
        where['role'] = role;
      }

      if (status === 'suspended') {
        where['isSuspended'] = true;
      } else if (status === 'active') {
        where['isSuspended'] = false;
      }

      const { count, rows } = await User.findAndCountAll({
        where,
        attributes: [
          'id',
          'email',
          'username',
          'role',
          'isEmailVerified',
          'isOnboarded',
          'isSuspended',
          'suspendedAt',
          'suspensionReason',
          'createdAt',
        ],
        include: [
          {
            model: UserProfile,
            as: 'profile',
            attributes: ['displayName', 'avatarUrl', 'followersCount', 'followingCount', 'postsCount'],
          },
        ],
        order: [['createdAt', 'DESC']],
        limit,
        offset: (page - 1) * limit,
      });

      respond(res, 200, {
        users: rows,
        pagination: {
          total: count,
          page,
          limit,
          totalPages: Math.ceil(count / limit),
        },
      });
    } catch (err) {
      next(err);
    }
  },
);

// ─── 3. Suspend / Unsuspend User ──────────────────────────────
adminRouter.patch(
  '/users/:id/suspend',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const { suspend, reason } = req.body;

      const user = await User.findByPk(id);
      if (!user) throw AppError.notFound('User not found');

      if (user.role === 'super_admin') {
        throw AppError.forbidden('Cannot modify status of a super admin');
      }

      const isSuspended = Boolean(suspend);
      await user.update({
        isSuspended,
        suspendedAt: isSuspended ? new Date() : null,
        suspensionReason: isSuspended ? reason || 'Violated community guidelines' : null,
      });

      await AuditLog.create({
        actorId: req.user!.id,
        action: isSuspended ? 'USER_SUSPEND' : 'USER_UNSUSPEND',
        targetType: 'user',
        targetId: user.id,
        description: `User @${user.username} was ${isSuspended ? 'suspended' : 'unsuspended'}. Reason: ${reason || 'N/A'}`,
      });

      respond(
        res,
        200,
        { id: user.id, isSuspended },
        `User @${user.username} has been ${isSuspended ? 'suspended' : 'reactivated'}.`,
      );
    } catch (err) {
      next(err);
    }
  },
);

// ─── 4. Change User Role (Admin only) ─────────────────────────
adminRouter.patch(
  '/users/:id/role',
  requireAdmin,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const { role } = req.body;

      const allowedRoles = ['user', 'moderator', 'admin'];
      if (!allowedRoles.includes(role)) {
        throw AppError.badRequest(`Invalid role. Allowed: ${allowedRoles.join(', ')}`);
      }

      const user = await User.findByPk(id);
      if (!user) throw AppError.notFound('User not found');
      if (user.role === 'super_admin') {
        throw AppError.forbidden('Cannot change role of a super admin');
      }

      await user.update({ role });

      await AuditLog.create({
        actorId: req.user!.id,
        action: 'USER_ROLE_CHANGE',
        targetType: 'user',
        targetId: user.id,
        description: `Changed role of @${user.username} to ${role}`,
      });

      respond(res, 200, { id: user.id, role }, `Role updated to ${role}`);
    } catch (err) {
      next(err);
    }
  },
);

// ─── 5. Moderation Posts List ─────────────────────────────────
adminRouter.get(
  '/outfits',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const page = Math.max(1, Number(req.query['page']) || 1);
      const limit = Math.min(100, Math.max(1, Number(req.query['limit']) || 20));
      const status = req.query['status'] as string; // 'published' | 'removed' | 'under_review'

      const where: Record<string, unknown> = {};
      if (status) {
        where['status'] = status;
      }

      const { count, rows } = await OutfitPost.findAndCountAll({
        where,
        include: [
          { model: User, as: 'author', attributes: ['id', 'username', 'email'] },
          {
            model: OutfitMedia,
            as: 'media',
            attributes: ['publicUrl', 'thumbnailUrl', 'orderIndex'],
            separate: true,
            order: [['orderIndex', 'ASC']],
          },
        ],
        order: [['createdAt', 'DESC']],
        limit,
        offset: (page - 1) * limit,
      });

      respond(res, 200, {
        outfits: rows,
        pagination: {
          total: count,
          page,
          limit,
          totalPages: Math.ceil(count / limit),
        },
      });
    } catch (err) {
      next(err);
    }
  },
);

// ─── 6. Update Post Status (Remove / Restore) ─────────────────
adminRouter.patch(
  '/outfits/:id/status',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const { status, note } = req.body;

      const allowedStatuses = ['published', 'removed', 'under_review'];
      if (!allowedStatuses.includes(status)) {
        throw AppError.badRequest('Invalid status');
      }

      const post = await OutfitPost.findByPk(id);
      if (!post) throw AppError.notFound('Outfit post not found');

      await post.update({
        status,
        deletedAt: status === 'removed' ? new Date() : null,
      });

      await ModerationAction.create({
        moderatorId: req.user!.id,
        targetType: 'outfit',
        targetId: post.id,
        action: `SET_STATUS_${status.toUpperCase()}`,
        note: note || null,
      });

      respond(res, 200, { id: post.id, status }, `Post status changed to ${status}`);
    } catch (err) {
      next(err);
    }
  },
);

// ─── 7. Content Reports Queue ─────────────────────────────────
adminRouter.get(
  '/reports',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const page = Math.max(1, Number(req.query['page']) || 1);
      const limit = Math.min(100, Math.max(1, Number(req.query['limit']) || 20));
      const status = req.query['status'] as string; // 'pending' | 'resolved' | 'dismissed'

      const where: Record<string, unknown> = {};
      if (status) {
        where['status'] = status;
      }

      const { count, rows } = await ContentReport.findAndCountAll({
        where,
        include: [
          { model: User, as: 'reporter', attributes: ['id', 'username'] },
        ],
        order: [['createdAt', 'DESC']],
        limit,
        offset: (page - 1) * limit,
      });

      respond(res, 200, {
        reports: rows,
        pagination: {
          total: count,
          page,
          limit,
          totalPages: Math.ceil(count / limit),
        },
      });
    } catch (err) {
      next(err);
    }
  },
);

// ─── 8. Resolve / Dismiss Report ──────────────────────────────
adminRouter.patch(
  '/reports/:id/resolve',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const { status, moderationNote } = req.body;

      if (!['resolved', 'dismissed'].includes(status)) {
        throw AppError.badRequest('Status must be "resolved" or "dismissed"');
      }

      const report = await ContentReport.findByPk(id);
      if (!report) throw AppError.notFound('Report not found');

      await report.update({
        status,
        resolvedById: req.user!.id,
        moderationNote: moderationNote || null,
        resolvedAt: new Date(),
      });

      respond(res, 200, report, `Report marked as ${status}`);
    } catch (err) {
      next(err);
    }
  },
);

// ─── 9. Taxonomy Management (Categories & Tags) ───────────────
adminRouter.get(
  '/taxonomy',
  async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const [categories, tags] = await Promise.all([
        StyleCategoryModel.findAll({ order: [['postsCount', 'DESC']] }),
        Tag.findAll({ order: [['postsCount', 'DESC']], limit: 50 }),
      ]);
      respond(res, 200, { categories, tags });
    } catch (err) {
      next(err);
    }
  },
);

adminRouter.post(
  '/taxonomy/category',
  requireAdmin,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { name, slug, description, emoji } = req.body;
      if (!name || !slug) {
        throw AppError.badRequest('name and slug are required');
      }

      const category = await StyleCategoryModel.create({
        name,
        slug: slug.toLowerCase().replace(/\s+/g, '_'),
        description: description || null,
        emoji: emoji || null,
        isActive: true,
      });

      respond(res, 201, category, 'Category created');
    } catch (err) {
      next(err);
    }
  },
);

adminRouter.patch(
  '/taxonomy/category/:id',
  requireAdmin,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const category = await StyleCategoryModel.findByPk(req.params['id']);
      if (!category) throw AppError.notFound('Category not found');

      await category.update(req.body);
      respond(res, 200, category, 'Category updated');
    } catch (err) {
      next(err);
    }
  },
);
