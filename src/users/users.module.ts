import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { DatabaseModule } from '../data/database.module';
import { UsersResolver } from './users.resolver';
import { FilesService } from '../files/files.service';

@Module({
  imports: [DatabaseModule],
  providers: [UsersService, UsersResolver, FilesService],
  controllers: [],
  exports: [UsersService],
})
export class UsersModule {}
