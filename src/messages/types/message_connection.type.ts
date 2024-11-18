import { ObjectType, Field, Int } from '@nestjs/graphql';
import { Message } from './message.type';

@ObjectType({ description: '메시지 페이지네이션 정보' })
export class MessageConnection {
  @Field(() => [Message], { description: '메시지 목록' })
  edges: Message[];

  @Field(() => Boolean, { description: '다음 페이지 여부' })
  hasNextPage: boolean;

  @Field(() => Int, { nullable: true, description: '다음 페이지 오프셋' })
  nextOffset?: number;
}
