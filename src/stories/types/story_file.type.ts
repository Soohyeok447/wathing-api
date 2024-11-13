import { ObjectType, Field, Int } from '@nestjs/graphql';
import { File } from '../../files/file.type';

@ObjectType({ description: '스토리의 파일 순서' })
export class StoryFile {
  @Field(() => File, { description: '스토리에 포함된 파일' }) // `fileId` 대신 `file`만 유지
  file: File;

  @Field(() => Int, { description: '파일의 순서' })
  order: number;
}
