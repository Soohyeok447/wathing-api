import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  Inject,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';
import { credentials, users } from '../data/schema';
import { NewCredential } from '../data/schema';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from './../data/schema';
import { isEmptyString, isDateString } from '../utils/type_gurad';
import { eq } from 'drizzle-orm';
import { FilesService } from '../files/files.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly filesService: FilesService,
    @Inject('DRIZZLE') private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  async signup(
    id: string,
    password: string,
    name: string,
    birthday: string,
    profileImageId?: string,
  ): Promise<{
    accessToken: string;
    refreshToken: string;
  }> {
    if (!id) {
      throw new BadRequestException('id는 필수 입력 사항입니다.');
    }

    if (!password) {
      throw new BadRequestException('password는 필수 입력 사항입니다.');
    }

    if (!name) {
      throw new BadRequestException('name은 필수 입력 사항입니다.');
    }

    if (!birthday) {
      throw new BadRequestException('birthday는 필수 입력 사항입니다.');
    }

    if (isEmptyString(name) || name.length < 2 || name.length > 12) {
      throw new BadRequestException(
        'name은 2자 이상 12자 이하의 문자열이어야 합니다.',
      );
    }

    if (!isDateString(birthday)) {
      throw new BadRequestException('birthday는 yyyy-mm-dd 형식이어야 합니다.');
    }

    if (profileImageId) {
      const file = await this.filesService.readFile(profileImageId);

      if (!file) {
        throw new NotFoundException('유효하지 않은 프로필 이미지 ID입니다.');
      }
    }

    const [existing] = await this.db
      .select()
      .from(credentials)
      .where(eq(credentials.id, id));

    if (existing) {
      throw new ConflictException('이미 가입된 사용자입니다.');
    }

    const saltRounds = parseInt(this.configService.get<string>('SALT_ROUNDS'));

    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // 트랜잭션
    const userId = await this.db.transaction(async (tx) => {
      const newUser = {
        name,
        birthday,
        profileImageId,
      };

      const [result] = await tx
        .insert(users)
        .values(newUser)
        .returning({ id: users.id });

      const newCredential: NewCredential = {
        userId: result.id,
        id: id,
        password: hashedPassword,
        refreshToken: '',
      };

      await tx.insert(credentials).values(newCredential);

      return result.id;
    });

    const accessToken = await this.createAccessToken(userId);
    const refreshToken = this.createRefreshToken(userId);

    await this.db
      .update(credentials)
      .set({ refreshToken })
      .where(eq(credentials.userId, userId));

    return { accessToken, refreshToken };
  }

  async signin(
    id: string,
    password: string,
  ): Promise<{
    accessToken: string;
    refreshToken: string;
  }> {
    if (!id) {
      throw new BadRequestException('ID는 필수 입력 사항입니다.');
    }

    if (!password) {
      throw new BadRequestException('비밀번호는 필수 입력 사항입니다.');
    }

    const [credential] = await this.db
      .select()
      .from(credentials)
      .where(eq(credentials.id, id));

    if (!credential || !(await bcrypt.compare(password, credential.password))) {
      throw new UnauthorizedException(
        '아이디 또는 비밀번호가 올바르지 않습니다.',
      );
    }

    const accessToken = await this.createAccessToken(credential.userId);
    const refreshToken = this.createRefreshToken(credential.userId);

    await this.db
      .update(credentials)
      .set({ refreshToken })
      .where(eq(credentials.userId, credential.userId));

    return { accessToken, refreshToken };
  }

  async refresh(refreshToken: string): Promise<{
    accessToken: string;
  }> {
    const payload = this.jwtService.verify(refreshToken, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
    });

    const accessToken = this.jwtService.sign({ sub: payload.sub });

    return {
      accessToken,
    };
  }

  private async createAccessToken(userId: string): Promise<string> {
    const [user] = await this.db
      .select({
        name: schema.users.name,
        profileImageKey: schema.files.key,
      })
      .from(schema.users)
      .leftJoin(schema.files, eq(schema.users.profileImageId, schema.files.id))
      .where(eq(schema.users.id, userId));

    const payload = {
      sub: userId,
      name: user.name,
      profileImageKey: user.profileImageKey || null,
    };

    return this.jwtService.sign(payload);
  }

  private createRefreshToken(userId: string): string {
    const payload = { sub: userId };

    return this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRES_IN'),
    });
  }

  async verifyPassword(id: string, password: string): Promise<boolean> {
    const [credential] = await this.db
      .select()
      .from(credentials)
      .where(eq(credentials.id, id));

    if (!credential) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }

    const isMatch = await bcrypt.compare(password, credential.password);

    return isMatch;
  }

  async resetPassword(
    id: string,
    newPassword: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    if (!newPassword) {
      throw new BadRequestException('새 비밀번호는 필수 입력 사항입니다.');
    }

    const saltRounds = parseInt(this.configService.get<string>('SALT_ROUNDS'));
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    await this.db
      .update(credentials)
      .set({ password: hashedPassword })
      .where(eq(credentials.id, id));

    const accessToken = await this.createAccessToken(id);
    const refreshToken = this.createRefreshToken(id);

    await this.db
      .update(credentials)
      .set({ refreshToken })
      .where(eq(credentials.userId, id));

    return { accessToken, refreshToken };
  }
}
