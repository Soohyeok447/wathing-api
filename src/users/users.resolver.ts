import {
  Resolver,
  Query,
  Mutation,
  Args,
  ID,
  ResolveField,
  Parent,
} from '@nestjs/graphql';
import { UsersService } from './users.service';
import { User } from './user.type';
import { UpdateUserDto } from './dtos/update_user.dto';
import { FilesService } from '../files/files.service';
import { File } from '../files/file.type';

@Resolver(() => User)
export class UsersResolver {
  constructor(
    private readonly usersService: UsersService,
    private readonly filesService: FilesService,
  ) {}

  @Query(() => User, {
    name: 'user',
    description: '유저 찾기 (profileImage: File 필드 포함)',
  })
  async findById(
    @Args('id', { type: () => String }) id: string,
  ): Promise<User> {
    return this.usersService.findById(id);
  }

  @ResolveField(() => File, { nullable: true, description: '프로필 이미지' })
  async profileImage(@Parent() user: User): Promise<File | null> {
    if (!user.profileImageId) {
      return null;
    }

    return this.filesService.readFile(user.profileImageId);
  }

  @Mutation(() => User, { description: '유저 수정' })
  async updateUser(@Args('input') input: UpdateUserDto): Promise<User> {
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
