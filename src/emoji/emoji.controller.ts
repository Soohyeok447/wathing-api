import {
  Controller,
  Get,
  Post,
  UploadedFile,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { EmojiService } from './emoji.service';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../core/guards/jwt.guard';
import { File } from '../data/schema';

@Controller('emoji')
export class EmojiController {
  constructor(private readonly emojiService: EmojiService) {}

  @Post('upload')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 50 * 1024 * 1024 },
    }),
  )
  async uploadEmoji(@UploadedFile() file: Express.Multer.File): Promise<File> {
    return await this.emojiService.uploadEmoji(file);
  }

  @Post('upload/multiple')
  @UseInterceptors(FilesInterceptor('files'))
  async uploadEmojis(@UploadedFiles() files: Express.Multer.File[]) {
    return await this.emojiService.uploadEmojis(files);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  async getEmojiKeys() {
    return await this.emojiService.getEmojiKeys();
  }
}
