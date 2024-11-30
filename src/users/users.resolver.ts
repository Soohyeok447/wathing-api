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

  @Query(() => [User], {
    name: 'subscriptions',
    description: '특정 사용자의 구독 목록 조회',
  })
  async subscriptions(
    @Args('id', { type: () => String }) id: string,
  ): Promise<User[]> {
    return this.usersService.getSubscriptions(id);
  }

  @Query(() => [User], {
    name: 'subscribers',
    description: '특정 사용자의 구독자 목록 조회',
  })
  async subscribers(
    @Args('id', { type: () => String }) id: string,
  ): Promise<User[]> {
    return this.usersService.getSubscribers(id);
  }

  @Query(() => [User], {
    name: 'friends',
    description: '특정 사용자의 친구 목록',
  })
  async friends(
    @Args('id', { type: () => String }) id: string,
  ): Promise<User[]> {
    return this.usersService.getFriends(id);
  }

  @Query(() => [User], { description: '친구 요청 목록 조회' })
  @UseGuards(GqlAuthGuard)
  async friendRequests(@CurrentUser() currentUser: User): Promise<User[]> {
    return this.usersService.getFriendRequests(currentUser.id);
  }

  @Query(() => [User], { description: '사용자 검색' })
  async searchUsers(
    @Args('query', { type: () => String }) query: string,
    @Args('limit', { type: () => Int, defaultValue: 10 }) limit: number,
    @Args('offset', { type: () => Int, defaultValue: 0 }) offset: number,
  ): Promise<User[]> {
    return this.usersService.searchUsers(query, limit, offset);
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

  @Mutation(() => Boolean, { description: '친구 요청 보내기' })
  @UseGuards(GqlAuthGuard)
  async sendFriendRequest(
    @Args('userId', { type: () => ID }) userId: string,
    @CurrentUser() currentUser: User,
  ): Promise<boolean> {
    await this.usersService.sendFriendRequest(currentUser.id, userId);
    return true;
  }

  @Mutation(() => Boolean, { description: '친구 요청 수락' })
  @UseGuards(GqlAuthGuard)
  async acceptFriendRequest(
    @Args('userId', { type: () => ID }) userId: string,
    @CurrentUser() currentUser: User,
  ): Promise<boolean> {
    await this.usersService.acceptFriendRequest(currentUser.id, userId);
    return true;
  }

  @Mutation(() => Boolean, { description: '친구 요청 거절' })
  @UseGuards(GqlAuthGuard)
  async rejectFriendRequest(
    @Args('userId', { type: () => ID }) userId: string,
    @CurrentUser() currentUser: User,
  ): Promise<boolean> {
    await this.usersService.rejectFriendRequest(currentUser.id, userId);
    return true;
  }

  @Mutation(() => Boolean, { description: '친구 삭제' })
  @UseGuards(GqlAuthGuard)
  async unFriendUser(
    @Args('userId', { type: () => ID }) userId: string,
    @CurrentUser() currentUser: User,
  ): Promise<boolean> {
    await this.usersService.unfriendUser(currentUser.id, userId);
    return true;
  }

  @ResolveField(() => Int, { nullable: true, description: '친구 수' })
  async friendsCount(@Parent() user: User): Promise<number> {
    return this.usersService.getFriendsCount(user.id);
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

  @Mutation(() => Boolean, { description: '사용자 구독하기' })
  @UseGuards(GqlAuthGuard)
  async subscribeUser(
    @Args('userId', { type: () => ID }) userId: string,
    @CurrentUser() currentUser: User,
  ): Promise<boolean> {
    await this.usersService.subscribeUser(currentUser.id, userId);
    return true;
  }

  @Mutation(() => Boolean, { description: '구독 취소하기' })
  @UseGuards(GqlAuthGuard)
  async unsubscribeUser(
    @Args('userId', { type: () => ID }) userId: string,
    @CurrentUser() currentUser: User,
  ): Promise<boolean> {
    await this.usersService.unsubscribeUser(currentUser.id, userId);
    return true;
  }

  @ResolveField(() => Int, { nullable: true, description: '구독한 사용자 수' })
  async subscriptionsCount(@Parent() user: User): Promise<number> {
    return this.usersService.getSubscriptionsCount(user.id);
  }

  @ResolveField(() => Int, { nullable: true, description: '구독자 수' })
  async subscribersCount(@Parent() user: User): Promise<number> {
    return this.usersService.getSubscribersCount(user.id);
  }

  @ResolveField(() => Boolean, {
    nullable: true,
    description: '내가 해당 사용자를 구독하고 있는지 여부',
  })
  @UseGuards(GqlAuthGuard)
  async isSubscribed(
    @Parent() user: User,
    @CurrentUser() currentUser: User,
  ): Promise<boolean> {
    return this.usersService.isSubscribed(currentUser.id, user.id);
  }

  @ResolveField(() => Boolean, {
    nullable: true,
    description: '현재 사용자가 해당 유저와 친구인지 여부',
  })
  @UseGuards(GqlAuthGuard)
  async isMyFriend(
    @Parent() user: User,
    @CurrentUser() currentUser: User,
  ): Promise<boolean> {
    return this.usersService.checkIfFriends(currentUser.id, user.id);
  }

  @Mutation(() => Boolean, { description: '사용자의 FCM 토큰 업데이트' })
  @UseGuards(GqlAuthGuard)
  async updateUserDeviceToken(
    @Args('deviceToken', { type: () => String }) deviceToken: string,
    @CurrentUser() currentUser: User,
  ): Promise<boolean> {
    await this.usersService.updateDeviceToken(currentUser.id, deviceToken);
    return true;
  }
}
