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
import { eq, inArray, and } from 'drizzle-orm';
import { User } from '../users/user.type';
import { Room } from './room.type';

@Injectable()
export class RoomsService {
  constructor(
    @Inject('DRIZZLE') private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  async createRoom(userIds: string[]): Promise<Room> {
    if (userIds.length < 2) {
      throw new BadRequestException(
        '채팅방은 최소 2명 이상의 사용자로 구성되어야 합니다.',
      );
    }

    const [newRoom] = await this.db.insert(rooms).values({}).returning();

    const roomUsersData = userIds.map((userId) => ({
      roomId: newRoom.id,
      userId,
    }));

    await this.db.insert(roomUsers).values(roomUsersData);

    return newRoom;
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
