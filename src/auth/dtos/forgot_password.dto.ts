import { ApiProperty } from '@nestjs/swagger';

export class FotgotPasswordDto {
  @ApiProperty({ description: '아이디', example: 'testId' })
  id: string;

  @ApiProperty({ description: '이메일', example: 'example@example.com' })
  email: string;
}
