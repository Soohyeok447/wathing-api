import { InputType, Field, ID } from '@nestjs/graphql';

@InputType()
export class BlockStoryInput {
  @Field(() => ID, { description: '차단할 스토리 ID' })
  storyId: string;
}
