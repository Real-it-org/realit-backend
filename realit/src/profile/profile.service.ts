import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { NotificationsService } from '../notifications/notifications.service';
import { ProfileResponseDto } from './dto/profile-response.dto';
import { PostResponseDto } from './dto/post-response.dto';
import { PaginationQueryDto } from './dto/pagination-query.dto';
import { UserSummaryDto } from './dto/user-summary.dto';
import { PublicProfileDto } from './dto/public-profile.dto';
import { NotificationType } from '../generated/prisma/client';

@Injectable()
export class ProfileService {
  constructor(
    private prisma: PrismaService,
    private storage: StorageService,
    private notificationsService: NotificationsService,
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
      unread_notifications_count: profile.unread_notifications_count,
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

  async getUserPostsByProfileId(
    profileId: string,
    pagination: PaginationQueryDto,
  ): Promise<PostResponseDto[]> {
    const { page = 1, limit = 10 } = pagination;
    const skip = (page - 1) * limit;

    const posts = await this.prisma.posts.findMany({
      where: { profile_id: profileId },
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

  async getPublicProfile(
    targetProfileId: string,
    currentUserId: string,
  ): Promise<PublicProfileDto> {
    const profile = await this.prisma.profiles.findUnique({
      where: { id: targetProfileId },
    });

    if (!profile) {
      throw new NotFoundException('Profile not found');
    }

    const currentUserProfile = await this.prisma.profiles.findUnique({
      where: { user_id: currentUserId },
    });

    let isFollowing = false;
    if (currentUserProfile) {
      const follow = await this.prisma.follows.findUnique({
        where: {
          follower_id_following_id: {
            follower_id: currentUserProfile.id,
            following_id: profile.id,
          },
        },
      });
      isFollowing = !!follow;
    }

    return {
      id: profile.id,
      username: profile.username,
      display_name: profile.display_name,
      bio: profile.bio,
      avatar_url: profile.avatar_url,
      website: profile.website,
      is_private: profile.is_private,
      followers_count: profile.followers_count,
      following_count: profile.following_count,
      posts_count: profile.posts_count,
      unread_notifications_count: profile.unread_notifications_count,
      is_following: isFollowing,
    };
  }

  /**
   * Follow a user.
   * - Public profile  → creates follows record + sends `follow` notification.
   * - Private profile → creates follow_request record + sends `follow_request` notification.
   * - Deduplication: existing pending request for the same pair is deleted first (re-follow after unfollow).
   * - Self-follow guard is handled here AND in NotificationsService.
   */
  async followUser(currentUserId: string, targetProfileId: string): Promise<void> {
    const follower = await this.prisma.profiles.findUnique({
      where: { user_id: currentUserId },
    });
    const following = await this.prisma.profiles.findUnique({
      where: { id: targetProfileId },
    });

    if (!follower || !following) {
      throw new NotFoundException('Profile not found');
    }

    if (follower.id === following.id) {
      throw new Error('Cannot follow yourself');
    }

    // Check if already following
    const existingFollow = await this.prisma.follows.findUnique({
      where: {
        follower_id_following_id: {
          follower_id: follower.id,
          following_id: following.id,
        },
      },
    });

    if (existingFollow) return; // Already following

    // ── PRIVATE PROFILE: create a follow request ──────────────────────────────
    if (following.is_private) {
      // Deduplication: remove any stale pending request before creating a new one
      await this.prisma.follow_requests.deleteMany({
        where: {
          requester_profile_id: follower.id,
          target_profile_id: following.id,
          status: 'pending',
        },
      });

      await this.prisma.follow_requests.create({
        data: {
          requester_profile_id: follower.id,
          target_profile_id: following.id,
          status: 'pending',
        },
      });

      await this.notificationsService.createNotification({
        recipientProfileId: following.id,
        actorProfileId: follower.id,
        type: NotificationType.follow_request,
      });

      return;
    }

    // ── PUBLIC PROFILE: follow directly ───────────────────────────────────────
    await this.prisma.$transaction([
      this.prisma.follows.create({
        data: {
          follower_id: follower.id,
          following_id: following.id,
        },
      }),
      this.prisma.profiles.update({
        where: { id: following.id },
        data: { followers_count: { increment: 1 } },
      }),
      this.prisma.profiles.update({
        where: { id: follower.id },
        data: { following_count: { increment: 1 } },
      }),
    ]);

    await this.notificationsService.createNotification({
      recipientProfileId: following.id,
      actorProfileId: follower.id,
      type: NotificationType.follow,
    });
  }

  async unfollowUser(currentUserId: string, targetProfileId: string): Promise<void> {
    const follower = await this.prisma.profiles.findUnique({
      where: { user_id: currentUserId },
    });
    const following = await this.prisma.profiles.findUnique({
      where: { id: targetProfileId },
    });

    if (!follower || !following) {
      throw new NotFoundException('Profile not found');
    }

    // Also cancel any outstanding pending follow request
    await this.prisma.follow_requests.deleteMany({
      where: {
        requester_profile_id: follower.id,
        target_profile_id: following.id,
        status: 'pending',
      },
    });

    try {
      await this.prisma.$transaction([
        this.prisma.follows.delete({
          where: {
            follower_id_following_id: {
              follower_id: follower.id,
              following_id: following.id,
            },
          },
        }),
        this.prisma.profiles.update({
          where: { id: following.id },
          data: { followers_count: { decrement: 1 } },
        }),
        this.prisma.profiles.update({
          where: { id: follower.id },
          data: { following_count: { decrement: 1 } },
        }),
      ]);
    } catch (error) {
      if (error.code === 'P2025') {
        return; // Not following, nothing to delete
      }
      throw error;
    }
  }
}
