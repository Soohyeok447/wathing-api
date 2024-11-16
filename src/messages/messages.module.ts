import { Module } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { MessagesResolver } from './messages.resolver';
import { UsersModule } from '../users/users.module';
import { RoomsModule } from '../rooms/rooms.module';
import { DatabaseModule } from '../data/database.module';

@Module({
  imports: [UsersModule, RoomsModule, DatabaseModule],
  providers: [MessagesService, MessagesResolver],
})
export class MessagesModule {}
