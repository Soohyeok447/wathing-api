import { ObjectType, Field } from '@nestjs/graphql';
import { Story } from './story.type';

@ObjectType()
export class StoryConnection {
  @Field(() => [Story])
  edges: Story[];

  @Field()
  hasNextPage: boolean;

  @Field({ nullable: true })
  nextOffset?: number;
}
