// ============================================================
// Push Notification Service — Expo Push Notifications via FCM
// Sends real-time push to iOS/Android via Expo Push API
// ============================================================

import { Expo, type ExpoPushMessage, type ExpoPushTicket } from 'expo-server-sdk';
import { DeviceToken } from '../../database/models';
import { logger } from '../../config/logger';

const expo = new Expo(
  process.env['EXPO_ACCESS_TOKEN'] ? { accessToken: process.env['EXPO_ACCESS_TOKEN'] } : undefined,
);

export interface PushPayload {
  title: string;
  body: string;
  data?: Record<string, unknown>;
  badge?: number;
  sound?: 'default' | null;
  priority?: 'default' | 'normal' | 'high';
}

export class PushService {
  // ─── Send push to a specific user ─────────────────────────────
  async sendToUser(targetUserId: string, payload: PushPayload): Promise<void> {
    try {
      // Get all active device tokens for this user
      const tokens = await DeviceToken.findAll({
        where: { userId: targetUserId, isActive: true },
        attributes: ['token', 'expoToken'],
      });

      if (!tokens.length) return;

      const expoTokens = tokens
        .map((t) => t.expoToken || t.token)
        .filter((t) => Expo.isExpoPushToken(t));

      if (!expoTokens.length) return;

      await this.sendBatch(expoTokens, payload);
    } catch (err) {
      logger.error({ err, targetUserId }, 'Failed to send push notification');
    }
  }

  // ─── Send to multiple users ───────────────────────────────────
  async sendToUsers(targetUserIds: string[], payload: PushPayload): Promise<void> {
    if (!targetUserIds.length) return;

    try {
      const tokens = await DeviceToken.findAll({
        where: {
          userId: targetUserIds,
          isActive: true,
        },
        attributes: ['token', 'expoToken'],
      });

      const expoTokens = tokens
        .map((t) => t.expoToken || t.token)
        .filter((t) => Expo.isExpoPushToken(t));

      if (!expoTokens.length) return;

      await this.sendBatch(expoTokens, payload);
    } catch (err) {
      logger.error({ err }, 'Failed to send batch push notification');
    }
  }

  // ─── Core batch send ──────────────────────────────────────────
  private async sendBatch(tokens: string[], payload: PushPayload): Promise<void> {
    const messages: ExpoPushMessage[] = tokens.map((token) => {
      const msg: ExpoPushMessage = {
        to: token,
        title: payload.title,
        body: payload.body,
        data: payload.data ?? {},
        sound: payload.sound ?? 'default',
        priority: payload.priority ?? 'high',
      };
      if (payload.badge !== undefined) {
        msg.badge = payload.badge;
      }
      return msg;
    });

    const chunks = expo.chunkPushNotifications(messages);

    for (const chunk of chunks) {
      try {
        const tickets: ExpoPushTicket[] = await expo.sendPushNotificationsAsync(chunk);

        // Handle errors per ticket (invalid tokens)
        for (let i = 0; i < tickets.length; i++) {
          const ticket = tickets[i];
          if (ticket && ticket.status === 'error') {
            const msg = chunk[i];
            if (ticket.details?.error === 'DeviceNotRegistered' && msg) {
              // Deactivate this stale token
              await DeviceToken.update(
                { isActive: false },
                { where: { expoToken: msg.to } },
              ).catch(() => undefined);
            }
          }
        }
      } catch (err) {
        logger.error({ err }, 'Expo push chunk send failed');
      }
    }
  }

  // ─── Pre-built notification payloads ─────────────────────────
  static likePayload(actorUsername: string, postId: string): PushPayload {
    return {
      title: '♥ Someone loved your look',
      body: `@${actorUsername} liked your outfit`,
      data: { type: 'outfit_liked', postId },
      priority: 'normal',
    };
  }

  static commentPayload(actorUsername: string, postId: string, comment: string): PushPayload {
    return {
      title: '💬 New styling note',
      body: `@${actorUsername}: ${comment.slice(0, 80)}`,
      data: { type: 'outfit_commented', postId },
      priority: 'high',
    };
  }

  static followPayload(actorUsername: string): PushPayload {
    return {
      title: '✦ New Follower',
      body: `@${actorUsername} started following you`,
      data: { type: 'new_follower' },
      priority: 'normal',
    };
  }

  static spotlightPayload(postId: string): PushPayload {
    return {
      title: '🌟 Editorial Spotlight',
      body: 'Your look was featured in the Weekly Editorial Digest!',
      data: { type: 'spotlight', postId },
      priority: 'high',
    };
  }
}

export const pushService = new PushService();
