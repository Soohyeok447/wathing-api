import { ApiProperty } from '@nestjs/swagger';

export class VerifyPasswordDto {
  @ApiProperty({
    description: '아이디',
    example: 'id123',
  })
  id: string;

  @ApiProperty({
    description: '현재 비밀번호',
    example: 'currentPassword123!',
  })
  password: string;
}
