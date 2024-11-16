import { Field, InputType } from '@nestjs/graphql';

@InputType({ description: '유저 수정에 필요한 입력 데이터' })
export class UpdateUserDto {
  @Field({ nullable: true, description: '유저 이름 (최소 2자, 최대 12자)' })
  name?: string;

  @Field({ nullable: true, description: '생년월일 (yyyy-mm-dd 형식)' })
  birthday?: string;

  @Field({ nullable: true, description: '상태 메시지 (최대 30자)' })
  statusMessage?: string;

  @Field({ nullable: true, description: '프로필 이미지 ID' })
  profileImageId?: string;
}
