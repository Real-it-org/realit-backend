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
import { UserSummaryDto } from './dto/user-summary.dto';
import { PaginationQueryDto } from './dto/pagination-query.dto';
import { ProfileService } from './profile.service';

@ApiTags('Profile')
@Controller('profile')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) { }

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

  @Get('search')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Search for profiles by username or display name' })
  @ApiResponse({
    status: 200,
    description: 'Return a paginated list of matching profiles',
    type: [UserSummaryDto],
  })
  async searchProfiles(
    @Query('query') query: string,
    @Query() pagination: PaginationQueryDto,
  ): Promise<UserSummaryDto[]> {
    if (!query) {
      return [];
    }
    return this.profileService.searchProfiles(query, pagination);
  }
}
