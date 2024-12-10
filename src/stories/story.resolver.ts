import {
  Resolver,
  Mutation,
  Args,
  Parent,
  ResolveField,
  Query,
  ID,
  Int,
} from '@nestjs/graphql';
import { StoryService } from './story.service';
import { Story } from './types/story.type';
import { CreateStoryDto } from './dtos/create_story.dto';
import { User, User as UserEntity } from '../users/user.type';
import { StoryFile } from './types/story_file.type';
import { UsersService } from '../users/users.service';
import { UpdateStoryDto } from './dtos/update_story.dto';
import { StoryConnection } from './types/story_connection.type';
import { CommentConnection } from '../comments/types/comment_connection.typs';
import { CommentsService } from '../comments/comments.service';
import { CurrentUser } from '../core/decorators/current_user.decorator';
import { GqlAuthGuard } from '../core/guards/gql.guard';
import { UseGuards } from '@nestjs/common';
import { BlockStoryInput } from './dtos/block_story.dto';

@Resolver(() => Story)
export class StoryResolver {
  constructor(
    private readonly storyService: StoryService,
    private readonly usersService: UsersService,
    private readonly commentsService: CommentsService,
  ) {}

  @Query(() => Story, { description: '스토리 조회' })
  async story(
    @Args('id', { type: () => ID, description: '스토리 ID' }) id: string,
  ): Promise<Story> {
    return this.storyService.findStoryById(id);
  }

  @Query(() => StoryConnection, { description: '스토리 목록 조회' })
  async stories(
    @Args('limit', { type: () => Int, nullable: true, defaultValue: 5 })
    limit: number,
    @Args('offset', { type: () => Int, nullable: true, defaultValue: 0 })
    offset: number,
  ): Promise<StoryConnection> {
    return this.storyService.getStories(limit, offset);
  }

  @Query(() => [Story], { description: '스토리 검색' })
  async searchStories(
    @Args('query', { type: () => String }) query: string,
    @Args('limit', { type: () => Int, defaultValue: 10 }) limit: number,
    @Args('offset', { type: () => Int, defaultValue: 0 }) offset: number,
  ): Promise<Story[]> {
    return this.storyService.searchStories(query, limit, offset);
  }

  /**
   *  @deprecated 사용자의 스토리 목록 조회
   * TODO : 삭제 예정
   */
  @Query(() => StoryConnection, {
    description: '사용자의 스토리 목록 조회',
  })
  async userStories(
    @Args('userId', { type: () => ID }) userId: string,
    @Args('limit', { type: () => Int, nullable: true, defaultValue: 5 })
    limit: number,
    @Args('offset', { type: () => Int, nullable: true, defaultValue: 0 })
    offset: number,
  ): Promise<StoryConnection> {
    return this.storyService.findStoriesByUserId(userId, limit, offset);
  }

  @ResolveField(() => UserEntity, { description: '스토리를 작성한 사용자' })
  async user(@Parent() story: Story): Promise<UserEntity> {
    return await this.usersService.findById(story.userId);
  }

  @ResolveField(() => [StoryFile], { description: '스토리에 포함된 파일 목록' })
  async files(@Parent() story: Story): Promise<StoryFile[]> {
    return this.storyService.findStoryFiles(story.id);
  }

  @ResolveField(() => CommentConnection, { description: '댓글 목록' })
  async comments(
    @Parent() story: Story,
    @Args('limit', { type: () => Int, nullable: true, defaultValue: 5 })
    limit: number,
    @Args('offset', { type: () => Int, nullable: true, defaultValue: 0 })
    offset: number,
  ): Promise<CommentConnection> {
    return this.commentsService.getCommentsByStoryId(story.id, limit, offset);
  }

  @ResolveField(() => Int, { description: '댓글 개수' })
  async commentsCount(@Parent() story: Story): Promise<number> {
    return this.storyService.getCommentsCount(story.id);
  }

