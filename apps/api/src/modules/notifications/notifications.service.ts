// ============================================================
// Notifications Service
// ============================================================
import { Op } from 'sequelize';
import { Notification, User, UserProfile, DeviceToken } from '../../database/models';
import { AppError } from '../../shared/errors/AppError';
import type { DeviceTokenRequest } from '@tavallin/shared';

export interface NotificationDTO {
  id: string;
  type: string;
  title: string;
  body: string;
  isRead: boolean;
  actorId: string | null;
  actorUsername: string | null;
  actorAvatarUrl: string | null;
  targetId: string | null;
  targetType: string | null;
  deepLink: string | null;
  createdAt: string;
}

export class NotificationsService {
  async getNotifications(
    userId: string,
    cursor?: string,
    limit = 20,
  ): Promise<{ notifications: NotificationDTO[]; unreadCount: number; meta: { hasMore: boolean; cursor: string | null } }> {
    const where: Record<string, unknown> = {
      userId,
      ...(cursor ? { createdAt: { [Op.lt]: new Date(cursor) } } : {}),
    };

    const [items, unreadCount] = await Promise.all([
      Notification.findAll({
        where,
        include: [
          {
            model: User,
            as: 'actor',
            attributes: ['id', 'username'],
            include: [
              {
                model: UserProfile,
                as: 'profile',
                attributes: ['displayName', 'avatarUrl'],
              },
            ],
          },
        ],
        order: [['createdAt', 'DESC']],
        limit: limit + 1,
      }),
      Notification.count({
        where: { userId, isRead: false },
      }),
    ]);

    const hasMore = items.length > limit;
    const notificationsList = hasMore ? items.slice(0, limit) : items;
    const nextCursor = notificationsList.length
      ? notificationsList[notificationsList.length - 1]!.createdAt.toISOString()
      : null;

    const formatted: NotificationDTO[] = notificationsList.map((n) => {
      const actor = n.get('actor') as (User & { profile?: UserProfile }) | null;
      return {
        id: n.id,
        type: n.type,
        title: n.title,
        body: n.body,
        isRead: n.isRead,
        actorId: n.actorId,
        actorUsername: actor?.username || null,
        actorAvatarUrl: actor?.profile?.avatarUrl || null,
        targetId: n.targetId,
        targetType: n.targetType,
        deepLink: n.deepLink,
        createdAt: n.createdAt.toISOString(),
      };
    });

    return {
      notifications: formatted,
      unreadCount,
      meta: {
        hasMore,
        cursor: hasMore ? nextCursor : null,
      },
    };
  }

  async markAsRead(notificationId: string, userId: string): Promise<void> {
    const notification = await Notification.findOne({ where: { id: notificationId, userId } });
    if (!notification) throw AppError.notFound('Notification not found');

    await notification.update({ isRead: true, readAt: new Date() });
  }

  async markAllAsRead(userId: string): Promise<void> {
    await Notification.update(
      { isRead: true, readAt: new Date() },
      { where: { userId, isRead: false } },
    );
  }

  async registerDeviceToken(userId: string, data: DeviceTokenRequest): Promise<void> {
    const [token, created] = await DeviceToken.findOrCreate({
      where: { token: data.token },
      defaults: {
        userId,
        token: data.token,
        platform: data.platform,
        expoToken: data.expoToken || null,
        isActive: true,
        lastUsedAt: new Date(),
      },
    });

    if (!created) {
      await token.update({
        userId,
        isActive: true,
        platform: data.platform,
        expoToken: data.expoToken || token.expoToken,
        lastUsedAt: new Date(),
      });
    }
  }
}

export const notificationsService = new NotificationsService();
