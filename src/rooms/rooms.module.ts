import { Module } from '@nestjs/common';
import { RoomsService } from './rooms.service';
import { RoomsResolver } from './rooms.resolver';
import { DatabaseModule } from '../data/database.module';
import { EmojiModule } from '../emoji/emoji.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { MessagesModule } from '../messages/messages.module';

@Module({
  imports: [DatabaseModule, EmojiModule, NotificationsModule, MessagesModule],
  providers: [RoomsService, RoomsResolver],
  exports: [RoomsService],
})
export class RoomsModule {}
