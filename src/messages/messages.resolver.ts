import {
  Resolver,
  Mutation,
  Args,
  Subscription,
  ResolveField,
  Parent,
  Context,
} from '@nestjs/graphql';
import { MessagesService } from './messages.service';
import { Message } from './types/message.type';
import {
  BadRequestException,
  forwardRef,
  Inject,
  UseGuards,
} from '@nestjs/common';
import { GqlAuthGuard } from '../core/guards/gql.guard';
import { CurrentUser } from '../core/decorators/current_user.decorator';
import { User } from '../users/user.type';
import { pubSub } from '../core/config/pubsub';
import { Room } from '../rooms/room.type';
import { RoomsService } from '../rooms/rooms.service';
import { UsersService } from '../users/users.service';
import { SendMessageDto } from './dtos/send_message.dto';
import { NotificationsService } from '../notifications/notifications.service';

@Resolver(() => Message)
export class MessagesResolver {
  constructor(
    private readonly messagesService: MessagesService,
    @Inject(forwardRef(() => RoomsService))
    private readonly roomsService: RoomsService,
    @Inject(forwardRef(() => UsersService))
    private readonly usersService: UsersService,
    private readonly notificationsService: NotificationsService,
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
    @Args('input') { roomId, content, type }: SendMessageDto,
    @CurrentUser() currentUser: User,
  ): Promise<Message> {
    const message = await this.messagesService.sendMessage(currentUser.id, {
      roomId,
      content,
      type,
    });

    const usersInRoom = await this.roomsService.getUsersInRoom(roomId);

    const publishPromises = usersInRoom.map(async ({ id: receiverId }) => {
      pubSub.publish(`onMessage:${receiverId}`, {
        onMessage: message,
      });

      const sender = await this.usersService.findById(currentUser.id);

      // 상대방에게 메시지 알림 생성
      this.notificationsService.createNotification(receiverId, 'message', {
        roomId,
        messageId: message.id,
        content: message.content,
        message: `${sender.name}님이 메시지를 보냈습니다.`,
        senderId: message.senderId,
      });
    });

    await Promise.all(publishPromises);

    console.log(`${currentUser.name} - 메시지 전송함 : ${content}`);

    return message;
  }

  @Subscription(() => Message, {
    name: 'onMessages',
    description: '본인에게 도착하는 모든 메시지 구독',
    resolve: (value) => value.onMessage,
  })
  @UseGuards(GqlAuthGuard)
  onMessages(@CurrentUser() currentUser: User, @Context() context) {
    const subscriptionKey = 'onMessages';

    const subscriptionMap: Map<
      string,
      AsyncIterator<any>
    > = context.subscriptionMap;

    if (!subscriptionMap) {
      throw new BadRequestException(
        '구독 상태를 저장할 subscriptionMap이 없습니다.',
      );
    }

    if (subscriptionMap.has(subscriptionKey)) {
      console.log(
        `구독 중복 방지: ${currentUser.name}은 이미 onMessages를 구독하고 있습니다.`,
      );

      // 기존의 AsyncIterator를 반환합니다.
      return subscriptionMap.get(subscriptionKey);
    }

    console.log(currentUser.name + ' - onMessages 구독 시작');

    const asyncIterator = pubSub.asyncIterableIterator(
      `onMessage:${currentUser.id}`,
    );

    const originalReturn = asyncIterator.return;

    asyncIterator.return = () => {
      console.log(`${currentUser.name} - onMessages 구독 종료됨`);

      subscriptionMap.delete(subscriptionKey);

      if (originalReturn) {
        return originalReturn.call(asyncIterator);
      }

      return Promise.resolve({ done: true, value: undefined });
    };

    subscriptionMap.set(subscriptionKey, asyncIterator);

    return asyncIterator;
  }
}
