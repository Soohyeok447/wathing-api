import { InputType, Field, ID } from '@nestjs/graphql';

@InputType()
export class CreateCommentDto {
  @Field(() => ID, { description: '스토리 ID' })
  storyId: string;

  @Field({ description: '댓글 내용' })
  content: string;
}
