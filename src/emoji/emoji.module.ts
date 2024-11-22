import { Module } from '@nestjs/common';
import { EmojiService } from './emoji.service';
import { FilesModule } from '../files/files.module';
import { DatabaseModule } from '../data/database.module';
import { EmojiController } from './emoji.controller';

@Module({
  imports: [DatabaseModule, FilesModule],
  providers: [EmojiService],
  controllers: [EmojiController],
})
export class EmojiModule {}
