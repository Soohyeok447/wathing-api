import { InputType, Field, ID } from '@nestjs/graphql';
import { MessageType } from '../../messages/types/message_type.enum';

@InputType({ description: '댓글 업데이트에 필요한 입력 데이터' })
export class UpdateCommentDto {
  @Field(() => ID, { description: '댓글 ID' })
  id: string;

  @Field({ description: '수정할 내용' })
  content: string;

  @Field(() => MessageType, {
    defaultValue: MessageType.TEXT,
    description: '댓글 타입 (text, emoji)',
  })
  type: MessageType;
}
