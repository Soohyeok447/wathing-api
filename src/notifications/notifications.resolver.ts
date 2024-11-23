import {
  Resolver,
  Query,
  Mutation,
  Args,
  Subscription,
  Context,
} from '@nestjs/graphql';
import { NotificationsService } from './notifications.service';
import { Notification } from './notification.type';
import { CurrentUser } from '../core/decorators/current_user.decorator';
import { UseGuards } from '@nestjs/common';
import { GqlAuthGuard } from '../core/guards/gql.guard';
import { User } from '../data/schema';
import { pubSub } from '../core/config/pubsub';

@Resolver(() => Notification)
export class NotificationsResolver {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Query(() => [Notification], { description: '알림 목록 조회' })
  @UseGuards(GqlAuthGuard)
  async notifications(@CurrentUser() currentUser): Promise<Notification[]> {
    return this.notificationsService.getNotifications(currentUser.id);
  }

  @Mutation(() => Boolean, { description: '알림 읽음 처리' })
  @UseGuards(GqlAuthGuard)
  async readNotification(
    @Args('notificationId') notificationId: string,
  ): Promise<boolean> {
    await this.notificationsService.markAsRead(notificationId);
    return true;
  }

  @Subscription(() => Notification, {
    filter: (payload, variables, context) => {
      return payload.notification.userId === context.req.user.id;
    },
    resolve: (payload) => payload.notification,
  })
  @UseGuards(GqlAuthGuard)
  onNotifications(@CurrentUser() currentUser: User, @Context() context) {
    const subscriptionKey = 'onNotifications';

    const subscriptionMap: Map<
      string,
      AsyncIterator<any>
    > = context.subscriptionMap;

    if (!subscriptionMap) {
      throw new Error('구독 상태를 저장할 subscriptionMap이 없습니다.');
    }

    if (subscriptionMap.has(subscriptionKey)) {
      console.log(
        `구독 중복 방지: ${currentUser.name}은 이미 onNotifications를 구독하고 있습니다.`,
      );

      // 기존의 AsyncIterator를 반환합니다.
      return subscriptionMap.get(subscriptionKey);
    }

    console.log(`${currentUser.name} - onNotifications 구독 시작`);

    const asyncIterator = pubSub.asyncIterableIterator('onNotifications');

    const originalReturn = asyncIterator.return;
    asyncIterator.return = () => {
      console.log(`${currentUser.name} - onNotifications 구독 종료됨`);
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
