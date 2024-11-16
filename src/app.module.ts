import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './data/database.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { TerminusModule } from '@nestjs/terminus';
import { HealthController } from './health.controller';
import { HttpModule } from '@nestjs/axios';
import { StoryModule } from './stories/story.module';
import { CommentsModule } from './comments/comments.module';
import { GraphQLModule } from './core/config/graphql.module';
import { MessagesModule } from './messages/messages.module';
import { RoomsModule } from './rooms/rooms.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath:
        process.env.NODE_ENV === 'development' ? `.env.development` : undefined,
      ignoreEnvFile: process.env.NODE_ENV !== 'development',
    }),
    DatabaseModule,
    GraphQLModule,
    AuthModule,
    UsersModule,
    StoryModule,
    CommentsModule,
    RoomsModule,
    MessagesModule,
    HttpModule,
    TerminusModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
