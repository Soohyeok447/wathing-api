import { forwardRef, Module } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { MessagesResolver } from './messages.resolver';
import { UsersModule } from '../users/users.module';
import { RoomsModule } from '../rooms/rooms.module';
import { DatabaseModule } from '../data/database.module';
import { FilesModule } from '../files/files.module';
import { EmojiModule } from '../emoji/emoji.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    forwardRef(() => UsersModule),
    forwardRef(() => RoomsModule),
    DatabaseModule,
    FilesModule,
    EmojiModule,
    NotificationsModule,
  ],
  providers: [MessagesService, MessagesResolver],
  exports: [MessagesService],
})
export class MessagesModule {}
