import {
  Resolver,
  Mutation,
  Args,
  Parent,
  ResolveField,
  Query,
  ID,
} from '@nestjs/graphql';
import { StoryService } from './story.service';
import { Story } from './types/story.type';
import { CreateStoryDto } from './dtos/create_story.dto';
import { User as UserEntity } from '../users/user.type';
import { StoryFile } from './types/story_file.type';
import { UsersService } from '../users/users.service';
import { UpdateStoryDto } from './dtos/update_story.dto';

@Resolver(() => Story)
export class StoryResolver {
  constructor(
    private readonly storyService: StoryService,
    private readonly usersService: UsersService,
  ) {}

  @Query(() => Story, { description: '스토리 조회' })
  async story(
    @Args('id', { type: () => ID, description: '스토리 ID' }) id: string,
  ): Promise<Story> {
    return this.storyService.findStoryById(id);
  }

  @ResolveField(() => UserEntity, { description: '스토리를 작성한 사용자' })
  async user(@Parent() story: Story): Promise<UserEntity> {
    return await this.usersService.findById(story.userId);
  }

  @ResolveField(() => [StoryFile], { description: '스토리에 포함된 파일 목록' })
  async files(@Parent() story: Story): Promise<StoryFile[]> {
    return this.storyService.findStoryFiles(story.id);
  }

  @Mutation(() => Story, { description: '새로운 스토리를 생성.' })
  async createStory(
    @Args('input') createStoryDto: CreateStoryDto,
  ): Promise<Story> {
    return this.storyService.createStory(createStoryDto);
  }

  @Mutation(() => Story, { description: '스토리 업데이트' })
  async updateStory(
    @Args('input') updateStoryDto: UpdateStoryDto,
  ): Promise<Story> {
    return this.storyService.updateStory(updateStoryDto);
  }

  @Mutation(() => Boolean, { description: '스토리를 삭제' })
  async deleteStory(
    @Args('id', { type: () => ID, description: '스토리 ID' }) id: string,
    @Args('userId', { type: () => ID, description: '작성자 ID' })
    userId: string,
  ): Promise<boolean> {
    return this.storyService.deleteStory(id, userId);
  }
}
