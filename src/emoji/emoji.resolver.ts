import { Resolver, Query } from '@nestjs/graphql';
import { EmojiService } from './emoji.service';
import { UseGuards } from '@nestjs/common';
import { GqlAuthGuard } from '../core/guards/gql.guard';
import { Emoji } from './emoji.type';

@Resolver(() => Emoji)
export class EmojiResolver {
  constructor(private readonly emojiService: EmojiService) {}

  @Query(() => [Emoji], { description: '모든 이모지 키를 가져옵니다.' })
  @UseGuards(GqlAuthGuard)
  async getEmojis(): Promise<Emoji[]> {
    return this.emojiService.getEmojis();
  }
}
