import { InputType, Field, ID } from '@nestjs/graphql';
import { FileOrderInput } from './file_order_input.dto';

@InputType({ description: '스토리 업데이트에 필요한 입력 데이터' })
export class UpdateStoryDto {
  @Field(() => ID, { description: '스토리 ID' })
  id: string;

  @Field({ nullable: true, description: '스토리의 내용' })
  content?: string;

  @Field(() => [FileOrderInput], {
    nullable: true,
    description: '스토리에 포함될 파일과 순서 목록',
  })
  files?: FileOrderInput[];
}
