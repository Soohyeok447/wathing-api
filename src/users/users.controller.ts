import { Controller, Patch, Body, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { UpdateUserDto } from './dtos/update_user.dto';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Patch('update')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '유저 정보 업데이트' })
  async updateUser(
    @Body()
    updateUserDto: UpdateUserDto,
  ) {
    const user = await this.usersService.updateUser(updateUserDto);

    return { ...user };
  }
}
