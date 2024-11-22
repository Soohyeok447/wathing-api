import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../data/schema';
import { rooms } from '../data/schema/room';
import { roomUsers } from '../data/schema/room_user';
import { eq, inArray, and, sql, or } from 'drizzle-orm';
import { User } from '../users/user.type';
import { Room } from './room.type';
import { chatRequests } from '../data/schema/chat_request';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class RoomsService {
  constructor(
    @Inject('DRIZZLE') private readonly db: NodePgDatabase<typeof schema>,
    private readonly notificationsService: NotificationsService,
  ) {}

  /**
   * 채팅 요청 보내기
   */
  async sendChatRequest(requesterId: string, targetId: string): Promise<void> {
    if (requesterId === targetId) {
      throw new BadRequestException(
        '자기 자신에게 채팅 요청을 보낼 수 없습니다.',
      );
    }

    const existingRoom = await this.getExistingRoom([requesterId, targetId]);

    if (existingRoom) {
      throw new BadRequestException('이미 채팅방이 존재합니다.');
    }

    const [existingRequest] = await this.db
      .select()
      .from(chatRequests)
      .where(
        and(
          eq(chatRequests.requesterId, requesterId),
          eq(chatRequests.targetId, targetId),
        ),
      );

    if (existingRequest) {
      throw new BadRequestException('이미 채팅 요청을 보냈습니다.');
    }

    // 이미 상대방이 나에게 채팅 요청을 보냈는지 확인
    const [existingRequestFromTarget] = await this.db
      .select()
      .from(chatRequests)
      .where(
        and(
          eq(chatRequests.requesterId, targetId),
          eq(chatRequests.targetId, requesterId),
        ),
      );

    // 이미 보냈다면 채팅방을 만들고 요청을 삭제
    if (existingRequestFromTarget) {
      await this.acceptChatRequest(requesterId, targetId);

      return;
    }

    await this.db.insert(chatRequests).values({
      requesterId,
      targetId,
    });

    // 상대방에게 알림을 보냄.
    await this.notificationsService.createNotification(
      targetId,
      'chat_request',
      {
        requesterId,
      },
    );
  }

  /**
   * 채팅 요청 수락
   */
  async acceptChatRequest(
    targetId: string,
    requesterId: string,
  ): Promise<boolean> {
    const [chatRequest] = await this.db
      .select()
      .from(chatRequests)
      .where(
        and(
          eq(chatRequests.requesterId, requesterId),
          eq(chatRequests.targetId, targetId),
        ),
      );

    if (!chatRequest) {
      throw new BadRequestException('채팅 요청이 존재하지 않습니다.');
    }

    const [newRoom] = await this.db.insert(rooms).values({}).returning();

    const roomUsersData = [requesterId, targetId].map((userId) => ({
      roomId: newRoom.id,
      userId,
    }));

    await this.db.transaction(async (tx) => {
      await tx.insert(roomUsers).values(roomUsersData);

      await tx
        .delete(chatRequests)
        .where(
          and(
            eq(chatRequests.requesterId, requesterId),
            eq(chatRequests.targetId, targetId),
          ),
        );
    });

    return true;
  }

  /**
   * 채팅 요청 거절
   */
  async rejectChatRequest(
    targetId: string,
    requesterId: string,
  ): Promise<void> {
    const [chatRequest] = await this.db
      .select()
      .from(chatRequests)
      .where(
        and(
          eq(chatRequests.requesterId, requesterId),
          eq(chatRequests.targetId, targetId),
        ),
      );

    if (!chatRequest) {
      throw new BadRequestException('채팅 요청이 존재하지 않습니다.');
    }

    await this.db
      .delete(chatRequests)
      .where(
        and(
          eq(chatRequests.requesterId, requesterId),
          eq(chatRequests.targetId, targetId),
        ),
      );
  }

  private async getExistingRoom(userIds: string[]): Promise<Room | null> {
    const [existingRoom] = await this.db
      .select({ roomId: roomUsers.roomId })
      .from(roomUsers)
      .where(inArray(roomUsers.userId, userIds))
      .groupBy(roomUsers.roomId)
      .having(sql`COUNT(*) = ${userIds.length}`);

    if (existingRoom) {
      const [room] = await this.db
        .select()
        .from(rooms)
        .where(eq(rooms.id, existingRoom.roomId));

      return room;
    }

    return null;
  }

  async leaveRoom(roomId: string, userId: string): Promise<boolean> {
    const isUserInRoom = await this.isUserInRoom(roomId, userId);

    if (!isUserInRoom) {
      throw new NotFoundException('사용자가 해당 채팅방에 존재하지 않습니다.');
    }

    // 트랜잭션 시작
    await this.db.transaction(async (tx) => {
      await tx
        .delete(roomUsers)
        .where(and(eq(roomUsers.roomId, roomId), eq(roomUsers.userId, userId)));

      const remainingUsers = await tx
        .select()
        .from(roomUsers)
        .where(eq(roomUsers.roomId, roomId));

      if (remainingUsers.length === 1) {
        await tx.delete(rooms).where(eq(rooms.id, roomId));
      }
    });

    return true;
  }

  async findById(roomId: string): Promise<Room> {
    const [room] = await this.db
      .select()
      .from(rooms)
      .where(eq(rooms.id, roomId));

    if (!room) {
      throw new NotFoundException('채팅방을 찾을 수 없습니다.');
    }

    return room;
  }

  /**
   * 현재 사용자에게 온 채팅 요청 목록 가져오기
   */
  async getPendingChatRequests(targetId: string): Promise<User[]> {
    const requests = await this.db
      .select({ requesterId: chatRequests.requesterId })
      .from(chatRequests)
      .where(eq(chatRequests.targetId, targetId));

    const requesterIds = requests.map((req) => req.requesterId);

    if (requesterIds.length === 0) {
      return [];
    }

    const usersList = await this.db
      .select()
      .from(schema.users)
      .where(inArray(schema.users.id, requesterIds));

    return usersList;
  }

  async getRoomsByUserId(userId: string): Promise<Room[]> {
    const roomIdsResult = await this.db
      .select({ roomId: roomUsers.roomId })
      .from(roomUsers)
      .where(eq(roomUsers.userId, userId));

    const roomIds = roomIdsResult.map((row) => row.roomId);

    const roomsResult = await this.db
      .select()
      .from(rooms)
      .where(inArray(rooms.id, roomIds));

    return roomsResult;
  }

  async getUsersInRoom(roomId: string): Promise<User[]> {
    const userIdsResult = await this.db
      .select({ userId: roomUsers.userId })
      .from(roomUsers)
      .where(eq(roomUsers.roomId, roomId));

    const userIds = userIdsResult.map((row) => row.userId);

    const usersResult = await this.db
      .select()
      .from(schema.users)
      .where(inArray(schema.users.id, userIds));

    return usersResult;
  }

  async isUserInRoom(roomId: string, userId: string): Promise<boolean> {
    const [result] = await this.db
      .select()
      .from(roomUsers)
      .where(and(eq(roomUsers.roomId, roomId), eq(roomUsers.userId, userId)));

    return result ? true : false;
  }
}
