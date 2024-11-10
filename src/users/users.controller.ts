import { Controller, Patch, Body, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { UpdateUserDto } from './dtos/update_user.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Patch('update')
  @UseGuards(JwtAuthGuard)
  async updateUser(
    @Body()
    updateUserDto: UpdateUserDto,
  ) {
    const user = await this.usersService.updateUser(updateUserDto);

    return { ...user };
  }
}
