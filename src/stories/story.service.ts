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
import { stories } from './../data/schema';
import { storyFiles as storyFilesTable } from './../data/schema';
import { eq } from 'drizzle-orm';
import { isEmptyString } from '../utils/type_gurad';
import { StoryFile } from './types/story_file.type';
import { UpdateStoryDto } from './dtos/update_story.dto';

@Injectable()
export class StoryService {
  constructor(
    @Inject('DRIZZLE') private readonly db: NodePgDatabase<typeof schema>,
    private readonly usersService: UsersService,
    private readonly filesService: FilesService,
  ) {}

  async createStory(createStoryDto: CreateStoryDto): Promise<Story> {
    const { userId, content, files } = createStoryDto;

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

    return newStory;
  }

  async updateStory(updateStoryDto: UpdateStoryDto): Promise<Story> {
    const { id, userId, content, files } = updateStoryDto;

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

    if (files) {
      await this.db
        .delete(storyFilesTable)
        .where(eq(storyFilesTable.storyId, id));

      const storyFilesData = files.map((file) => ({
        storyId: id,
        fileId: file.fileId,
        order: file.order,
      }));

      await this.db.insert(storyFilesTable).values(storyFilesData);
    }

    return updatedStory;
  }

  async deleteStory(id: string, userId: string): Promise<boolean> {
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

    const detailedStoryFiles = await Promise.all(
      storyFilesData.map(async (sf) => {
        const file = await this.filesService.readFile(sf.fileId); // 파일 상세 정보 조회
        return {
          file,
          order: sf.order,
        };
      }),
    );

    return detailedStoryFiles;
  }
}
