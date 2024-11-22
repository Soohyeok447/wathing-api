import {
  Injectable,
  Inject,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { User, users } from '../data/schema';
import * as schema from '../data/schema';
import { eq, inArray, and } from 'drizzle-orm';
import { isDateString, isEmptyString } from '../utils/type_gurad';
import { UpdateUserDto } from './dtos/update_user.dto';
import { FilesService } from '../files/files.service';
import { User as UserEntity } from '../users/user.type';
import { followers } from '../data/schema/follower';
import { followRequests } from '../data/schema/follow_request';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class UsersService {
  constructor(
    private readonly filesService: FilesService,
    @Inject('DRIZZLE') private readonly db: NodePgDatabase<typeof schema>,
    private readonly notificationsService: NotificationsService,
  ) {}

  async findById(id: string): Promise<User | undefined> {
    const [result] = await this.db.select().from(users).where(eq(users.id, id));

    return result;
  }

  async findGraphQLUserById(id: string): Promise<UserEntity> {
    const user = await this.findById(id);

    if (!user) {
      throw new NotFoundException('유저를 찾을 수 없습니다.');
    }

    return user;
  }

  /**
   * 팔로우 요청을 보냅니다.
   */
  async sendFollowRequest(userId: string, targetId: string): Promise<void> {
    if (userId === targetId) {
      throw new BadRequestException('자기 자신을 팔로우할 수 없습니다.');
    }

    const targetUser = await this.findById(targetId);

    if (!targetUser) {
      throw new NotFoundException('팔로우할 유저를 찾을 수 없습니다.');
    }

    // 이미 팔로우 중인지 확인
    const [existingFollow] = await this.db
      .select()
      .from(followers)
      .where(
        and(
          eq(followers.followerId, userId),
          eq(followers.followingId, targetId),
        ),
      );

    if (existingFollow) {
      throw new BadRequestException('이미 팔로우 중입니다.');
    }

    // 이미 팔로우 요청이 있는지 확인
    const [existingRequest] = await this.db
      .select()
      .from(followRequests)
      .where(
        and(
          eq(followRequests.requesterId, userId),
          eq(followRequests.targetId, targetId),
        ),
      );

    if (existingRequest) {
      throw new BadRequestException('이미 팔로우 요청을 보냈습니다.');
    }

    await this.db.insert(followRequests).values({
      requesterId: userId,
      targetId,
    });

    // 상대방에게 알림 생성
    await this.notificationsService.createNotification(
      targetId,
      'follow_request',
      {
        requesterId: userId,
      },
    );
  }

  /**
   * 팔로우 요청 수락
   */
  async acceptFollowRequest(
    targetId: string,
    requesterId: string,
  ): Promise<void> {
    const [followRequest] = await this.db
      .select()
      .from(followRequests)
      .where(
        and(
          eq(followRequests.requesterId, requesterId),
          eq(followRequests.targetId, targetId),
        ),
      );

    if (!followRequest) {
      throw new BadRequestException('팔로우 요청이 존재하지 않습니다.');
    }

    await this.db.transaction(async (tx) => {
      await tx.insert(followers).values({
        followerId: requesterId,
        followingId: targetId,
      });

      await tx
        .delete(followRequests)
        .where(
          and(
            eq(followRequests.requesterId, requesterId),
            eq(followRequests.targetId, targetId),
          ),
        );
    });
  }

  /**
   * 팔로우 요청 거절
   */
  async rejectFollowRequest(
    targetId: string,
    requesterId: string,
  ): Promise<void> {
    const [followRequest] = await this.db
      .select()
      .from(followRequests)
      .where(
        and(
          eq(followRequests.requesterId, requesterId),
          eq(followRequests.targetId, targetId),
        ),
      );

    if (!followRequest) {
      throw new BadRequestException('팔로우 요청이 존재하지 않습니다.');
    }

    await this.db
      .delete(followRequests)
      .where(
        and(
          eq(followRequests.requesterId, requesterId),
          eq(followRequests.targetId, targetId),
        ),
      );
  }

  /**
   * 팔로우 요청 목록 가져오기
   * */
  async getPendingFollowRequests(targetId: string): Promise<User[]> {
    const requests = await this.db
      .select({ requesterId: followRequests.requesterId })
      .from(followRequests)
      .where(eq(followRequests.targetId, targetId));

    const requesterIds = requests.map((req) => req.requesterId);

    if (requesterIds.length === 0) {
      return [];
    }

    const usersList = await this.db
      .select()
      .from(users)
      .where(inArray(users.id, requesterIds));

    return usersList;
  }

  async unfollowUser(userId: string, unfollowingId: string): Promise<void> {
    if (userId === unfollowingId) {
      throw new BadRequestException('자기 자신을 언팔로우할 수 없습니다.');
    }

    const [existingFollow] = await this.db
      .select()
      .from(followers)
      .where(
        and(
          eq(followers.followerId, userId),
          eq(followers.followingId, unfollowingId),
        ),
      );

    if (!existingFollow) {
      throw new BadRequestException('팔로우 관계가 존재하지 않습니다.');
    }

    await this.db
      .delete(followers)
      .where(
        and(
          eq(followers.followerId, userId),
          eq(followers.followingId, unfollowingId),
        ),
      );
  }

  async getFollowersCount(userId: string): Promise<number> {
    return await this.db.$count(followers, eq(followers.followingId, userId));
  }

  async getFollowingCount(userId: string): Promise<number> {
    return await this.db.$count(followers, eq(followers.followerId, userId));
  }

  async getFollowers(userId: string): Promise<User[]> {
    const followerRelations = await this.db
      .select()
      .from(followers)
      .where(eq(followers.followingId, userId));

    const followerIds = followerRelations.map((rel) => rel.followerId);

    if (followerIds.length === 0) {
      return [];
    }

    const followersList = await this.db
      .select()
      .from(users)
      .where(inArray(users.id, followerIds));

    return followersList;
  }

  async getFollowing(userId: string): Promise<User[]> {
    const followingRelations = await this.db
      .select()
      .from(followers)
      .where(eq(followers.followerId, userId));

    const followingIds = followingRelations.map((rel) => rel.followingId);

    if (followingIds.length === 0) {
      return [];
    }

    const followingList = await this.db
      .select()
      .from(users)
      .where(inArray(users.id, followingIds));

    return followingList;
  }

  async updateUser(
    id: string,
    { name, birthday, statusMessage, profileImageId }: UpdateUserDto,
  ): Promise<User> {
    if (!id) {
      throw new BadRequestException('id가 없습니다.');
    }

    if ((name && isEmptyString(name)) || name.length < 2 || name.length > 12) {
      throw new BadRequestException(
        'name은 2자 이상 12자 이하의 문자열이어야 합니다.',
      );
    }

    if (statusMessage && statusMessage.length > 30) {
      throw new BadRequestException('statusMessage는 30자 이하이어야 합니다.');
    }

    if (birthday && !isDateString(birthday)) {
      throw new BadRequestException('birthday는 yyyy-mm-dd 형식이어야 합니다.');
    }

    const updateData: Partial<User> = {
      name,
      birthday,
      statusMessage,
      profileImageId,
      updatedAt: new Date(),
    };

    const [user] = await this.db
      .update(users)
      .set(updateData)
      .where(eq(users.id, id))
      .returning();

    return user;
  }

  async deleteUser(id: string): Promise<void> {
    const [user] = await this.db.select().from(users).where(eq(users.id, id));

    if (!user) {
      throw new NotFoundException('유저를 찾을 수 없습니다.');
    }

    if (user.profileImageId) {
      await this.filesService.deleteFile(user.profileImageId);
    }

    await this.db.delete(users).where(eq(users.id, id));
  }
}
