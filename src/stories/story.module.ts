import { Module } from '@nestjs/common';
import { StoryResolver } from './story.resolver';
import { StoryService } from './story.service';
import { UsersModule } from '../users/users.module';
import { FilesModule } from '../files/files.module';
import { DatabaseModule } from '../data/database.module';
import { CommentsModule } from '../comments/comments.module';

@Module({
  imports: [DatabaseModule, UsersModule, FilesModule, CommentsModule],
  providers: [StoryResolver, StoryService],
  exports: [StoryService],
})
export class StoryModule {}
