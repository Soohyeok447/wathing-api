import { InputType, Field, ID } from '@nestjs/graphql';
import { MessageType } from '../../messages/types/message_type.enum';

@InputType({ description: '댓글 생성에 필요한 입력 데이터' })
export class CreateCommentDto {
  @Field(() => ID, { description: '스토리 ID' })
  storyId: string;

  @Field({ description: '댓글 내용' })
  content: string;

  @Field(() => MessageType, {
    defaultValue: MessageType.TEXT,
    description: '댓글 타입 (text, emoji)',
  })
  type: MessageType;
}
