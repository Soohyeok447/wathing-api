import { Module } from '@nestjs/common';
import { GraphQLModule as NestGraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { join } from 'path';

@Module({
  imports: [
    NestGraphQLModule.forRoot<ApolloDriverConfig>({
      autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
      driver: ApolloDriver,
      debug: true,
      playground: true,
      introspection: true,
      installSubscriptionHandlers: true,
      subscriptions: {
        'graphql-ws': true,
      },
      context: ({ req, connectionParams, extra }) => {
        if (req) {
          // HTTP 요청인 경우
          return { req };
        } else if (extra && extra.connectionParams) {
          // WebSocket 요청인 경우 (`graphql-ws` 사용 시)
          return { req: { headers: extra.connectionParams } };
        } else if (connectionParams) {
          // 구 버전 WebSocket 요청인 경우 (`subscriptions-transport-ws` 사용 시)
          return { req: { headers: connectionParams } };
        }
      },
    }),
  ],
  exports: [NestGraphQLModule],
})
export class GraphQLModule {}
