import {
  Resolver,
  Mutation,
  Args,
  ID,
  Subscription,
  ResolveField,
  Parent,
} from '@nestjs/graphql';
import { MessagesService } from './messages.service';
import { Message } from './types/message.type';
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

    await pubSub.publish(`onMessage:${roomId}`, { onMessage: message });

    console.log(currentUser.name + ' - 메시지 전송함');

    return message;
  }

  @Subscription(() => Message, {
    name: 'onMessage',
    description: '새로운 메시지 구독',
    filter: (payload, variables) =>
      payload.onMessage.roomId === variables.roomId,
  })
  @UseGuards(GqlAuthGuard)
  onMessage(
    @Args('roomId', { type: () => ID }) roomId: string,
    @CurrentUser() currentUser: User,
  ) {
    console.log(currentUser.name + ' - 구독 시작');

    const isUserInRoom = this.roomsService.isUserInRoom(roomId, currentUser.id);

    if (!isUserInRoom) {
      console.log(currentUser.name + ' - 채팅방에 속해있지 않습니다.');
      throw new ForbiddenException('채팅방에 속해있지 않습니다.');
    }

    return pubSub.asyncIterableIterator(`onMessage:${roomId}`);
  }
}
