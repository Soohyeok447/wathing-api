import { Module } from '@nestjs/common';
import { EmojiService } from './emoji.service';
import { EmojiResolver } from './emoji.resolver';
import { FilesModule } from '../files/files.module';
import { DatabaseModule } from '../data/database.module';
import { EmojiController } from './emoji.controller';

@Module({
  imports: [DatabaseModule, FilesModule],
  providers: [EmojiService, EmojiResolver],
  controllers: [EmojiController],
})
export class EmojiModule {}
