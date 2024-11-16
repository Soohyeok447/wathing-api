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

@Injectable()
export class UsersService {
  constructor(
    private readonly filesService: FilesService,
    @Inject('DRIZZLE') private readonly db: NodePgDatabase<typeof schema>,
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

  async followUser(userId: string, followingId: string): Promise<void> {
    if (userId === followingId) {
      throw new BadRequestException('자기 자신을 팔로우할 수 없습니다.');
    }

    const followingUser = await this.findById(followingId);

    if (!followingUser) {
      throw new NotFoundException('팔로우할 유저를 찾을 수 없습니다.');
    }

    const [existingFollow] = await this.db
      .select()
      .from(followers)
      .where(
        and(
          eq(followers.followerId, userId),
          eq(followers.followingId, followingId),
        ),
      );

    if (existingFollow) {
      throw new BadRequestException('이미 팔로우 중입니다.');
    }

    await this.db.insert(followers).values({
      followerId: userId,
      followingId,
    });
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
