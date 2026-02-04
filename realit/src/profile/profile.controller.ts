import { Controller, Get, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { GetCurrentUser } from '../auth/decorators/get-current-user.decorator';
import { ProfileResponseDto } from './dto/profile-response.dto';
import { PostResponseDto } from './dto/post-response.dto';
import { PaginationQueryDto } from './dto/pagination-query.dto';
import { ProfileService } from './profile.service';

@ApiTags('Profile')
@Controller('profile')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile (metadata only)' })
  @ApiResponse({
    status: 200,
    description: 'Return the profile metadata of the logged-in user',
    type: ProfileResponseDto,
  })
  async getProfile(
    @GetCurrentUser('sub') userId: string,
  ): Promise<ProfileResponseDto> {
    return this.profileService.getProfile(userId);
  }

  @Get('posts')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user posts (paginated)' })
  @ApiResponse({
    status: 200,
    description: 'Return a paginated list of posts for the logged-in user',
    type: [PostResponseDto],
  })
  async getUserPosts(
    @GetCurrentUser('sub') userId: string,
    @Query() pagination: PaginationQueryDto,
  ): Promise<PostResponseDto[]> {
    return this.profileService.getUserPosts(userId, pagination);
  }
}
