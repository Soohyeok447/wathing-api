import { Module } from '@nestjs/common';
import { FilesService } from './files.service';
import { ConfigModule } from '@nestjs/config';
import { MulterModule } from '@nestjs/platform-express';
import * as multer from 'multer';
import { DatabaseModule } from '../data/database.module';
import { FilesController } from './files.controller';

@Module({
  imports: [
    ConfigModule,
    DatabaseModule,
    MulterModule.register({
      storage: multer.memoryStorage(),
    }),
  ],
  providers: [FilesService],
  controllers: [FilesController],
  exports: [FilesService],
})
export class FilesModule {}
