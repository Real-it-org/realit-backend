import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationType } from '../generated/prisma/client';
import { NotificationResponseDto } from './dto/notification-response.dto';
import { PaginationQueryDto } from '../profile/dto/pagination-query.dto';

@Injectable()
export class NotificationsService {
    constructor(private prisma: PrismaService) { }

    /**
     * Core method: create a notification.
     * Self-notification guard: skips if actor === recipient.
     * Deduplication: for follow/follow_request, deletes old notification from same actor first.
     */
    async createNotification(params: {
        recipientProfileId: string;
        actorProfileId: string;
        type: NotificationType;
        postId?: string;
        commentId?: string;
    }): Promise<void> {
        const { recipientProfileId, actorProfileId, type, postId, commentId } = params;

        // Self-notification guard
        if (recipientProfileId === actorProfileId) return;

        // Deduplication: for follow-type notifications, remove stale entry first
        if (type === NotificationType.follow || type === NotificationType.follow_request) {
            await this.prisma.notifications.deleteMany({
                where: {
                    recipient_profile_id: recipientProfileId,
                    actor_profile_id: actorProfileId,
                    type: { in: [NotificationType.follow, NotificationType.follow_request] },
                },
            });
        }

        // Create notification + increment unread counter atomically
        await this.prisma.$transaction([
            this.prisma.notifications.create({
                data: {
                    recipient_profile_id: recipientProfileId,
                    actor_profile_id: actorProfileId,
                    type,
                    post_id: postId ?? null,
                    comment_id: commentId ?? null,
                },
            }),
            this.prisma.profiles.update({
                where: { id: recipientProfileId },
                data: { unread_notifications_count: { increment: 1 } },
            }),
        ]);
    }

    async getNotifications(
        userId: string,
        pagination: PaginationQueryDto,
    ): Promise<NotificationResponseDto[]> {
        const { page = 1, limit = 20 } = pagination;
        const skip = (page - 1) * limit;

        const profile = await this.prisma.profiles.findUnique({
            where: { user_id: userId },
        });
        if (!profile) return [];

        const notifications = await this.prisma.notifications.findMany({
            where: { recipient_profile_id: profile.id },
            orderBy: { created_at: 'desc' },
            skip,
            take: limit,
            include: {
                actor: {
                    select: {
                        id: true,
                        username: true,
                        display_name: true,
                        avatar_url: true,
                    },
                },
            },
        });

        return notifications.map((n) => ({
            id: n.id,
            type: n.type,
            actor: {
                id: n.actor.id,
                username: n.actor.username,
                display_name: n.actor.display_name,
                avatar_url: n.actor.avatar_url,
            },
            post_id: n.post_id,
            comment_id: n.comment_id,
            is_read: n.is_read,
            created_at: n.created_at,
        }));
    }

    async markAsRead(userId: string, ids: string[]): Promise<void> {
        const profile = await this.prisma.profiles.findUnique({
            where: { user_id: userId },
        });
        if (!profile) return;

        // Only mark notifications that belong to this user
        const result = await this.prisma.notifications.updateMany({
            where: {
                id: { in: ids },
                recipient_profile_id: profile.id,
                is_read: false,
            },
            data: { is_read: true },
        });

        // Decrement unread counter by the number of notifications actually marked
        if (result.count > 0) {
            await this.prisma.profiles.update({
                where: { id: profile.id },
                data: { unread_notifications_count: { decrement: result.count } },
            });
        }
    }

    async markAllAsRead(userId: string): Promise<void> {
        const profile = await this.prisma.profiles.findUnique({
            where: { user_id: userId },
        });
        if (!profile) return;

        await this.prisma.$transaction([
            this.prisma.notifications.updateMany({
                where: { recipient_profile_id: profile.id, is_read: false },
                data: { is_read: true },
            }),
            this.prisma.profiles.update({
                where: { id: profile.id },
                data: { unread_notifications_count: 0 },
            }),
        ]);
    }
}
