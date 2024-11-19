import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { DatabaseModule } from '../data/database.module';
import { UsersResolver } from './users.resolver';
import { FilesService } from '../files/files.service';
import { StoryService } from '../stories/story.service';

@Module({
  imports: [DatabaseModule],
  providers: [UsersService, UsersResolver, FilesService, StoryService],
  exports: [UsersService],
})
export class UsersModule {}
