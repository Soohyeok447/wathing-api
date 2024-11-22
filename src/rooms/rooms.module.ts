import { Module } from '@nestjs/common';
import { RoomsService } from './rooms.service';
import { RoomsResolver } from './rooms.resolver';
import { UsersModule } from '../users/users.module';
import { DatabaseModule } from '../data/database.module';
import { MessagesService } from '../messages/messages.service';
import { EmojiModule } from '../emoji/emoji.module';

@Module({
  imports: [UsersModule, DatabaseModule, RoomsModule, EmojiModule],
  providers: [RoomsService, MessagesService],
  exports: [RoomsService],
})
export class RoomsModule {}
