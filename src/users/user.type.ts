import { Field, ObjectType, ID, Int } from '@nestjs/graphql';

@ObjectType({ description: '유저 엔티티' })
export class User {
  @Field(() => ID, { description: '유저 ID' })
  id: string;

  @Field({ description: '유저 이름' })
  name: string;

  @Field({ description: '생년월일' })
  birthday: string;

  @Field({ nullable: true, description: '상태 메시지' })
  statusMessage?: string;

  @Field({ nullable: true, description: '프로필 이미지 ID' })
  profileImageId?: string;

  @Field(() => Int, { description: '친구 수', nullable: true })
  friendsCount?: number;

  @Field(() => Int, { nullable: true, description: '구독한 사용자 수' })
  subscriptionsCount?: number;

  @Field(() => Int, { nullable: true, description: '구독자 수' })
  subscribersCount?: number;

  @Field(() => Boolean, {
    nullable: true,
    description: '현재 사용자가 해당 유저와 친구인지 여부',
  })
  isMyFriend?: boolean;

  @Field(() => Boolean, {
    nullable: true,
    description: '현재 사용자가 해당 유저를 구독하고 있는지 여부',
  })
  isSubscribed?: boolean;

  @Field({ description: '이메일' })
  email: string;

  @Field({ description: '생성된 날짜' })
  createdAt: Date;

  @Field({ nullable: true, description: '마지막 업데이트 날짜' })
  updatedAt?: Date;
}
