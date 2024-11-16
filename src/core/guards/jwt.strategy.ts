import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../../users/users.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private readonly usersService: UsersService,
  ) {
    super({
      jwtFromRequest: (req) => {
        let token = null;

        if (req.headers && req.headers.authorization) {
          // HTTP 요청에서 토큰 추출
          token = req.headers.authorization;
        } else if (req.authorization) {
          // WebSocket 요청에서 토큰 추출 (connectionParams에 포함된 경우)
          token = req.authorization;
        } else if (req.headers && req.headers.Authorization) {
          // 대문자로 전달되는 경우
          token = req.headers.Authorization;
        }

        if (token && token.startsWith('Bearer ')) {
          return token.slice(7);
        }

        return token;
      },
      // ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: configService.get<string>('JWT_SECRET'),
      ignoreExpiration: false,
    });
  }

  async validate(payload: any) {
    const user = await this.usersService.findById(payload.sub);

    if (!user) {
      throw new UnauthorizedException('사용자를 찾을 수 없습니다.');
    }

    return user;
  }
}
