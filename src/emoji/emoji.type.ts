import { ObjectType, Field, ID } from '@nestjs/graphql';

@ObjectType({ description: '이모지 엔티티' })
export class Emoji {
  @Field(() => ID, { description: '이모지 ID' })
  id: string;

  @Field({ description: '이모지 키' })
  key: string;
}
