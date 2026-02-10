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
  @ApiOperation({ summary: 'Get public profile by ID (or own profile)' })
  @ApiResponse({
    status: 200,
    description: 'Return the profile details',
    type: PublicProfileDto,
  })
  async getPublicProfile(
    @Param('id') targetProfileId: string,
    @GetCurrentUser('sub') currentUserId: string,
  ): Promise<PublicProfileDto> {
    return this.profileService.getPublicProfile(targetProfileId, currentUserId);
  }

  @Post(':id/follow')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Follow a user' })
  @ApiResponse({ status: 201, description: 'User followed successfully' })
  async followUser(
    @Param('id') targetProfileId: string,
    @GetCurrentUser('sub') currentUserId: string,
  ): Promise<void> {
    return this.profileService.followUser(currentUserId, targetProfileId);
  }

  @Delete(':id/follow')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Unfollow a user' })
  @ApiResponse({ status: 200, description: 'User unfollowed successfully' })
  async unfollowUser(
    @Param('id') targetProfileId: string,
    @GetCurrentUser('sub') currentUserId: string,
  ): Promise<void> {
    return this.profileService.unfollowUser(currentUserId, targetProfileId);
  }

  @Get(':id/posts')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get posts for a specific profile (public)' })
  @ApiResponse({
    status: 200,
    description: 'Return a paginated list of posts for the specified profile',
    type: [PostResponseDto],
  })
  async getPublicUserPosts(
    @Param('id') profileId: string,
    @Query() pagination: PaginationQueryDto,
  ): Promise<PostResponseDto[]> {
    return this.profileService.getUserPostsByProfileId(profileId, pagination);
  }
}
