import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { ProfileResponseDto } from './dto/profile-response.dto';
import { PostResponseDto } from './dto/post-response.dto';
import { PaginationQueryDto } from './dto/pagination-query.dto';
import { UserSummaryDto } from './dto/user-summary.dto';

@Injectable()
export class ProfileService {
  constructor(
    private prisma: PrismaService,
    private storage: StorageService,
  ) { }

  async getProfile(userId: string): Promise<ProfileResponseDto> {
    const profile = await this.prisma.profiles.findUnique({
      where: { user_id: userId },
    });

    if (!profile) {
      throw new NotFoundException('Profile not found');
    }

    return {
      username: profile.username,
      display_name: profile.display_name,
      bio: profile.bio,
      avatar_url: profile.avatar_url,
      website: profile.website,
      is_private: profile.is_private,
      followers_count: profile.followers_count,
      following_count: profile.following_count,
      posts_count: profile.posts_count,
    };
  }

  async getUserPosts(
    userId: string,
    pagination: PaginationQueryDto,
  ): Promise<PostResponseDto[]> {
    const { page = 1, limit = 10 } = pagination;
    const skip = (page - 1) * limit;

    const profile = await this.prisma.profiles.findUnique({
      where: { user_id: userId },
    });

    if (!profile) {
      throw new NotFoundException('Profile not found');
    }

    const posts = await this.prisma.posts.findMany({
      where: { profile_id: profile.id },
      orderBy: { created_at: 'desc' },
      skip,
      take: limit,
      include: { media: { orderBy: { position: 'asc' } } },
    });

    const postsWithSignedMedia = await Promise.all(
      posts.map(async (post) => ({
        id: post.id,
        heading: post.heading || '',
        description: post.description || '',
        media: await Promise.all(
          post.media.map(async (m) => ({
            media_url: await this.storage.getPresignedUrlForRead(m.object_key),
            media_type: m.media_type,
            position: m.position,
          })),
        ),
        verification_status: post.verification_status,
        likes_count: post.likes_count,
        comments_count: post.comments_count,
        created_at: post.created_at,
      })),
    );

    return postsWithSignedMedia;
  }

  async searchProfiles(
    query: string,
    pagination: PaginationQueryDto,
  ): Promise<UserSummaryDto[]> {
    const { page = 1, limit = 10 } = pagination;
    const skip = (page - 1) * limit;

    const profiles = await this.prisma.profiles.findMany({
      where: {
        OR: [
          { username: { contains: query, mode: 'insensitive' } },
          { display_name: { contains: query, mode: 'insensitive' } },
        ],
      },
      skip,
      take: limit,
      select: {
        id: true,
        username: true,
        display_name: true,
        avatar_url: true,
        is_private: true,
      },
    });

    return profiles.map((p) => ({
      id: p.id,
      username: p.username,
      display_name: p.display_name,
      avatar_url: p.avatar_url,
      is_private: p.is_private,
    }));
  }
}
