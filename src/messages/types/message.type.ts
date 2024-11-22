import { ObjectType, Field, ID } from '@nestjs/graphql';
import { User } from '../../users/user.type';
import { Room } from '../../rooms/room.type';

@ObjectType({ description: '메시지 엔티티' })
export class Message {
  @Field(() => ID, { description: '메시지 ID' })
  id: string;

  @Field(() => Room, { nullable: true, description: '채팅방' })
  room?: Room;

  @Field(() => User, { nullable: true, description: '메시지 송신 유저' })
  sender?: User;

  roomId: string;

  senderId: string;

  @Field({ description: '메시지 내용' })
  content: string;

  @Field({
    description: '메시지 타입 (text, emoji)',
  })
  type: string;

  @Field({ description: '생성된 날짜' })
  createdAt: Date;
}
