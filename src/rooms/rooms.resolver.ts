import {
  Resolver,
  Mutation,
  Query,
  Args,
  ID,
  ResolveField,
  Parent,
} from '@nestjs/graphql';
import { RoomsService } from './rooms.service';
import { Room } from './room.type';
import { UseGuards } from '@nestjs/common';
import { GqlAuthGuard } from '../core/guards/gql.guard';
import { CurrentUser } from '../core/decorators/current_user.decorator';
import { User } from '../users/user.type';

@Resolver(() => Room)
export class RoomsResolver {
  constructor(private readonly roomsService: RoomsService) {}

  @ResolveField(() => [User], { description: '채팅방의 사용자 목록 조회' })
  async users(@Parent() room: Room): Promise<User[]> {
    return this.roomsService.getUsersInRoom(room.id);
  }

  @Mutation(() => Room, { description: '채팅방 생성' })
  @UseGuards(GqlAuthGuard)
  async createRoom(
    @Args({ name: 'userIds', type: () => [ID] }) userIds: string[],
    @CurrentUser() currentUser: User,
  ): Promise<Room> {
    if (!userIds.includes(currentUser.id)) userIds.push(currentUser.id);

    return this.roomsService.createRoom(userIds);
  }

  @Query(() => [Room], { description: '내 채팅방 목록 조회' })
  @UseGuards(GqlAuthGuard)
  async myRooms(@CurrentUser() currentUser: User): Promise<Room[]> {
    return this.roomsService.getRoomsByUserId(currentUser.id);
  }
}
