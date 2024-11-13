import { ObjectType, Field, ID } from '@nestjs/graphql';

@ObjectType({ description: '파일 엔티티' })
export class File {
  @Field(() => ID, { description: '파일 ID' })
  id: string;

  @Field({ description: '파일사이즈' })
  size: number;

  @Field({ description: '파일의 MIME 타입' })
  type: string;

  @Field({ description: '파일의 storage 키' })
  key: string;

  @Field({ description: '파일 업로드 일자' })
  createdAt: Date;
}
