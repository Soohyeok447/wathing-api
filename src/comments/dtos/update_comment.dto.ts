import { InputType, Field, ID } from '@nestjs/graphql';

@InputType()
export class UpdateCommentDto {
  @Field(() => ID, { description: '댓글 ID' })
  id: string;

  @Field({ description: '수정할 내용' })
  content: string;
}