  @ResolveField(() => Int, { description: '좋아요 개수' })
  async likesCount(@Parent() story: Story): Promise<number> {
    return this.storyService.getLikesCount(story.id);
  }

  @ResolveField(() => Boolean, {
    description: '사용자가 해당 스토리에 좋아요를 눌렀는지 여부',
  })
  @UseGuards(GqlAuthGuard)
  async hasLiked(
    @Parent() story: Story,
    @CurrentUser() currentUser: User,
  ): Promise<boolean> {
    return this.storyService.hasLikedStory(story.id, currentUser.id);
  }

  @Mutation(() => Story, { description: '새로운 스토리를 생성.' })
  @UseGuards(GqlAuthGuard)
  async createStory(
    @Args('input') { content, files }: CreateStoryDto,
    @CurrentUser() currentUser: User,
  ): Promise<Story> {
    return this.storyService.createStory(currentUser.id, { content, files });
  }

  @Mutation(() => Story, { description: '스토리 업데이트' })
  @UseGuards(GqlAuthGuard)
  async updateStory(
    @Args('input') { id, content, files }: UpdateStoryDto,
    @CurrentUser() currentUser: User,
  ): Promise<Story> {
    return this.storyService.updateStory(currentUser.id, {
      id,
      content,
      files,
    });
  }

  @Mutation(() => Boolean, { description: '스토리를 삭제' })
  @UseGuards(GqlAuthGuard)
  async deleteStory(
    @Args('id', { type: () => ID, description: '스토리 ID' }) id: string,
    @CurrentUser() currentUser: User,
  ): Promise<boolean> {
    return this.storyService.deleteStory(currentUser.id, id);
  }

  @Mutation(() => Boolean, { description: '스토리에 좋아요 누르기' })
  @UseGuards(GqlAuthGuard)
  async likeStory(
    @Args('storyId', { type: () => ID }) storyId: string,
    @CurrentUser() currentUser: User,
  ): Promise<boolean> {
    await this.storyService.likeStory(storyId, currentUser.id);
    return true;
  }

  @Mutation(() => Boolean, { description: '스토리에 좋아요 취소하기' })
  @UseGuards(GqlAuthGuard)
  async dislikeStory(
    @Args('storyId', { type: () => ID }) storyId: string,
    @CurrentUser() currentUser: User,
  ): Promise<boolean> {
    await this.storyService.dislikeStory(storyId, currentUser.id);
    return true;
  }

  /**
   * 스토리를 차단합니다.
   * 관리자 권한이 필요합니다.
   */
  @Mutation(() => Boolean, { description: '스토리를 차단합니다.' })
  @UseGuards(GqlAuthGuard)
  async blockStory(
    @Args('input') input: BlockStoryInput,
    @CurrentUser() currentUser: User,
  ): Promise<boolean> {
    await this.storyService.blockStory(input.storyId, currentUser.id);

    return true;
  }

  /**
   * 스토리 차단을 해제합니다.
   * 관리자 권한이 필요합니다.
   */
  @Mutation(() => Boolean, { description: '스토리 차단을 해제합니다.' })
  @UseGuards(GqlAuthGuard)
  async unblockStory(
    @Args('input') input: BlockStoryInput,
    @CurrentUser() currentUser: User,
  ): Promise<boolean> {
    await this.storyService.unblockStory(input.storyId, currentUser.id);

    return true;
  }

  @Query(() => StoryConnection, {
    description: '차단된 스토리 목록을 조회합니다.',
  })
  @UseGuards(GqlAuthGuard)
  async blockedStories(
    @Args('limit', { type: () => Int, defaultValue: 10 }) limit: number,
    @Args('offset', { type: () => Int, defaultValue: 0 }) offset: number,
    @CurrentUser() currentUser: User,
  ): Promise<StoryConnection> {
    return this.storyService.getBlockedStories(currentUser.id, limit, offset);
  }
}
