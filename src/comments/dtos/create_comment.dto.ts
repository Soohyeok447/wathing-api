import { InputType, Field, ID } from '@nestjs/graphql';

@InputType({ description: '댓글 생성에 필요한 입력 데이터' })
export class CreateCommentDto {
  @Field(() => ID, { description: '스토리 ID' })
  storyId: string;

  @Field({ description: '댓글 내용' })
  content: string;
}
