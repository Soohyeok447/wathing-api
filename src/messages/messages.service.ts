import { BadRequestException, Injectable } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../data/schema';
import { messages } from '../data/schema/message';
import { eq, desc } from 'drizzle-orm';
import { Message } from './types/message.type';
import { MessageConnection } from './types/message_connection.type';
import { RoomsService } from '../rooms/rooms.service';
import { EmojiService } from '../emoji/emoji.service';
import { SendMessageDto } from './dtos/send_message.dto';

@Injectable()
export class MessagesService {
  constructor(
    @Inject('DRIZZLE') private readonly db: NodePgDatabase<typeof schema>,
    private readonly roomsService: RoomsService,
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

    const newMessageData: {
      roomId: string;
      senderId: string;
      content: string;
      type: string;
    } = {
      roomId,
      senderId,
      content: '',
      type,
    };

    switch (type) {
      case 'emoji':
        {
          const emojiFile = await this.emojiService.getEmojiById(content);

          if (!emojiFile) {
            throw new BadRequestException(`존재하지 않는 이모티콘 입니다.`);
          }

          newMessageData.content = JSON.stringify({
            id: emojiFile.id,
            key: emojiFile.key,
          });
        }
        break;

      case 'text':
        {
          if (content.length > 500) {
            throw new BadRequestException('메시지 내용이 너무 깁니다.');
          }

          newMessageData.content = content;
        }
        break;

      default:
        throw new BadRequestException(
          '메시지 type은 text 또는 emoji 여야 합니다.',
        );
    }

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
