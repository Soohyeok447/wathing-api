import {
  Controller,
  Post,
  Req,
  Body,
  UnauthorizedException,
  BadRequestException,
  HttpCode,
  UseGuards,
  Query,
  Res,
  Get,
  Header,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { JsonWebTokenError, TokenExpiredError } from '@nestjs/jwt';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiExcludeEndpoint,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { SignUpDto } from './dtos/signup.dto';
import { SignInDto } from './dtos/signin.dto';
import {
  AccessTokenResponseDto,
  AuthResponseDto,
} from './dtos/auth_response.dto';
import { JwtAuthGuard } from '../core/guards/jwt.guard';
import { VerifyPasswordDto } from './dtos/verify_password.dto';
import { FotgotPasswordDto } from './dtos/forgot_password.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('signup')
  @ApiOperation({
    summary: '유저 회원가입',
    description:
      '유저가 회원가입을 통해 액세스 및 리프레시 토큰을 발급받습니다.',
  })
  @ApiCreatedResponse({
    description: '성공적으로 회원가입 완료',
    type: AuthResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: '입력 데이터가 잘못됨',
  })
  @ApiResponse({
    status: 404,
    description: '프로필 이미지 Id가 잘못됨',
  })
  @ApiResponse({
    status: 409,
    description: '이미 가입된 사용자',
  })
  async signUp(@Body() body: SignUpDto) {
    const { id, password, name, email, birthday, profileImageId } = body;

    const { accessToken, refreshToken } = await this.authService.signup(
      id,
      password,
      name,
      email,
      birthday,
      profileImageId,
    );

    return { accessToken, refreshToken };
  }

  @Post('signin')
  @HttpCode(200)
  @ApiOperation({
    summary: '유저 로그인',
    description: '유저가 로그인을 통해 액세스 및 리프레시 토큰을 발급받습니다.',
  })
  @ApiResponse({
    status: 200,
    description: '성공적으로 로그인 완료',
    type: AuthResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'ID 또는 비밀번호가 잘못됨',
  })
  @ApiUnauthorizedResponse({
    description: '아이디 또는 비밀번호가 올바르지 않음',
  })
  async signin(@Body() body: SignInDto): Promise<AuthResponseDto> {
    const { id, password } = body;

    return this.authService.signin(id, password);
  }

  @Post('refresh')
  @HttpCode(201)
  @ApiOperation({
    summary: 'JWT 재발급',
    description: '만료된 JWT 액세스 토큰을 새로 발급받습니다.',
  })
  @ApiResponse({
    status: 200,
    description: 'JWT 재발급 성공',
    type: AccessTokenResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: '유효하지 않거나 만료된 리프레시 토큰',
  })
  @ApiResponse({
    status: 400,
    description: '리프레시 토큰 갱신 오류',
  })
  async refreshToken(@Req() req) {
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

  @Post('password/verify')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: '비밀번호 확인',
    description: '사용자의 현재 비밀번호가 올바른지 확인합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '비밀번호 확인 성공',
  })
  @ApiBadRequestResponse({
    description: '입력 데이터가 잘못되었거나 비밀번호가 올바르지 않음',
  })
  async verifyPassword(
    @Body() body: VerifyPasswordDto,
  ): Promise<{ success: boolean }> {
    const { id, password } = body;

    const isMatch = await this.authService.verifyPassword(id, password);

    if (!isMatch) {
      throw new BadRequestException('비밀번호가 올바르지 않습니다.');
    }

    return { success: true };
  }

  @Post('password/forgot')
  @HttpCode(200)
  @ApiOperation({
    summary: '비밀번호 재설정 이메일 요청',
    description:
      'id와 email을 제공하면 비밀번호 재설정 링크를 이메일로 전송합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '비밀번호 재설정 이메일 전송 성공',
  })
  @ApiBadRequestResponse({
    description: '입력 데이터가 잘못되었거나 사용자를 찾을 수 없음',
  })
  async forgotPassword(@Body() body: FotgotPasswordDto) {
    const { id, email } = body;

    await this.authService.forgotPassword(id, email);

    return { message: '비밀번호 재설정 이메일을 전송했습니다.' };
  }

  @Get('password/reset')
  @ApiExcludeEndpoint()
  async showResetForm(@Query('token') token: string): Promise<string> {
    const userId = await this.authService.validatePasswordResetToken(token);

    if (!userId) {
      return `<h1>유효하지 않거나 만료된 토큰입니다.</h1>`;
    }

    const formHtml = `
    <html>
      <head>
        <meta charset="UTF-8">
        <link rel="stylesheet" href="https://unpkg.com/mvp.css">
      </head>
      <body>
        <h1>비밀번호 재설정</h1>
        <form method="POST" action="/api/auth/password/reset">
          <input type="hidden" name="token" value="${token}" />
          <p>새 비밀번호: <input type="password" name="newPassword" required /></p>
          <p>비밀번호 확인: <input type="password" name="confirmPassword" required /></p>
          <button type="submit">재설정</button>
        </form>
      </body>
    </html>
    `;
    return formHtml;
  }

  @Post('password/reset')
  @ApiExcludeEndpoint()
  @Header('Content-Type', 'text/html; charset=utf-8')
  handleResetForm(@Body() body: any) {
    const { token, newPassword, confirmPassword } = body;

    if (!token) {
      return '<h3>토큰이 없습니다.</h3>';
    }

    if (!newPassword || !confirmPassword) {
      return '<h3>필수 항목이 누락되었습니다.</h3>';
    }

    if (newPassword !== confirmPassword) {
      return '<h3>비밀번호가 일치하지 않습니다.</h3>';
    }

    this.authService.resetPasswordWithToken(token, newPassword);

    return '<h3>비밀번호가 성공적으로 재설정되었습니다. 이 화면을 끄셔도 됩니다.</h3>';
  }
}
