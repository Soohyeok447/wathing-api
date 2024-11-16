import { ObjectType, Field, ID } from '@nestjs/graphql';
import { User } from '../users/user.type';

@ObjectType({ description: '채팅방 엔티티' })
export class Room {
  @Field(() => ID, { description: '채팅방 ID' })
  id: string;

  @Field(() => [User], { description: '채팅방에 참여한 사용자들' })
  users?: User[];

  @Field({ description: '생성된 날짜' })
  createdAt: Date;
}
