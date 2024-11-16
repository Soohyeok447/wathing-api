import { Injectable } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../data/schema';
import { messages } from '../data/schema/message';
import { eq, desc } from 'drizzle-orm';
import { Message } from './message.type';

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
  ): Promise<Message[]> {
    const messagesResult = await this.db
      .select()
      .from(messages)
      .where(eq(messages.roomId, roomId))
      .orderBy(desc(messages.createdAt))
      .limit(limit)
      .offset(offset);

    return messagesResult;
  }
}
