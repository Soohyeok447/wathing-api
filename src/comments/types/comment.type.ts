import { ObjectType, Field, ID } from '@nestjs/graphql';
import { User } from '../../users/user.type';

@ObjectType({ description: '댓글 엔티티' })
export class Comment {
  @Field(() => ID, { description: '댓글 ID' })
  id: string;

  @Field(() => ID, { description: '작성자 ID' })
  userId: string;

  @Field(() => User, { description: '작성자' })
  user?: User;

  @Field(() => ID, { description: '스토리 ID' })
  storyId: string;

  @Field({ description: '댓글 내용' })
  content: string;

  @Field({ description: '작성일' })
  createdAt: Date;
}
