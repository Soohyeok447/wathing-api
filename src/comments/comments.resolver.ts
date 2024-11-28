import {
  Resolver,
  Mutation,
  Args,
  Parent,
  ResolveField,
  ID,
} from '@nestjs/graphql';
import { CommentsService } from './comments.service';
import { Comment } from './types/comment.type';
import { CreateCommentDto } from './dtos/create_comment.dto';
import { UsersService } from '../users/users.service';
import { User } from '../users/user.type';
import { UseGuards } from '@nestjs/common';
import { GqlAuthGuard } from '../core/guards/gql.guard';
import { CurrentUser } from '../core/decorators/current_user.decorator';
import { UpdateCommentDto } from './dtos/update_comment.dto';

@Resolver(() => Comment)
export class CommentsResolver {
  constructor(
    private readonly commentsService: CommentsService,
    private readonly usersService: UsersService,
  ) {}

  @ResolveField(() => User, { description: '댓글 작성자' })
  async user(@Parent() comment: Comment): Promise<User> {
    return this.usersService.findById(comment.userId);
  }

  @Mutation(() => Comment, { description: '댓글 생성' })
  @UseGuards(GqlAuthGuard)
  async createComment(
    @Args('input') { storyId, content, type }: CreateCommentDto,
    @CurrentUser() currentUser: User,
  ): Promise<Comment> {
    return this.commentsService.createComment(currentUser.id, {
      storyId,
      content,
      type,
    });
  }

  @Mutation(() => Comment, { description: '댓글 수정' })
  @UseGuards(GqlAuthGuard)
  async updateComment(
    @Args('input') { id, content, type }: UpdateCommentDto,
    @CurrentUser() currentUser: User,
  ): Promise<Comment> {
    return this.commentsService.updateComment(currentUser.id, {
      id,
      content,
      type,
    });
  }

  @Mutation(() => Boolean, { description: '댓글 삭제' })
  @UseGuards(GqlAuthGuard)
  async deleteComment(
    @Args('id', { type: () => ID, description: '댓글 ID' }) id: string,
    @CurrentUser() currentUser: User,
  ): Promise<boolean> {
    return this.commentsService.deleteComment(currentUser.id, id);
  }
}
