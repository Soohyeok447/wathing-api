import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../data/schema';
import { eq, desc } from 'drizzle-orm';
import { Notification, notifications } from '../data/schema';
import { pubSub } from '../core/config/pubsub';

@Injectable()
export class NotificationsService {
  constructor(
    @Inject('DRIZZLE') private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  async createNotification(
    userId: string,
    type: string,
    data: object,
  ): Promise<void> {
    if (
      type !== 'new_post' &&
      type !== 'chat_request' &&
      type !== 'follow_request' &&
      type !== 'message'
    ) {
      throw new BadRequestException('지원하지 않는 알림 타입입니다.');
    }

    const [notification] = await this.db
      .insert(notifications)
      .values({
        userId,
        type,
        data: JSON.stringify(data),
      })
      .returning();

    pubSub.publish('onNotifications', { notification });
  }

  async getNotifications(userId: string): Promise<any[]> {
    const results = await this.db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt));

    return results;
  }

  async markAsRead(notificationId: string): Promise<void> {
    const [notification] = await this.db
      .select()
      .from(notifications)
      .where(eq(notifications.id, notificationId));

    if (notification.read) return;

    const updateData: Partial<Notification> = {
      read: true,
    };

    await this.db
      .update(notifications)
      .set(updateData)
      .where(eq(notifications.id, notificationId));
  }
}
