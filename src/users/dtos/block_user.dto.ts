import { InputType, Field, ID } from '@nestjs/graphql';

@InputType()
export class BlockUserInput {
  @Field(() => ID, { description: '차단할 사용자 ID' })
  targetUserId: string;
}
