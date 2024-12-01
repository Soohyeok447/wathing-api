import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateStoryDto } from './dtos/create_story.dto';
import { Story } from './types/story.type';
import { UsersService } from '../users/users.service';
import { FilesService } from '../files/files.service';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from './../data/schema';
import { comments, stories, storyLikes } from './../data/schema';
import { storyFiles as storyFilesTable } from './../data/schema';
import { eq, desc, and, like } from 'drizzle-orm';
import { isEmptyString } from '../utils/type_gurad';
import { StoryFile } from './types/story_file.type';
import { UpdateStoryDto } from './dtos/update_story.dto';
import { StoryConnection } from './types/story_connection.type';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class StoryService {
  constructor(
    @Inject('DRIZZLE') private readonly db: NodePgDatabase<typeof schema>,
    private readonly usersService: UsersService,
    private readonly filesService: FilesService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async findStoryById(id: string): Promise<Story> {
    const [story] = await this.db
      .select()
      .from(stories)
      .where(eq(stories.id, id));

    if (!story) {
      throw new NotFoundException('스토리를 찾을 수 없습니다.');
    }

    return story;
  }

  async findStoryFiles(storyId: string): Promise<StoryFile[]> {
    const storyFilesData = await this.db
      .select()
      .from(storyFilesTable)
      .where(eq(storyFilesTable.storyId, storyId));

    if (storyFilesData.length === 0) {
      return [];
    }

    const detailedStoryFiles = await Promise.all(
      storyFilesData.map(async (sf) => {
        const file = await this.filesService
          .readFile(sf.fileId)
          .catch(() => null);

        if (!file) return null;
        else {
          return {
            file,
            order: sf.order,
          };
        }
      }),
    );

    return detailedStoryFiles.filter((sf) => sf !== null);
  }

  async getStories(limit: number, offset = 0): Promise<StoryConnection> {
    const storiesData = await this.db
      .select()
      .from(stories)
      .orderBy(desc(stories.createdAt))
      .limit(limit + 1)
      .offset(offset);

    const hasNextPage = storiesData.length > limit;
    const edges = hasNextPage ? storiesData.slice(0, -1) : storiesData;

    const nextOffset = offset + limit;

    return {
      edges,
      hasNextPage,
      nextOffset: hasNextPage ? nextOffset : null,
    };
  }

  async findStoriesByUserId(
    userId: string,
    limit: number,
    offset: number,
  ): Promise<StoryConnection> {
    const user = await this.usersService.findById(userId);

    if (!user) {
      throw new NotFoundException('존재하지 않는 유저입니다.');
    }

    const userStoriesData = await this.db
      .select()
      .from(stories)
      .where(eq(stories.userId, userId))
      .orderBy(desc(stories.createdAt))
      .limit(limit + 1)
      .offset(offset);

    const hasNextPage = userStoriesData.length > limit;
    const edges = hasNextPage ? userStoriesData.slice(0, -1) : userStoriesData;

    const nextOffset = hasNextPage ? offset + limit : null;

    return {
      edges,
      hasNextPage,
      nextOffset,
    };
  }

  async getCommentsCount(storyId: string): Promise<number> {
    return await this.db.$count(comments, eq(comments.storyId, storyId));
  }

  async createStory(
    userId: string,
    { content, files }: CreateStoryDto,
  ): Promise<Story> {
    if (isEmptyString(content)) {
      throw new BadRequestException('스토리의 내용은 빈 문자열일 수 없습니다.');
    }

    const user = await this.usersService.findById(userId);

    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }

    if (files && files.length > 0) {
      const fileIds = files.map((file) => file.fileId);
      const existingFiles = await this.filesService.findFilesByIds(fileIds);

      if (existingFiles.length !== fileIds.length) {
        throw new NotFoundException('일부 파일을 찾을 수 없습니다.');
      }
    }

    const [newStory] = await this.db
      .insert(stories)
      .values({
        userId,
        content,
      })
      .returning();

    if (files && files.length > 0) {
      const storyFilesData = files.map((file) => ({
        storyId: newStory.id,
        fileId: file.fileId,
        order: file.order,
      }));

      await this.db.insert(storyFilesTable).values(storyFilesData);
    }

    // 구독자들에게 알림 생성
    const subscribers = await this.usersService.getSubscribers(userId);

    await Promise.all(
      subscribers.map(async (subscriber) => {
        this.notificationsService.createNotification(
          subscriber.id,
          'new_post',
          {
            userId,
            storyId: newStory.id,
            message: `${user.name}님이 새로운 스토리를 작성했습니다.`,
          },
        );

        const credential = await this.usersService.findCredentialById(
          subscriber.id,
        );

        if (credential && credential.deviceToken) {
          await this.notificationsService.sendPushNotification(
            credential.deviceToken,
            '새 스토리',
            `${user.name}님이 새로운 스토리를 작성했습니다.`,
            {
              userId,
              storyId: newStory.id,
              message: `${user.name}님이 새로운 스토리를 작성했습니다.`,
            },
          );
        }
      }),
    );

    return newStory;
  }

  async updateStory(
    userId: string,
    { id, content, files }: UpdateStoryDto,
  ): Promise<Story> {
    const existingStory = await this.findStoryById(id);

    if (!existingStory) {
      throw new NotFoundException('스토리를 찾을 수 없습니다.');
    }

    if (existingStory.userId !== userId) {
      throw new BadRequestException('작성자만 스토리를 수정할 수 있습니다.');
    }

    if (content && isEmptyString(content)) {
      throw new BadRequestException('스토리의 내용은 빈 문자열일 수 없습니다.');
    }

    const updateData = { content, updatedAt: new Date() };

    const [updatedStory] = await this.db
      .update(stories)
      .set(updateData)
      .where(eq(stories.id, id))
      .returning();

    await this.db
      .delete(storyFilesTable)
      .where(eq(storyFilesTable.storyId, id));

    if (files && files.length > 0) {
      const storyFilesData = files.map((file) => ({
        storyId: id,
        fileId: file.fileId,
        order: file.order,
      }));

      await this.db.insert(storyFilesTable).values(storyFilesData);
    }

    return updatedStory;
  }

  async deleteStory(userId: string, id: string): Promise<boolean> {
    const existingStory = await this.findStoryById(id);

    if (!existingStory) {
      throw new NotFoundException('스토리를 찾을 수 없습니다.');
    }

    if (existingStory.userId !== userId) {
      throw new BadRequestException('작성자만 스토리를 삭제할 수 있습니다.');
    }

    await this.db.delete(stories).where(eq(stories.id, id));

    return true;
  }

  /**
   * 특정 스토리를 좋아요합니다.
   */
  async likeStory(storyId: string, userId: string): Promise<void> {
    console.log('likeStory', storyId, userId);

    const hasLiked = await this.hasLikedStory(storyId, userId);

    console.log('likeStory - hasLiked', hasLiked);

    if (hasLiked) return;

    await this.db.insert(storyLikes).values({
      storyId,
      userId,
    });
  }

  /**
   * 특정 스토리의 좋아요를 취소합니다.
   */
  async dislikeStory(storyId: string, userId: string): Promise<void> {
    console.log('dislikeStory', storyId, userId);

    const hasLiked = await this.hasLikedStory(storyId, userId);

    console.log('dislikeStory - hasLiked', hasLiked);

    if (!hasLiked) return;

    await this.db
      .delete(storyLikes)
      .where(
        and(eq(storyLikes.storyId, storyId), eq(storyLikes.userId, userId)),
      );
  }

  /**
   * 특정 스토리의 좋아요 개수를 가져옵니다.
   * @param storyId 스토리 ID
   */
  async getLikesCount(storyId: string): Promise<number> {
    return await this.db.$count(storyLikes, eq(storyLikes.storyId, storyId));
  }

  /**
   * 사용자가 특정 스토리에 좋아요를 했는지 확인합니다.
   * @param storyId 스토리 ID
   * @param userId 사용자 ID
   */
  async hasLikedStory(storyId: string, userId: string): Promise<boolean> {
    const [like] = await this.db
      .select()
      .from(storyLikes)
      .where(
        and(eq(storyLikes.storyId, storyId), eq(storyLikes.userId, userId)),
      );

    return !!like;
  }

  /**
   * 검색어를 사용하여 스토리를 검색합니다.
   */
  async searchStories(
    searchQuery: string,
    limit = 10,
    offset = 0,
  ): Promise<Story[]> {
    const searchPattern = `%${searchQuery}%`;

    const searchedStories = await this.db
      .select({
        id: stories.id,
        userId: stories.userId,
        content: stories.content,
        createdAt: stories.createdAt,
      })
      .from(stories)
      .orderBy(desc(stories.createdAt))
      .limit(limit)
      .offset(offset)
      .where(like(stories.content, searchPattern));

    return searchedStories;
  }
}
