import { ApiProperty } from '@nestjs/swagger';

export class SignInDto {
  @ApiProperty({ description: '사용자 회원가입 ID', type: 'string' })
  id: string;

  @ApiProperty({ description: '사용자 비밀번호', type: 'string' })
  password: string;
}
