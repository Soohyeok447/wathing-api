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
import { EmojiService } from '../emoji/emoji.service';
import { SendMessageDto } from './dtos/send_message.dto';

@Injectable()
export class MessagesService {
  constructor(
    @Inject('DRIZZLE') private readonly db: NodePgDatabase<typeof schema>,
    private readonly roomsService: RoomsService,
    private readonly usersService: UsersService,
    private readonly emojiService: EmojiService,
  ) {}

  async sendMessage(
    senderId: string,
    { roomId, content, type }: SendMessageDto,
  ): Promise<Message> {
    if (!roomId) {
      throw new BadRequestException('roomId는 필수입니다.');
    }

    const isSenderInRoom = await this.roomsService.isUserInRoom(
      roomId,
      senderId,
    );

    if (!isSenderInRoom) {
      throw new BadRequestException('채팅방에 sender가 속해있지 않습니다.');
    }

    switch (type) {
      case 'emoji':
        {
          const emojiRegex = /^\[emoji:(\d+)\]$/;
          const match = emojiRegex.exec(content);
          if (!match) {
            throw new BadRequestException(
              '이모지 content 형식이 올바르지 않습니다. 예: [emoji:5], [emoji:10], ...',
            );
          }

          const emojiId = parseInt(match[1], 10);

          const emojiCount = await this.emojiService.getEmojiCount();

          if (isNaN(emojiId) || emojiId < 1 || emojiId > emojiCount) {
            throw new BadRequestException(`잘못된 이모티콘 ID: ${emojiId}`);
          }

          const emojiExists = await this.emojiService.emojiExists(emojiId);

          if (!emojiExists) {
            throw new BadRequestException(
              `존재하지 않는 이모티콘 ID: ${emojiId}`,
            );
          }
        }
        break;

      case 'text':
        {
          if (content.length > 500) {
            throw new BadRequestException('메시지 내용이 너무 깁니다.');
          }
        }
        break;

      default:
        throw new BadRequestException(
          '메시지 type은 text 또는 emoji 여야 합니다.',
        );
    }

    const newMessageData = {
      roomId,
      senderId,
      content,
      type,
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
