import { ApiProperty } from '@nestjs/swagger';
import { uuidExample } from '../../common/swagger_example';

export class AuthResponseDto {
  @ApiProperty({ description: 'Access token', example: uuidExample })
  accessToken: string;

  @ApiProperty({ description: 'Refresh token', example: uuidExample })
  refreshToken: string;
}

export class AccessTokenResponseDto {
  @ApiProperty({ description: 'Access token', example: uuidExample })
  accessToken: string;
}
