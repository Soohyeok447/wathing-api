import { Module } from '@nestjs/common';
import { StoryResolver } from './story.resolver';
import { StoryService } from './story.service';
import { UsersModule } from '../users/users.module';
import { FilesModule } from '../files/files.module';
import { DatabaseModule } from '../data/database.module';

@Module({
  imports: [DatabaseModule, UsersModule, FilesModule],
  providers: [StoryResolver, StoryService],
})
export class StoryModule {}
