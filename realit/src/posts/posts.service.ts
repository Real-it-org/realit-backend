import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { CreatePostDto } from './dto/create-post.dto';
import { ConfirmPostMediaDto } from './dto/confirm-post-media.dto';
import { v4 as uuidv4 } from 'uuid';
import { MediaType, MediaStatus } from '../generated/prisma/client';
import { NotFoundException, ForbiddenException } from '@nestjs/common';

@Injectable()
export class PostsService {
  constructor(
    private prisma: PrismaService,
    private storage: StorageService,
  ) { }

  async createPost(userId: string, dto: CreatePostDto) {
    // 1. Get user profile to link post
    const profile = await this.prisma.profiles.findUnique({
      where: { user_id: userId },
    });

    if (!profile) {
      throw new Error('Profile not found for user');
    }

    // 2. Prepare media items and pre-signed URLs
    const mediaResponse: any[] = [];
    const mediaCreateData: any[] = [];

    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');

    let position = 0;
    for (const item of dto.media) {
      const assetId = uuidv4();
      const ext = item.filename.split('.').pop() || 'bin';

      // format: media/images/v1/2026/01/29/{profile_id}/{asset_id}/original.jpg
      const typeFolder =
        item.media_type === MediaType.image ? 'images' : 'videos';
      const objectKey = `media/${typeFolder}/v1/${year}/${month}/${day}/${profile.id}/${assetId}/original.${ext}`;

      // Get Pre-signed URL
      const contentType =
        item.media_type === MediaType.image ? 'image/jpeg' : 'video/mp4'; // Simplification, ideally infer from ext
      const uploadUrl = await this.storage.getPresignedUrl(
        objectKey,
        contentType,
      );

      mediaCreateData.push({
        media_url: uploadUrl.split('?')[0], // The public URL (without signature)
        media_type: item.media_type,
        position: position++,
        status: 'pending', // Pending upload
        size_bytes: BigInt(item.size_bytes),
        object_key: objectKey,
        // duration_ms: 0 // Optional, unknown at this stage
      });

      mediaResponse.push({
        asset_id: assetId,
        upload_url: uploadUrl,
        object_key: objectKey,
      });
    }

    // 3. Create Post + Media in Transaction
    const post = await this.prisma.posts.create({
      data: {
        profile_id: profile.id,
        heading: dto.heading,
        description: dto.description,
        media: {
          create: mediaCreateData.map((m) => ({
            media_url: m.media_url,
            media_type: m.media_type,
            position: m.position,
            status: MediaStatus.pending,
            size_bytes: m.size_bytes,
            object_key: m.object_key,
          })),
        },
      },
      include: {
        media: true,
      },
    });

    // 4. Return combined result
    return {
      post_id: post.id,
      media: mediaResponse,
    };
  }
  async confirmPostMedia(userId: string, dto: ConfirmPostMediaDto) {
    // 1. Verify post exists and belongs to user
    const post = await this.prisma.posts.findUnique({
      where: { id: dto.post_id },
      include: { profile: true }
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    if (post.profile.user_id !== userId) {
      throw new ForbiddenException('You can only confirm media for your own posts');
    }

    // 2. Update status of uploaded assets to 'active'
    await this.prisma.post_media.updateMany({
      where: {
        post_id: dto.post_id,
        id: { in: dto.uploaded_asset_ids }
      },
      data: {
        status: MediaStatus.active
      }
    });

    return { message: 'Media confirmed' };
  }
}
