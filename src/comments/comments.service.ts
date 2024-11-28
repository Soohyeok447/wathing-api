import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { comments } from '../data/schema/comment';
import { eq, desc } from 'drizzle-orm';
import * as schema from '../data/schema';
import { Comment } from './types/comment.type';
import { CommentConnection } from './types/comment_connection.typs';
import { CreateCommentDto } from './dtos/create_comment.dto';
import { UpdateCommentDto } from './dtos/update_comment.dto';
import { MessageType } from '../messages/types/message_type.enum';
import { EmojiService } from '../emoji/emoji.service';

@Injectable()
export class CommentsService {
  constructor(
    @Inject('DRIZZLE') private readonly db: NodePgDatabase<typeof schema>,
    private readonly emojiService: EmojiService,
  ) {}

  async getCommentsByStoryId(
    storyId: string,
    limit: number,
    offset = 0,
  ): Promise<CommentConnection> {
    const commentsData = await this.db
      .select()
      .from(comments)
      .where(eq(comments.storyId, storyId))
      .orderBy(desc(comments.createdAt))
      .limit(limit + 1)
      .offset(offset);

    const hasNextPage = commentsData.length > limit;
    const edges = hasNextPage ? commentsData.slice(0, -1) : commentsData;

    const nextOffset = offset + limit;

    return {
      edges,
      hasNextPage,
      nextOffset: hasNextPage ? nextOffset : null,
    };
  }

  async createComment(
    userId: string,
    { storyId, content, type }: CreateCommentDto,
  ): Promise<Comment> {
    if (!storyId) {
      throw new BadRequestException('storyId는 필수입니다.');
    }

    const [user] = await this.db
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, userId));

    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }

    const [story] = await this.db
      .select()
      .from(schema.stories)
      .where(eq(schema.stories.id, storyId));

    if (!story) {
      throw new NotFoundException('스토리를 찾을 수 없습니다.');
    }

    const newCommentData: {
      userId: string;
      storyId: string;
      content: string;
      type: MessageType;
    } = {
      userId,
      storyId,
      content,
      type,
    };

    switch (type) {
      case MessageType.EMOJI:
        {
          if (!content) {
            throw new BadRequestException('이모티콘 ID가 필요합니다.');
          }

          const emojiFile = await this.emojiService.getEmojiById(content);

          if (!emojiFile) {
            throw new BadRequestException(`존재하지 않는 이모티콘입니다.`);
          }

          newCommentData.content = JSON.stringify({
            id: emojiFile.id,
            key: emojiFile.key,
          });
        }
        break;

      case MessageType.TEXT:
        {
          if (!content || content.trim() === '') {
            throw new BadRequestException('내용을 입력해주세요.');
          }

          if (content.length > 500) {
            throw new BadRequestException('댓글 내용이 너무 깁니다.');
          }

          newCommentData.content = content;
        }
        break;

      default:
        throw new BadRequestException(
          '댓글 타입은 text 또는 emoji 여야 합니다.',
        );
    }

    const [newComment] = await this.db
      .insert(comments)
      .values(newCommentData)
      .returning();

    return newComment;
  }

  async updateComment(
    userId: string,
    { id, content, type }: UpdateCommentDto,
  ): Promise<Comment> {
    const [existingComment] = await this.db
      .select()
      .from(comments)
      .where(eq(comments.id, id));

    if (!existingComment) {
      throw new NotFoundException('댓글을 찾을 수 없습니다.');
    }

    if (existingComment.userId !== userId) {
      throw new UnauthorizedException('작성자만 댓글을 수정할 수 있습니다.');
    }

    const updateData: Partial<Comment> = {};

    if (!type || type !== MessageType.TEXT) {
      throw new BadRequestException('댓글 타입은 text 여야 합니다.');
    }

    if (type === MessageType.TEXT) {
      if (!content || content.trim() === '') {
        throw new BadRequestException('내용을 입력해주세요.');
      }

      if (content.length > 500) {
        throw new BadRequestException('댓글 내용이 너무 깁니다.');
      }

      updateData.content = content;
    }

    const [updatedComment] = await this.db
      .update(comments)
      .set(updateData)
      .where(eq(comments.id, id))
      .returning();

    return updatedComment;
  }

  async deleteComment(userId: string, id: string): Promise<boolean> {
    const [existingComment] = await this.db
      .select()
      .from(comments)
      .where(eq(comments.id, id));

    if (!existingComment) {
      throw new NotFoundException('댓글을 찾을 수 없습니다.');
    }

    if (existingComment.userId !== userId) {
      throw new UnauthorizedException('작성자만 댓글을 삭제할 수 있습니다.');
    }

    await this.db.delete(comments).where(eq(comments.id, id));

    return true;
  }
}
