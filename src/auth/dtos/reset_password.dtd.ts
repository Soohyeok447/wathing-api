import { ApiProperty } from '@nestjs/swagger';

export class ResetPasswordDto {
  @ApiProperty({
    description: '아이디',
    example: 'id123',
  })
  id: string;

  @ApiProperty({
    description: '새로운 비밀번호',
    example: 'newPassword123!',
  })
  newPassword: string;
}
