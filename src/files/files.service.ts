import {
  Inject,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as AWS from 'aws-sdk';
import { resizeImage } from '../utils/image_resizer';
import { v4 } from 'uuid';
import { files, NewFile } from '../data/schema';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from './../data/schema';

@Injectable()
export class FilesService {
  private s3: AWS.S3;

  constructor(
    private configService: ConfigService,
    @Inject('DRIZZLE') private readonly db: NodePgDatabase<typeof schema>,
  ) {
    this.s3 = new AWS.S3({
      accessKeyId: this.configService.get<string>('AWS_ACCESS_KEY_ID'),
      secretAccessKey: this.configService.get<string>('AWS_SECRET_ACCESS_KEY'),
      region: this.configService.get<string>('AWS_REGION'),
    });
  }

  async uploadFile(file: Express.Multer.File, dir: string): Promise<string> {
    const resizedBuffer = await resizeImage(file.buffer, 800);

    const fileName = `${dir}/${v4()}`;

    const params = {
      Bucket: this.configService.get<string>('AWS_S3_BUCKET_NAME'),
      Key: fileName,
      Body: resizedBuffer,
      ContentType: file.mimetype,
    };

    await this.s3.upload(params).promise();

    const newFile: NewFile = {
      name: file.originalname,
      type: file.mimetype,
      size: file.size,
      metadata: {},
      key: fileName,
    };

    const [result] = await this.db
      .insert(files)
      .values(newFile)
      .returning({ id: files.id });

    return result.id;
  }
}
