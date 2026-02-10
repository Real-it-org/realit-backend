import { Controller, Get, Post, Delete, Query, Param } from '@nestjs/common';
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
import { PublicProfileDto } from './dto/public-profile.dto';
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

  @Get(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get a user profile by ID (public view)' })
  @ApiResponse({
    status: 200,
    description: 'Return the profile details',
    type: PublicProfileDto,
  })
  async getPublicProfile(
    @GetCurrentUser('sub') currentUserId: string,
    @Param('id') id: string,
  ): Promise<PublicProfileDto> {
    return this.profileService.getPublicProfile(id, currentUserId);
  }

  @Post(':id/follow')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Follow a user' })
  @ApiResponse({
    status: 201,
    description: 'Successfully followed the user',
  })
  async followUser(
    @GetCurrentUser('sub') currentUserId: string,
    @Param('id') id: string,
  ): Promise<void> {
    return this.profileService.followUser(currentUserId, id);
  }

  @Delete(':id/follow')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Unfollow a user' })
  @ApiResponse({
    status: 200,
    description: 'Successfully unfollowed the user',
  })
  async unfollowUser(
    @GetCurrentUser('sub') currentUserId: string,
    @Param('id') id: string,
  ): Promise<void> {
    return this.profileService.unfollowUser(currentUserId, id);
  }

  @Get(':id/posts')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get posts for a specific profile' })
  @ApiResponse({
    status: 200,
    description: 'Return a paginated list of posts',
    type: [PostResponseDto],
  })
  async getProfilePosts(
    @Param('id') id: string,
    @Query() pagination: PaginationQueryDto,
  ): Promise<PostResponseDto[]> {
    return this.profileService.getUserPostsByProfileId(id, pagination);
  }
}
