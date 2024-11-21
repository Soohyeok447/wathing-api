import { BadRequestException, Injectable } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../data/schema';
import { messages } from '../data/schema/message';
import { eq, desc } from 'drizzle-orm';
import { Message } from './types/message.type';
import { MessageConnection } from './types/message_connection.type';
import { RoomsService } from '../rooms/rooms.service';
import { UsersService } from '../users/users.service';

@Injectable()
export class MessagesService {
  constructor(
    @Inject('DRIZZLE') private readonly db: NodePgDatabase<typeof schema>,
    private readonly roomsService: RoomsService,
    private readonly usersService: UsersService,
  ) {}

  async sendMessage(
    roomId: string,
    senderId: string,
    receiverId: string,
    content: string,
  ): Promise<Message> {
    if (!roomId || !receiverId) {
      throw new BadRequestException('roomId와 receiverId는 필수입니다.');
    }

    const receiver = await this.usersService.findById(receiverId);

    if (!receiver) {
      throw new BadRequestException('수신자가 존재하지 않습니다.');
    }

    const isSenderInRoom = await this.roomsService.isUserInRoom(
      roomId,
      senderId,
    );
    const isReceiverInRoom = await this.roomsService.isUserInRoom(
      roomId,
      receiverId,
    );

    if (!isSenderInRoom || !isReceiverInRoom) {
      throw new BadRequestException(
        '채팅방에 sender 또는 receiver가 속해있지 않습니다.',
      );
    }

    const newMessageData = {
      roomId,
      senderId,
      receiverId,
      content,
    };

    const [newMessage] = await this.db
      .insert(messages)
      .values(newMessageData)
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
