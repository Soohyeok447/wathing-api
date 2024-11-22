import { forwardRef, Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { DatabaseModule } from '../data/database.module';
import { UsersResolver } from './users.resolver';
import { FilesService } from '../files/files.service';
import { StoryService } from '../stories/story.service';
import { NotificationsModule } from '../notifications/notifications.module';
import { RoomsModule } from '../rooms/rooms.module';

@Module({
  imports: [DatabaseModule, NotificationsModule, forwardRef(() => RoomsModule)],
  providers: [UsersService, UsersResolver, FilesService, StoryService],
  exports: [UsersService],
})
export class UsersModule {}
