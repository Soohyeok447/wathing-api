import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { User, users } from '../data/schema';
import * as schema from '../data/schema';
import { eq } from 'drizzle-orm';
import { isDateString, isEmptyString } from '../utils/type_gurad';
import { UpdateUserDto } from './dtos/update_user.dto';

@Injectable()
export class UsersService {
  constructor(
    @Inject('DRIZZLE') private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  async findById(id: string): Promise<User | undefined> {
    const [result] = await this.db.select().from(users).where(eq(users.id, id));

    return result;
  }

  async updateUser(updateUserDto: UpdateUserDto) {
    const { id, name, birthday, statusMessage, profileImageId } = updateUserDto;

    if (!id) {
      throw new BadRequestException('id는 필수 입력 사항입니다.');
    }

    if ((name && isEmptyString(name)) || name.length < 2 || name.length > 12) {
      throw new BadRequestException(
        'name은 2자 이상 12자 이하의 문자열이어야 합니다.',
      );
    }

    if (statusMessage && statusMessage.length > 30) {
      throw new BadRequestException('statusMessage는 30자 이하이어야 합니다.');
    }

    if (birthday && !isDateString(birthday)) {
      throw new BadRequestException('birthday는 yyyy-mm-dd 형식이어야 합니다.');
    }

    const updateData: Partial<User> = {
      name,
      birthday,
      statusMessage,
      profileImageId,
      updatedAt: new Date(),
    };

    const [user] = await this.db
      .update(users)
      .set(updateData)
      .where(eq(users.id, id))
      .returning();

    return user;
  }
}
