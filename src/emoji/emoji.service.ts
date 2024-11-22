import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as AWS from 'aws-sdk';
import { files, NewFile } from '../data/schema';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../data/schema';
import { eq, inArray, like } from 'drizzle-orm';

@Injectable()
export class EmojiService {
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

  async uploadEmoji(file: Express.Multer.File): Promise<schema.File> {
    if (!file) {
      throw new BadRequestException('파일이 제공되지 않았습니다.');
    }

    const fileName = `emoji/${file.originalname}`;

    const params = {
      Bucket: this.s3Bucket,
      Key: fileName,
      Body: file.buffer,
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

  async uploadEmojis(
    uploadedFiles: Express.Multer.File[],
  ): Promise<schema.File[]> {
    if (!uploadedFiles || uploadedFiles.length === 0) {
      throw new BadRequestException('업로드할 파일이 제공되지 않았습니다.');
    }

    const uploadPromises = uploadedFiles.map(async (file) => {
      const fileName = `emoji/${file.originalname}`;

      const params = {
        Bucket: this.s3Bucket,
        Key: fileName,
        Body: file.buffer,
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
    });

    const results = await Promise.all(uploadPromises);

    return results;
  }

  async getEmojiKeys(): Promise<string[]> {
    const emojiFiles = await this.db
      .select({ key: files.key })
      .from(files)
      .where(like(files.key, 'emoji/%'));

    const sortedEmojiKeys = emojiFiles
      .map(({ key }) => {
        const match = key.match(/^emoji\/(\d+)\.png$/);
        if (match) {
          return { key, id: parseInt(match[1], 10) };
        }
        return null;
      })
      .filter((item) => item !== null)
      .sort((a, b) => a.id - b.id)
      .map((item) => item.key);

    return sortedEmojiKeys;
  }
}
