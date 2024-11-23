import { Module } from '@nestjs/common';
import { RoomsService } from './rooms.service';
import { RoomsResolver } from './rooms.resolver';
import { DatabaseModule } from '../data/database.module';
import { UsersService } from '../users/users.service';
import { FilesService } from '../files/files.service';
import { EmojiService } from '../emoji/emoji.service';
import { NotificationsService } from '../notifications/notifications.service';
import { MessagesService } from '../messages/messages.service';

@Module({
  imports: [DatabaseModule],
  providers: [
    RoomsService,
    RoomsResolver,
    UsersService,
    FilesService,
    EmojiService,
    NotificationsService,
    MessagesService,
  ],
  exports: [RoomsService],
})
export class RoomsModule {}
