import { ObjectType, Field, ID, Int } from '@nestjs/graphql';
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

  @Field(() => Int, { nullable: true, description: '댓글 개수' })
  commentsCount?: number;

  @Field(() => Int, { nullable: true, description: '좋아요 개수' })
  likesCount?: number;

  @Field(() => Boolean, {
    nullable: true,
    description: '현재 사용자가 스토리에 좋아요를 했는지 여부',
  })
  hasLiked?: boolean;

  @Field({ description: '스토리 생성일자' })
  createdAt: Date;

  @Field({ nullable: true, description: '스토리 수정일자' })
  updatedAt?: Date;
}
