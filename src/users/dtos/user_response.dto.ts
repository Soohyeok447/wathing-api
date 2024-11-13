import { Field, ObjectType, ID } from '@nestjs/graphql';

@ObjectType()
export class UserResponseDto {
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

  @Field({ description: '생성된 날짜' })
  createdAt: Date;

  @Field({ nullable: true, description: '마지막 업데이트 날짜' })
  updatedAt?: Date;
}
