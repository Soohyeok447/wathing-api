import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext) => {
    const ctx = GqlExecutionContext.create(context);

    const { req } = ctx.getContext();

    if (req && req.user) {
      return req.user;
    }

    const { user } = ctx.getContext();

    if (user) {
      return user;
    }

    return null;
  },
);
