import {
  Controller,
  Post,
  Req,
  UseGuards,
  Body,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt.guard';
import { JsonWebTokenError, TokenExpiredError } from '@nestjs/jwt';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('signup')
  async signUp(@Body() body) {
    const { id, password, name, birthday, profileImageId } = body;

    const { accessToken, refreshToken } = await this.authService.signup(
      id,
      password,
      name,
      birthday,
      profileImageId,
    );

    return { accessToken, refreshToken };
  }

  @Post('signin')
  async signin(@Body() body) {
    const { id, password } = body;

    return this.authService.signin(id, password);
  }

  @Post('refresh')
  async refreshToken(@Req() req: Request) {
    const authHeader = req.headers['authorization'];

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Bearer 토큰이 필요합니다.');
    }

    const refreshToken = authHeader.split(' ')[1];

    try {
      return await this.authService.refresh(refreshToken);
    } catch (error) {
      if (error instanceof TokenExpiredError) {
        throw new UnauthorizedException('토큰이 만료되었습니다.');
      } else if (error instanceof JsonWebTokenError) {
        throw new UnauthorizedException('유효하지 않은 토큰입니다.');
      } else {
        throw new BadRequestException('토큰 갱신 중 오류가 발생했습니다.');
      }
    }
  }

  @UseGuards(JwtAuthGuard)
  @Post('protected')
  getProtectedResource(@Req() req) {
    return { userId: req.user.userId };
  }
}
