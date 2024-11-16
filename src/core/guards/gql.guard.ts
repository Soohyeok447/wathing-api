import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { GqlExecutionContext } from '@nestjs/graphql';

@Injectable()
export class GqlAuthGuard extends AuthGuard('jwt') {
  getRequest(context: ExecutionContext) {
    const ctx = GqlExecutionContext.create(context);

    const { req, extra } = ctx.getContext();

    // HTTP 요청인 경우
    if (req) return req;

    // WebSocket 요청인 경우 (graphql-ws 프로토콜)
    if (extra && extra.connectionParams) {
      return { headers: extra.connectionParams };
    }

    return ctx.getContext().req;
  }
}
