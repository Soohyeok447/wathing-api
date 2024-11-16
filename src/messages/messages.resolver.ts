import {
  Resolver,
  Mutation,
  Args,
  Query,
  ID,
  Int,
  Subscription,
  ResolveField,
  Parent,
} from '@nestjs/graphql';
import { MessagesService } from './messages.service';
import { Message } from './message.type';
import { ForbiddenException, UseGuards } from '@nestjs/common';
import { GqlAuthGuard } from '../core/guards/gql.guard';
import { CurrentUser } from '../core/decorators/current_user.decorator';
import { User } from '../users/user.type';
import { pubSub } from '../core/config/pubsub';
import { Room } from '../rooms/room.type';
import { RoomsService } from '../rooms/rooms.service';
import { UsersService } from '../users/users.service';

@Resolver(() => Message)
export class MessagesResolver {
  constructor(
    private readonly messagesService: MessagesService,
    private readonly roomsService: RoomsService,
    private readonly usersService: UsersService,
  ) {}

  @ResolveField(() => User)
  async sender(@Parent() message: Message): Promise<User> {
    return this.usersService.findById(message.senderId);
  }

  @ResolveField(() => Room)
  async room(@Parent() message: Message): Promise<Room> {
    return this.roomsService.findById(message.roomId);
  }

  @Mutation(() => Message, { description: '메시지 전송' })
  @UseGuards(GqlAuthGuard)
  async sendMessage(
    @Args('roomId', { type: () => ID }) roomId: string,
    @Args('content') content: string,
    @CurrentUser() currentUser: User,
  ): Promise<Message> {
    const message = await this.messagesService.sendMessage(
      roomId,
      currentUser.id,
      content,
    );

    // 구독자들에게 메시지 발행
    pubSub.publish(`messageSent:${roomId}`, { messageSent: message });

    return message;
  }

  @Query(() => [Message], { description: '채팅방의 메시지 목록' })
  @UseGuards(GqlAuthGuard)
  async messagesInRoom(
    @Args('roomId', { type: () => ID }) roomId: string,
    @Args('limit', { type: () => Int, nullable: true, defaultValue: 20 })
    limit: number,
    @Args('offset', { type: () => Int, nullable: true, defaultValue: 0 })
    offset: number,
  ): Promise<Message[]> {
    return this.messagesService.getMessagesByRoomId(roomId, limit, offset);
  }

  @Subscription(() => Message, {
    name: 'messageSent',
    description: '새로운 메시지 구독',
    filter: (payload, variables) =>
      payload.messageSent.roomId === variables.roomId,
  })
  @UseGuards(GqlAuthGuard)
  messageSent(
    @Args('roomId', { type: () => ID }) roomId: string,
    @CurrentUser() currentUser: User,
  ) {
    const isUserInRoom = this.roomsService.isUserInRoom(roomId, currentUser.id);

    if (!isUserInRoom) {
      throw new ForbiddenException('채팅방에 속해있지 않습니다.');
    }

    return pubSub.asyncIterableIterator(`messageSent:${roomId}`);
  }
}
