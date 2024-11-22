import { InputType, Field, ID } from '@nestjs/graphql';
import { MessageType } from '../types/message_type.enum';

@InputType({ description: '메시지 전송에 필요한 입력 데이터' })
export class SendMessageDto {
  @Field({ description: '메시지 내용' })
  content: string;

  @Field(() => ID, {
    description: '채팅방 ID',
  })
  roomId: string;

  @Field(() => MessageType, {
    description: '메시지 타입 (text, emoji)',
  })
  type: MessageType;
}
