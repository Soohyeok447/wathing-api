import { ObjectType, Field, ID } from '@nestjs/graphql';
import { StoryFile } from './story_file.type';

@ObjectType({ description: '스토리 엔티티' })
export class Story {
  @Field(() => ID, { description: '스토리 ID' })
  id: string;

  @Field({ nullable: true, description: '스토리를 작성한 사용자' })
  userId?: string;

  @Field({ description: '스토리 내용' })
  content: string;

  @Field(() => [StoryFile], {
    nullable: true,
    description: '스토리에 포함된 파일 목록',
  })
  files?: StoryFile[];

  @Field({ description: '스토리 생성일자' })
  createdAt: Date;

  @Field({ nullable: true, description: '스토리 수정일자' })
  updatedAt?: Date;
}
