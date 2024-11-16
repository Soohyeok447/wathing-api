import { ObjectType, Field } from '@nestjs/graphql';
import { Comment } from './comment.type';

@ObjectType()
export class CommentConnection {
  @Field(() => [Comment])
  edges: Comment[];

  @Field()
  hasNextPage: boolean;

  @Field({ nullable: true })
  nextOffset?: number;
}
