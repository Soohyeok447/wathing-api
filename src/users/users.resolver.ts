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
import { UseGuards } from '@nestjs/common';

@Resolver(() => User)
export class UsersResolver {
  constructor(
    private readonly usersService: UsersService,
    private readonly filesService: FilesService,
  ) {}

  @Query(() => User, {
    name: 'user',
    description: '유저 찾기 (profileImage: File 필드 포함)',
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
  async updateUser(@Args('input') input: UpdateUserDto): Promise<User> {
    return this.usersService.updateUser(input);
  }

  @Mutation(() => Boolean, { description: '유저 삭제' })
  async deleteUser(
    @Args('id', { type: () => ID }) id: string,
  ): Promise<boolean> {
    await this.usersService.deleteUser(id);

    return true;
  }

  @Mutation(() => Boolean, { description: '유저 팔로우' })
  @UseGuards(GqlAuthGuard)
  async followUser(
    @Args('userId', { type: () => ID, description: '팔로우할 유저 ID' })
    userId: string,
    @CurrentUser() currentUser: User,
  ): Promise<boolean> {
    await this.usersService.followUser(currentUser.id, userId);

    return true;
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
}
