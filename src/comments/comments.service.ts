import {
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

@Injectable()
export class CommentsService {
  constructor(
    @Inject('DRIZZLE') private readonly db: NodePgDatabase<typeof schema>,
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
    { storyId, content }: CreateCommentDto,
  ): Promise<Comment> {
    // 유효성 검사 및 스토리, 사용자 존재 여부 확인 로직 추가 필요

    const [newComment] = await this.db
      .insert(comments)
      .values({ userId, storyId, content })
      .returning();

    return newComment;
  }

  async updateComment(
    userId: string,
    { id, content }: UpdateCommentDto,
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

    const [updatedComment] = await this.db
      .update(comments)
      .set({ content })
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
