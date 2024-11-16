import { Module } from '@nestjs/common';
import { RoomsService } from './rooms.service';
import { RoomsResolver } from './rooms.resolver';
import { UsersModule } from '../users/users.module';
import { DatabaseModule } from '../data/database.module';

@Module({
  imports: [UsersModule, DatabaseModule],
  providers: [RoomsService, RoomsResolver],
  exports: [RoomsService],
})
export class RoomsModule {}
