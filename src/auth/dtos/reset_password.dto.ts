import { ApiProperty } from '@nestjs/swagger';

export class ResetPasswordWithTokenDto {
  @ApiProperty({ description: '비밀번호 재설정 토큰', example: 'ey...' })
  token: string;

  @ApiProperty({ description: '새로운 비밀번호', example: 'newPassword123!' })
  newPassword: string;
}
