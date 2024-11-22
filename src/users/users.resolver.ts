import {
  Resolver,
  Query,
  Mutation,
  Args,
  ID,
  ResolveField,
  Parent,
  Int,
} from '@nestjs/graphql';
import { UsersService } from './users.service';
import { User } from './user.type';
import { UpdateUserDto } from './dtos/update_user.dto';
import { FilesService } from '../files/files.service';
import { File } from '../files/file.type';
import { CurrentUser } from '../core/decorators/current_user.decorator';
import { GqlAuthGuard } from '../core/guards/gql.guard';
import { forwardRef, Inject, UseGuards } from '@nestjs/common';
import { StoryConnection } from '../stories/types/story_connection.type';
import { StoryService } from '../stories/story.service';
import { RoomsService } from '../rooms/rooms.service';

@Resolver(() => User)
export class UsersResolver {
  constructor(
    private readonly usersService: UsersService,
    private readonly filesService: FilesService,
    private readonly storyService: StoryService,
    @Inject(forwardRef(() => RoomsService))
    private readonly roomsService: RoomsService,
  ) {}

  @Query(() => User, {
    name: 'user',
    description: '유저 찾기',
  })
  async findById(
    @Args('id', { type: () => String }) id: string,
  ): Promise<User> {
    return this.usersService.findById(id);
  }

  @ResolveField(() => File, { nullable: true, description: '프로필 이미지' })
  async profileImage(@Parent() user: User): Promise<File | null> {
    if (!user.profileImageId) {
      return null;
    }

    return this.filesService.readFile(user.profileImageId);
  }

  @Mutation(() => User, { description: '유저 수정' })
  @UseGuards(GqlAuthGuard)
  async updateUser(
    @Args('input')
    { name, birthday, statusMessage, profileImageId }: UpdateUserDto,
    @CurrentUser() currentUser: User,
  ): Promise<User> {
    return this.usersService.updateUser(currentUser.id, {
      name,
      birthday,
      statusMessage,
      profileImageId,
    });
  }

  @Mutation(() => Boolean, { description: '유저 삭제' })
  @UseGuards(GqlAuthGuard)
  async deleteUser(@CurrentUser() currentUser: User): Promise<boolean> {
    await this.usersService.deleteUser(currentUser.id);

    return true;
  }

  @Mutation(() => Boolean, { description: '팔로우 요청 보내기' })
  @UseGuards(GqlAuthGuard)
  async sendFollowRequest(
    @Args('userId', { type: () => ID }) userId: string,
    @CurrentUser() currentUser: User,
  ): Promise<boolean> {
    await this.usersService.sendFollowRequest(currentUser.id, userId);
    return true;
  }

  @Mutation(() => Boolean, { description: '팔로우 요청 수락' })
  @UseGuards(GqlAuthGuard)
  async acceptFollowRequest(
    @Args('userId', { type: () => ID }) userId: string,
    @CurrentUser() currentUser: User,
  ): Promise<boolean> {
    await this.usersService.acceptFollowRequest(currentUser.id, userId);
    return true;
  }

  @Mutation(() => Boolean, { description: '팔로우 요청 거절' })
  @UseGuards(GqlAuthGuard)
  async rejectFollowRequest(
    @Args('userId', { type: () => ID }) userId: string,
    @CurrentUser() currentUser: User,
  ): Promise<boolean> {
    await this.usersService.rejectFollowRequest(currentUser.id, userId);

    return true;
  }

  @ResolveField(() => [User], {
    description: '팔로우 요청 목록',
    nullable: true,
  })
  async followRequests(@Parent() user: User): Promise<User[]> {
    return this.usersService.getPendingFollowRequests(user.id);
  }

  @Mutation(() => Boolean, { description: '유저 언팔로우' })
  @UseGuards(GqlAuthGuard)
  async unfollowUser(
    @Args('userId', { type: () => ID, description: '언팔로우할 유저 ID' })
    userId: string,
    @CurrentUser() currentUser: User,
  ): Promise<boolean> {
    await this.usersService.unfollowUser(currentUser.id, userId);

    return true;
  }

  @ResolveField(() => Int, { description: '팔로워 수' })
  async followersCount(@Parent() user: User): Promise<number> {
    return this.usersService.getFollowersCount(user.id);
  }

  @ResolveField(() => Int, { description: '팔로잉 수' })
  async followingCount(@Parent() user: User): Promise<number> {
    return this.usersService.getFollowingCount(user.id);
  }

  @ResolveField(() => [User], { description: '팔로워 목록', nullable: true })
  async followers(@Parent() user: User): Promise<User[]> {
    return this.usersService.getFollowers(user.id);
  }

  @ResolveField(() => [User], { description: '팔로잉 목록', nullable: true })
  async following(@Parent() user: User): Promise<User[]> {
    return this.usersService.getFollowing(user.id);
  }

  @ResolveField(() => [User], { description: '채팅 요청 목록', nullable: true })
  async chatRequests(@Parent() user: User): Promise<User[]> {
    return this.roomsService.getPendingChatRequests(user.id);
  }

  @ResolveField(() => StoryConnection, {
    description: '사용자의 스토리 목록',
    nullable: true,
  })
  async stories(
    @Parent() user: User,
    @Args('limit', { type: () => Int, nullable: true, defaultValue: 5 })
    limit: number,
    @Args('offset', { type: () => Int, nullable: true, defaultValue: 0 })
    offset: number,
  ): Promise<StoryConnection> {
    return this.storyService.findStoriesByUserId(user.id, limit, offset);
  }
}
