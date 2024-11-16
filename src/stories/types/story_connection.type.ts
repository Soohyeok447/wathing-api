import { ObjectType, Field } from '@nestjs/graphql';
import { Story } from './story.type';

@ObjectType({ description: '스토리 페이지네이션 정보' })
export class StoryConnection {
  @Field(() => [Story])
  edges: Story[];

  @Field()
  hasNextPage: boolean;

  @Field({ nullable: true })
  nextOffset?: number;
}
