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
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('Files')
@ApiBearerAuth()
@Controller('files')
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Post('upload')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: '파일 하나 업로드' })
  @ApiConsumes('multipart/form-data')
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
  @ApiOperation({ summary: '파일 읽고 cdn url을 반환' })
  async readFile(@Body('id') id): Promise<{ cdn: string }> {
    const url = await this.filesService.readFile(id);

    return { cdn: url };
  }
}
