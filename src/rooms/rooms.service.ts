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
import { eq, inArray, and, sql } from 'drizzle-orm';
import { User } from '../users/user.type';
import { Room } from './room.type';
import { NotificationsService } from '../notifications/notifications.service';
import { UsersService } from '../users/users.service';

@Injectable()
export class RoomsService {
  constructor(
    @Inject('DRIZZLE') private readonly db: NodePgDatabase<typeof schema>,
    private readonly notificationsService: NotificationsService,
    private readonly usersService: UsersService,
  ) {}

  /**
   * 친구 간의 채팅방 생성
   */
  async createRoomBetweenFriends(
    userId1: string,
    userId2: string,
  ): Promise<Room> {
    if (userId1 === userId2) {
      throw new BadRequestException('자기 자신과의 채팅방을 만들 수 없습니다.');
    }

    // 두 유저가 친구인지 확인
    const areFriends = await this.usersService.checkIfFriends(userId1, userId2);
    if (!areFriends) {
      throw new BadRequestException(
        '친구가 아니면 채팅방을 생성할 수 없습니다.',
      );
    }

    // 이미 채팅방이 있으면 해당 채팅방을 반환
    const existingRoom = await this.getExistingRoom([userId1, userId2]);
    if (existingRoom) {
      return existingRoom;
    }

    const [newRoom] = await this.db.insert(rooms).values({}).returning();

    const roomUsersData = [userId1, userId2].map((userId) => ({
      roomId: newRoom.id,
      userId,
    }));

    await this.db.insert(roomUsers).values(roomUsersData);

    return newRoom;
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
