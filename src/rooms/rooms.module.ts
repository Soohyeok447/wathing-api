import { Module } from '@nestjs/common';
import { RoomsService } from './rooms.service';
import { RoomsResolver } from './rooms.resolver';
import { UsersModule } from '../users/users.module';
import { DatabaseModule } from '../data/database.module';
import { MessagesService } from '../messages/messages.service';

@Module({
  imports: [UsersModule, DatabaseModule],
  providers: [RoomsService, RoomsResolver, MessagesService],
  exports: [RoomsService],
})
export class RoomsModule {}
