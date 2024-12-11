import {
  Injectable,
  Inject,
  BadRequestException,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import {
  credentials,
  subscriptions,
  User,
  userBlocks,
  users,
} from '../data/schema';
import * as schema from '../data/schema';
import { eq, inArray, and, or, like } from 'drizzle-orm';
import { isDateString, isEmail, isEmptyString } from '../utils/type_gurad';
import { UpdateUserDto } from './dtos/update_user.dto';
import { FilesService } from '../files/files.service';
import { User as UserEntity } from '../users/user.type';
import { friends } from '../data/schema/friend';
import { friendRequests } from '../data/schema/friend_request';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class UsersService {
  constructor(
    private readonly filesService: FilesService,
    @Inject('DRIZZLE') private readonly db: NodePgDatabase<typeof schema>,
    private readonly notificationsService: NotificationsService,
  ) {}

  /**
   * 특정 사용자가 차단한 사용자 ID 목록을 가져옵니다.
   * @param userId 사용자 ID
   */
  async getBlockedUserIds(userId: string): Promise<string[]> {
    const blocks = await this.db
      .select()
      .from(userBlocks)
      .where(eq(userBlocks.blockedBy, userId));

    return blocks.map((block) => block.blockedUserId);
  }

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
   * 친구 요청을 보냅니다.
   */
  async sendFriendRequest(userId: string, targetId: string): Promise<void> {
    if (userId === targetId) {
      throw new BadRequestException(
        '자기 자신에게 친구 요청을 보낼 수 없습니다.',
      );
    }

    const targetUser = await this.findById(targetId);

    if (!targetUser) {
      throw new NotFoundException('친구 요청할 유저를 찾을 수 없습니다.');
    }

    // 이미 친구인지 확인
    const isAlreadyFriend = await this.checkIfFriends(userId, targetId);

    if (isAlreadyFriend) {
      throw new BadRequestException('이미 친구입니다.');
    }

    // 이미 친구 요청이 있는지 확인
    const [existingRequest] = await this.db
      .select()
      .from(friendRequests)
      .where(
        or(
          and(
            eq(friendRequests.requesterId, userId),
            eq(friendRequests.targetId, targetId),
          ),
          and(
            eq(friendRequests.requesterId, targetId),
            eq(friendRequests.targetId, userId),
          ),
        ),
      );

    if (existingRequest) {
      // 상대방이 나에게 친구 요청을 보냈다면, 친구 관계를 맺음
      if (existingRequest.requesterId === targetId) {
        await this.acceptFriendRequest(userId, targetId);

        return;
      }

      throw new BadRequestException('이미 친구 요청을 보냈습니다.');
    }

    // 친구 요청 생성
    await this.db.insert(friendRequests).values({
      requesterId: userId,
      targetId,
    });

    // 상대방에게 알림 생성
    const requester = await this.findById(userId);
    const credential = await this.findCredentialById(targetId);

    await this.notificationsService.createNotification(
      targetId,
      'friend_request',
      {
        requesterId: userId,
        message: `${requester.name}님이 친구 요청을 보냈습니다.`,
      },
    );

    if (credential && credential.deviceToken) {
      await this.notificationsService.sendPushNotification(
        credential.deviceToken,
        `새 친구 요청`,
        `${requester.name}님이 친구 요청을 보냈습니다.`,
        {
          requesterId: userId,
          message: `${requester.name}님이 친구 요청을 보냈습니다.`,
        },
      );
    }
  }

  /**
   * 친구 요청 수락
   */
  async acceptFriendRequest(
    userId: string,
    requesterId: string,
  ): Promise<void> {
    const [friendRequest] = await this.db
      .select()
      .from(friendRequests)
      .where(
        and(
          eq(friendRequests.requesterId, requesterId),
          eq(friendRequests.targetId, userId),
        ),
      );

    if (!friendRequest) {
      throw new BadRequestException('친구 요청이 존재하지 않습니다.');
    }

    await this.db.transaction(async (tx) => {
      await tx.insert(friends).values({
        userId1: userId,
        userId2: requesterId,
      });

      await tx
        .delete(friendRequests)
        .where(
          and(
            eq(friendRequests.requesterId, requesterId),
            eq(friendRequests.targetId, userId),
          ),
        );
    });
  }

  /**
   * 친구 요청 거절
   */
  async rejectFriendRequest(
    userId: string,
    requesterId: string,
  ): Promise<void> {
    const [friendRequest] = await this.db
      .select()
      .from(friendRequests)
      .where(
        and(
          eq(friendRequests.requesterId, requesterId),
          eq(friendRequests.targetId, userId),
        ),
      );

    if (!friendRequest) {
      throw new BadRequestException('친구 요청이 존재하지 않습니다.');
    }

    await this.db
      .delete(friendRequests)
      .where(
        and(
          eq(friendRequests.requesterId, requesterId),
          eq(friendRequests.targetId, userId),
        ),
      );
  }

  /**
   * 친구 삭제 (친구 끊기)
   */
  async unfriendUser(userId: string, targetId: string): Promise<void> {
    const [existingFriend] = await this.db
      .select()
      .from(friends)
      .where(
        or(
          and(eq(friends.userId1, userId), eq(friends.userId2, targetId)),
          and(eq(friends.userId1, targetId), eq(friends.userId2, userId)),
        ),
      );

    if (!existingFriend) {
      throw new BadRequestException('친구 관계가 존재하지 않습니다.');
    }

    await this.db
      .delete(friends)
      .where(
        or(
          and(eq(friends.userId1, userId), eq(friends.userId2, targetId)),
          and(eq(friends.userId1, targetId), eq(friends.userId2, userId)),
        ),
      );
  }

  /**
   * 두 유저가 친구인지 확인
   */
  async checkIfFriends(userId1: string, userId2: string): Promise<boolean> {
    const [existingFriend] = await this.db
      .select()
      .from(friends)
      .where(
        or(
          and(eq(friends.userId1, userId1), eq(friends.userId2, userId2)),
          and(eq(friends.userId1, userId2), eq(friends.userId2, userId1)),
        ),
      );

    return !!existingFriend;
  }

  /**
   * 친구 수 가져오기
   */
  async getFriendsCount(userId: string): Promise<number> {
    return await this.db.$count(
      friends,
      or(eq(friends.userId1, userId), eq(friends.userId2, userId)),
    );
  }

  /**
   * 친구 목록 가져오기
   */
  async getFriends(userId: string): Promise<User[]> {
    const friendRelations = await this.db
      .select()
      .from(friends)
      .where(or(eq(friends.userId1, userId), eq(friends.userId2, userId)));

    const friendIds = friendRelations.map((rel) =>
      rel.userId1 === userId ? rel.userId2 : rel.userId1,
    );

    if (friendIds.length === 0) {
      return [];
    }

    const friendsList = await this.db
      .select()
      .from(users)
      .where(inArray(users.id, friendIds));

    return friendsList;
  }

  /**
   * 사용자가 받은 친구 요청 목록 가져오기
   */
  async getFriendRequests(userId: string): Promise<User[]> {
    const requests = await this.db
      .select({ requesterId: friendRequests.requesterId })
      .from(friendRequests)
      .where(eq(friendRequests.targetId, userId));

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

  async updateUser(
    id: string,
    { name, birthday, email, statusMessage, profileImageId }: UpdateUserDto,
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

    if (email) {
      if (!isEmail(email)) {
        throw new BadRequestException('유효한 이메일 형식이 아닙니다.');
      }
    }

    const updateData: Partial<User> = {
      name,
      birthday,
      statusMessage,
      email,
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

  /**
   * 사용자 구독하기
   */
  async subscribeUser(userId: string, targetId: string): Promise<void> {
    if (userId === targetId) {
      throw new BadRequestException('자기 자신을 구독할 수 없습니다.');
    }

    // 이미 구독 중인지 확인
    const [existingSubscription] = await this.db
      .select()
      .from(subscriptions)
      .where(
        and(
          eq(subscriptions.subscriberId, userId),
          eq(subscriptions.targetId, targetId),
        ),
      );

    if (existingSubscription) {
      throw new BadRequestException('이미 구독 중입니다.');
    }

    await this.db.insert(subscriptions).values({
      subscriberId: userId,
      targetId,
    });
  }

  /**
   * 구독 취소하기
   */
  async unsubscribeUser(userId: string, targetId: string): Promise<void> {
    const [existingSubscription] = await this.db
      .select()
      .from(subscriptions)
      .where(
        and(
          eq(subscriptions.subscriberId, userId),
          eq(subscriptions.targetId, targetId),
        ),
      );

    if (!existingSubscription) {
      throw new BadRequestException('구독 중이 아닙니다.');
    }

    await this.db
      .delete(subscriptions)
      .where(
        and(
          eq(subscriptions.subscriberId, userId),
          eq(subscriptions.targetId, targetId),
        ),
      );
  }

  /**
   * 사용자의 구독 목록 가져오기
   */
  async getSubscriptions(userId: string): Promise<User[]> {
    const subscriptionRelations = await this.db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.subscriberId, userId));

    const targetIds = subscriptionRelations.map((rel) => rel.targetId);

    if (targetIds.length === 0) {
      return [];
    }

    const subscriptionsList = await this.db
      .select()
      .from(users)
      .where(inArray(users.id, targetIds));

    return subscriptionsList;
  }

  /**
   * 특정 사용자를 구독하는 사용자 목록 가져오기
   */
  async getSubscribers(userId: string): Promise<User[]> {
    const subscriptionRelations = await this.db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.targetId, userId));

    const subscriberIds = subscriptionRelations.map((rel) => rel.subscriberId);

    if (subscriberIds.length === 0) {
      return [];
    }

    const subscribersList = await this.db
      .select()
      .from(users)
      .where(inArray(users.id, subscriberIds));

    return subscribersList;
  }

  /**
   * 구독 수 가져오기
   */
  async getSubscriptionsCount(userId: string): Promise<number> {
    return await this.db.$count(
      subscriptions,
      eq(subscriptions.subscriberId, userId),
    );
  }

  /**
   * 구독자 수 가져오기
   */
  async getSubscribersCount(userId: string): Promise<number> {
    return await this.db.$count(
      subscriptions,
      eq(subscriptions.targetId, userId),
    );
  }

  /**
   * 특정 사용자를 구독하는지 확인
   */
  async isSubscribed(subscriberId: string, targetId: string): Promise<boolean> {
    const [subscription] = await this.db
      .select()
      .from(subscriptions)
      .where(
        and(
          eq(subscriptions.subscriberId, subscriberId),
          eq(subscriptions.targetId, targetId),
        ),
      );

    return !!subscription;
  }

  /**
   * 사용자 검색
   */
  async searchUsers(query: string, limit = 10, offset = 0): Promise<User[]> {
    const searchPattern = `%${query}%`;

    const searchedUsers = await this.db
      .select()
      .from(users)
      .where(like(users.name, searchPattern))
      .limit(limit)
      .offset(offset);

    return searchedUsers;
  }

  /**
   * 사용자의 디바이스 토큰 업데이트
   */
  async updateDeviceToken(userId: string, deviceToken: string): Promise<void> {
    const data: Partial<schema.Credential> = {
      deviceToken,
    };

    await this.db
      .update(credentials)
      .set(data)
      .where(eq(credentials.userId, userId));
  }

  /**
   * credential 조회
   */
  async findCredentialById(userId: string): Promise<schema.Credential | null> {
    const [credential] = await this.db
      .select()
      .from(credentials)
      .where(eq(credentials.userId, userId));

    return credential || null;
  }

  /**
   * 사용자를 차단합니다.
   * @param adminId 차단을 수행하는 관리자 ID
   * @param targetUserId 차단할 사용자 ID
   */
  async blockUser(adminId: string, targetUserId: string): Promise<void> {
    const adminUser = await this.findById(adminId);

    if (!adminUser || !adminUser.isAdmin) {
      throw new ForbiddenException('관리자 권한이 필요합니다.');
    }

    const targetUser = await this.findById(targetUserId);

    if (!targetUser) {
      throw new NotFoundException('차단할 사용자를 찾을 수 없습니다.');
    }

    const [existingBlock] = await this.db
      .select()
      .from(userBlocks)
      .where(
        and(
          eq(userBlocks.blockedUserId, targetUserId),
          eq(userBlocks.blockedBy, adminId),
        ),
      );

    if (existingBlock) {
      throw new BadRequestException('이미 차단된 사용자입니다.');
    }

    await this.db.insert(userBlocks).values({
      blockedUserId: targetUserId,
      blockedBy: adminId,
    });
  }

  /**
   * 사용자의 차단을 해제합니다.
   * @param adminId 차단을 해제하는 관리자 ID
   * @param targetUserId 차단 해제할 사용자 ID
   */
  async unblockUser(adminId: string, targetUserId: string): Promise<void> {
    const adminUser = await this.findById(adminId);

    if (!adminUser || !adminUser.isAdmin) {
      throw new ForbiddenException('관리자 권한이 필요합니다.');
    }

    const targetUser = await this.findById(targetUserId);

    if (!targetUser) {
      throw new NotFoundException('차단 해제할 사용자를 찾을 수 없습니다.');
    }

    await this.db
      .delete(userBlocks)
      .where(
        and(
          eq(userBlocks.blockedUserId, targetUserId),
          eq(userBlocks.blockedBy, adminId),
        ),
      );
  }

  /**
   * 특정 사용자가 차단되었는지 확인합니다.
   * @param userId 확인할 사용자 ID
   */
  async isUserBlocked(userId: string): Promise<boolean> {
    const [blocked] = await this.db
      .select()
      .from(userBlocks)
      .where(eq(userBlocks.blockedUserId, userId));

    return !!blocked;
  }
}
