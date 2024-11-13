import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './data/database.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { TerminusModule } from '@nestjs/terminus';
import { HealthController } from './health.controller';
import { HttpModule } from '@nestjs/axios';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { join } from 'path';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath:
        process.env.NODE_ENV === 'development' ? `.env.development` : undefined,
      ignoreEnvFile: process.env.NODE_ENV !== 'development',
    }),
    DatabaseModule,
    GraphQLModule.forRoot<ApolloDriverConfig>({
      // formatError: (error) => {
      //   const graphQLFormattedError = {
      //     message: error.message,
      //     statusCode: error.extensions?.originalError['statusCode'],
      //     error: error.extensions?.originalError['error'],
      //     path: error.path,
      //   };
      //   return graphQLFormattedError;
      // },
      autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
      driver: ApolloDriver,
      debug: true,
      playground: true,
    }),
    AuthModule,
    UsersModule,
    HttpModule,
    TerminusModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
