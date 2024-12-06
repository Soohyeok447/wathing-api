import { ApiProperty } from '@nestjs/swagger';
import { uuidExample } from '../../common/swagger_example';

export class SignUpDto {
  @ApiProperty({ description: '사용자 회원가입 ID', type: 'string' })
  id: string;

  @ApiProperty({ description: '사용자 비밀번호', type: 'string' })
  password: string;

  @ApiProperty({
    description: '사용자 이름',
    minLength: 2,
    maxLength: 12,
    type: 'string',
    example: 'name',
  })
  name: string;

  @ApiProperty({
    description: '이메일 주소',
    example: 'testuser@example.com',
  })
  email: string;

  @ApiProperty({
    description: '생일',
    type: 'string',
    example: '1990-03-03',
  })
  birthday: string;

  @ApiProperty({
    description: '프로필 이미지 ID',
    required: false,
    type: 'string',
    example: uuidExample,
  })
  profileImageId?: string;
}
