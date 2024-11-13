import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { UsersService } from './users.service';
import { UserResponseDto } from './dtos/user_response.dto';
import { UpdateUserDto } from './dtos/update_user.dto';

@Resolver(() => UserResponseDto)
export class UsersResolver {
  constructor(private readonly usersService: UsersService) {}

  @Query(() => UserResponseDto, { name: 'user', description: '유저 찾기' })
  async findById(
    @Args('id', { type: () => String }) id: string,
  ): Promise<UserResponseDto> {
    return this.usersService.findById(id);
  }

  @Mutation(() => UserResponseDto, { description: '유저 수정' })
  async updateUser(
    @Args('update') input: UpdateUserDto,
  ): Promise<UserResponseDto> {
    return this.usersService.updateUser(input);
  }

  @Mutation(() => Boolean, { description: '유저 삭제' })
  async deleteUser(
    @Args('id', { type: () => ID }) id: string,
  ): Promise<boolean> {
    await this.usersService.deleteUser(id);

    return true;
  }
}
