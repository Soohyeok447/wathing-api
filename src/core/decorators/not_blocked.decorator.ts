import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { UsersService } from '../../users/users.service';
import { User } from '../../data/schema';

@Injectable()
export class NotBlockedGuard implements CanActivate {
  constructor(private readonly usersService: UsersService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const ctx = GqlExecutionContext.create(context);

    const currentUser: User = ctx.getContext().req.user;

    if (!currentUser) {
      throw new ForbiddenException('인증되지 않은 사용자입니다.');
    }

    const isBlocked = await this.usersService.isUserBlocked(currentUser.id);

    if (isBlocked) {
      throw new ForbiddenException('차단된 사용자입니다.');
    }

    return true;
  }
}
