import { ObjectType, Field, ID } from '@nestjs/graphql';

@ObjectType({ description: '알림 엔티티' })
export class Notification {
  @Field(() => ID, { description: '알림 ID' })
  id: string;

  @Field({ description: '알림 유형' })
  type: string; // 'message', 'chat_request', 'new_post', 'follow_request'

  @Field({ description: '알림 데이터(JSON 문자열)', nullable: true })
  data?: string;

  @Field({ description: '읽음 여부' })
  read: boolean;

  @Field({ description: '생성된 날짜' })
  createdAt: Date;
}
