import { Injectable } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../data/schema';
import { messages } from '../data/schema/message';
import { eq, desc } from 'drizzle-orm';
import { Message } from './types/message.type';
import { MessageConnection } from './types/message_connection.type';

@Injectable()
export class MessagesService {
  constructor(
    @Inject('DRIZZLE') private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  async sendMessage(
    roomId: string,
    senderId: string,
    content: string,
  ): Promise<Message> {
    const [newMessage] = await this.db
      .insert(messages)
      .values({ roomId, senderId, content })
      .returning();

    return newMessage;
  }

  async getMessagesByRoomId(
    roomId: string,
    limit = 20,
    offset = 0,
  ): Promise<MessageConnection> {
    const messagesResult = await this.db
      .select()
      .from(messages)
      .where(eq(messages.roomId, roomId))
      .orderBy(desc(messages.createdAt))
      .limit(limit)
      .offset(offset);

    const hasNextPage = messagesResult.length > limit;
    const edges = hasNextPage ? messagesResult.slice(0, -1) : messagesResult;

    const nextOffset = hasNextPage ? offset + limit : null;

    return {
      edges,
      hasNextPage,
      nextOffset,
    };
  }
}
