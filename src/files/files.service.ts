import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as AWS from 'aws-sdk';
import { resizeImage } from '../utils/image';
import { v4 } from 'uuid';
import { files, NewFile } from '../data/schema';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from './../data/schema';
import { eq, inArray } from 'drizzle-orm';

@Injectable()
export class FilesService {
  private s3: AWS.S3;
  private s3Bucket: string;

  constructor(
    private readonly configService: ConfigService,
    @Inject('DRIZZLE') private readonly db: NodePgDatabase<typeof schema>,
  ) {
    this.s3 = new AWS.S3({
      accessKeyId: this.configService.get<string>('AWS_ACCESS_KEY'),
      secretAccessKey: this.configService.get<string>('AWS_SECRET_KEY'),
      region: this.configService.get<string>('AWS_REGION'),
    });
    this.s3Bucket = this.configService.get<string>('S3_BUCKET_NAME');
  }

  async uploadFile(
    file: Express.Multer.File,
    dir: string,
  ): Promise<schema.File> {
    if (!file) {
      throw new BadRequestException('파일이 제공되지 않았습니다.');
    }

    if (!dir) {
      throw new BadRequestException('dir는 필수 입력 사항입니다.');
    }

    if (dir !== 'profile' && dir !== 'story') {
      throw new BadRequestException('dir는 profile 또는 story여야 합니다.');
    }

    const isImage = file.mimetype.startsWith('image/');
    const isVideo = file.mimetype.startsWith('video/');

    if (!isImage && !isVideo) {
      throw new BadRequestException('지원하지 않는 파일 형식입니다.');
    }

    const fileBuffer = isImage
      ? await resizeImage(file.buffer, 800)
      : file.buffer;

    const fileName = `${dir}/${v4()}`;

    const params = {
      Bucket: this.s3Bucket,
      Key: fileName,
      Body: fileBuffer,
      ContentType: file.mimetype,
    };

    await this.s3.upload(params).promise();

    const newFile: NewFile = {
      type: file.mimetype,
      size: file.size,
      key: fileName,
    };

    const [result] = await this.db.insert(files).values(newFile).returning();

    return result;
  }

  async readFile(id: string): Promise<schema.File> {
    const [file] = await this.db.select().from(files).where(eq(files.id, id));

    if (!file) {
      throw new NotFoundException('파일을 찾을 수 없습니다.');
    }

    return file;
  }

  async findFilesByIds(fileIds: string[]): Promise<schema.File[]> {
    const filesList = await this.db
      .select()
      .from(files)
      .where(inArray(files.id, fileIds));

    return filesList;
  }

  async deleteFile(id: string): Promise<void> {
    const [file] = await this.db.select().from(files).where(eq(files.id, id));

    if (!file) {
      throw new NotFoundException('파일을 찾을 수 없습니다.');
    }

    const { key } = file;

    const params = {
      Bucket: this.s3Bucket,
      Key: key,
    };

    await this.s3.deleteObject(params).promise();

    await this.db.delete(files).where(eq(files.id, id));
  }
}
