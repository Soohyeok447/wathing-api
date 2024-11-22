import {
  Resolver,
  Mutation,
  Query,
  Args,
  ID,
  ResolveField,
  Parent,
  Int,
} from '@nestjs/graphql';
import { RoomsService } from './rooms.service';
import { Room } from './room.type';
import { BadRequestException, UseGuards } from '@nestjs/common';
import { GqlAuthGuard } from '../core/guards/gql.guard';
import { CurrentUser } from '../core/decorators/current_user.decorator';
import { User } from '../users/user.type';
import { MessageConnection } from '../messages/types/message_connection.type';
import { MessagesService } from '../messages/messages.service';

@Resolver(() => Room)
export class RoomsResolver {
  constructor(
    private readonly roomsService: RoomsService,
    private readonly messagesService: MessagesService,
  ) {}

  @ResolveField(() => [User], { description: '채팅방의 사용자 목록 조회' })
  async users(@Parent() room: Room): Promise<User[]> {
    return this.roomsService.getUsersInRoom(room.id);
  }

  @ResolveField(() => MessageConnection, {
    description: '채팅방의 메시지 목록',
  })
  @UseGuards(GqlAuthGuard)
  async messages(
    @Parent() room: Room,
    @Args('limit', { type: () => Int, nullable: true, defaultValue: 20 })
    limit: number,
    @Args('offset', { type: () => Int, nullable: true, defaultValue: 0 })
    offset: number,
  ): Promise<MessageConnection> {
    return this.messagesService.getMessagesByRoomId(room.id, limit, offset);
  }

  @Mutation(() => Boolean, { description: '1:1 채팅 요청 보내기' })
  @UseGuards(GqlAuthGuard)
  async sendChatRequest(
    @Args('userId', { type: () => ID }) userId: string,
    @CurrentUser() currentUser: User,
  ): Promise<boolean> {
    await this.roomsService.sendChatRequest(currentUser.id, userId);
    return true;
  }

  @Mutation(() => Boolean, { description: '1:1 채팅 요청 수락' })
  @UseGuards(GqlAuthGuard)
  async acceptChatRequest(
    @Args('userId', { type: () => ID }) userId: string,
    @CurrentUser() currentUser: User,
  ): Promise<boolean> {
    return this.roomsService.acceptChatRequest(currentUser.id, userId);
  }

  @Mutation(() => Boolean, { description: '1:1 채팅 요청 거절' })
  @UseGuards(GqlAuthGuard)
  async rejectChatRequest(
    @Args('userId', { type: () => ID }) userId: string,
    @CurrentUser() currentUser: User,
  ): Promise<boolean> {
    await this.roomsService.rejectChatRequest(currentUser.id, userId);
    return true;
  }

  @Mutation(() => Boolean, { description: '채팅방 나가기' })
  @UseGuards(GqlAuthGuard)
  async leaveRoom(
    @Args('roomId', { type: () => ID }) roomId: string,
    @CurrentUser() currentUser: User,
  ): Promise<boolean> {
    return this.roomsService.leaveRoom(roomId, currentUser.id);
  }

  @Query(() => [Room], { description: '내 채팅방 목록 조회' })
  @UseGuards(GqlAuthGuard)
  async myRooms(@CurrentUser() currentUser: User): Promise<Room[]> {
    return this.roomsService.getRoomsByUserId(currentUser.id);
  }

  @Query(() => Room, { description: '채팅방 상세 조회' })
  @UseGuards(GqlAuthGuard)
  async room(
    @Args('roomId', { type: () => ID }) roomId: string,
    @CurrentUser() currentUser: User,
  ): Promise<Room> {
    const isUserInRoom = await this.roomsService.isUserInRoom(
      roomId,
      currentUser.id,
    );

    if (!isUserInRoom) {
      throw new BadRequestException('해당 채팅방에 접근 권한이 없습니다.');
    }

    return this.roomsService.findById(roomId);
  }
}
