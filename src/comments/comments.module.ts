import { Module } from '@nestjs/common';
import { CommentsService } from './comments.service';
import { CommentsResolver } from './comments.resolver';
import { UsersModule } from '../users/users.module';
import { DatabaseModule } from '../data/database.module';
import { EmojiService } from '../emoji/emoji.service';

@Module({
  imports: [UsersModule, DatabaseModule],
  providers: [CommentsService, CommentsResolver, EmojiService],
  exports: [CommentsService],
})
export class CommentsModule {}
