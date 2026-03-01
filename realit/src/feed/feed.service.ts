import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { FeedQueryDto } from './dto/feed-query.dto';
import { FeedPostDto } from './dto/feed-post.dto';

@Injectable()
export class FeedService {
    constructor(
        private prisma: PrismaService,
        private storage: StorageService,
    ) { }

    async getFeed(
        userId: string,
        query: FeedQueryDto,
    ): Promise<FeedPostDto[]> {
        const limit = query.limit ?? 10;

        // 1. Get current user's profile
        const myProfile = await this.prisma.profiles.findUnique({
            where: { user_id: userId },
        });

        if (!myProfile) {
            throw new NotFoundException('Profile not found');
        }

        // 2. Get IDs of profiles the user follows
        const followedProfiles = await this.prisma.follows.findMany({
            where: { follower_id: myProfile.id },
            select: { following_id: true },
        });

        const feedProfileIds = [
            myProfile.id, // include own posts
            ...followedProfiles.map((f) => f.following_id),
        ];

        // 3. Build cursor condition
        let cursorCondition = {};
        if (query.cursor) {
            const cursorPost = await this.prisma.posts.findUnique({
                where: { id: query.cursor },
                select: { created_at: true },
            });

            if (cursorPost) {
                cursorCondition = {
                    created_at: { lt: cursorPost.created_at },
                };
            }
        }

        // 4. Query posts from followed profiles + own, ordered by recency
        const posts = await this.prisma.posts.findMany({
            where: {
                profile_id: { in: feedProfileIds },
                ...cursorCondition,
            },
            orderBy: { created_at: 'desc' },
            take: limit,
            include: {
                media: {
                    where: { status: 'active' },
                    orderBy: { position: 'asc' },
                },
                profile: {
                    select: {
                        id: true,
                        username: true,
                        display_name: true,
                        avatar_url: true,
                    },
                },
            },
        });

        // 5. Sign media URLs and shape response
        const feedPosts: FeedPostDto[] = await Promise.all(
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
                author: {
                    profile_id: post.profile.id,
                    username: post.profile.username,
                    display_name: post.profile.display_name,
                    avatar_url: post.profile.avatar_url,
                },
            })),
        );

        return feedPosts;
    }
}
