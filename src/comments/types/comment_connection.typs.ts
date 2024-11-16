import { ObjectType, Field } from '@nestjs/graphql';
import { Comment } from './comment.type';

@ObjectType({ description: '댓글 페이지네이션 정보' })
export class CommentConnection {
  @Field(() => [Comment])
  edges: Comment[];

  @Field()
  hasNextPage: boolean;

  @Field({ nullable: true })
  nextOffset?: number;
}
