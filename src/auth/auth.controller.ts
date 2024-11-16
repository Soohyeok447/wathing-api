import {
  Controller,
  Post,
  Req,
  Body,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { JsonWebTokenError, TokenExpiredError } from '@nestjs/jwt';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiOkResponse,
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
  @ApiOperation({
    summary: '유저 로그인',
    description: '유저가 로그인을 통해 액세스 및 리프레시 토큰을 발급받습니다.',
  })
  @ApiOkResponse({
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
}
