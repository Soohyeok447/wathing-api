import { Field, ID, InputType } from '@nestjs/graphql';

@InputType({ description: '파일 ID와 순서를 나타내는 입력 데이터' })
export class FileOrderInput {
  @Field(() => ID, { description: '파일 ID' })
  fileId: string;

  @Field({ description: '파일의 순서' })
  order: number;
}
