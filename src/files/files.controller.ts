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
import { JwtAuthGuard } from '../core/guards/jwt.guard';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiCreatedResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { uuidExample } from '../common/swagger_example';
import { File } from '../data/schema';

@ApiTags('Files')
@ApiBearerAuth()
@Controller('files')
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Post('upload')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 50 * 1024 * 1024 },
    }),
  )
  @ApiOperation({
    summary: '파일 업로드',
    description: '이미지 또는 비디오 파일 업로드',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: '업로드할 이미지 또는 비디오 파일 (~50MB)',
        },
        dir: {
          type: 'string',
          description: '파일 저장 디렉토리 (profile, story 중 하나)',
          enum: ['profile', 'story'],
        },
      },
    },
  })
  @ApiCreatedResponse({
    description: '파일 업로드 성공',
    example: {
      id: uuidExample,
      type: 'image/jpeg',
      size: 369417,
      key: 'profile/0d4597af-43e4-432c-bca5-dd10829912e0',
      createdAt: '2024-11-10 23:54:38.803',
    },
  })
  @ApiBadRequestResponse({
    description:
      '유효하지 않은 디렉토리명, 파일이 제공되지 않음, 유효하지 않은 파일',
  })
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body('dir') dir: string,
  ): Promise<File> {
    return await this.filesService.uploadFile(file, dir);
  }
}
