import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  Body,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { FilesService } from './files.service';
import { JwtAuthGuard } from '../auth/jwt.guard';

@Controller('files')
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Post('upload')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body('dir') dir: string,
  ): Promise<{ id: string }> {
    return {
      id: await this.filesService.uploadFile(file, dir),
    };
  }

  @Post('read')
  @UseGuards(JwtAuthGuard)
  async readFile(@Body('id') id): Promise<{ cdn: string }> {
    const url = await this.filesService.readFile(id);

    return { cdn: url };
  }
}
