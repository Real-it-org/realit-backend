import {
    Injectable,
    NotFoundException,
    BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../generated/prisma/client';
import { FollowRequestResponseDto } from './dto/follow-request-response.dto';
import { PaginationQueryDto } from '../profile/dto/pagination-query.dto';

@Injectable()
export class FollowRequestsService {
    constructor(
        private prisma: PrismaService,
        private notificationsService: NotificationsService,
    ) { }

    /**
     * Get all pending follow requests for the current user's profile.
     */
    async getPendingRequests(
        userId: string,
        pagination: PaginationQueryDto,
    ): Promise<FollowRequestResponseDto[]> {
        const { page = 1, limit = 20 } = pagination;
        const skip = (page - 1) * limit;

        const profile = await this.prisma.profiles.findUnique({
            where: { user_id: userId },
        });
        if (!profile) throw new NotFoundException('Profile not found');

        const requests = await this.prisma.follow_requests.findMany({
            where: { target_profile_id: profile.id, status: 'pending' },
            orderBy: { created_at: 'desc' },
            skip,
            take: limit,
            include: {
                requester: {
                    select: {
                        id: true,
                        username: true,
                        display_name: true,
                        avatar_url: true,
                    },
                },
            },
        });

        return requests.map((r) => ({
            id: r.id,
            requester: {
                id: r.requester.id,
                username: r.requester.username,
                display_name: r.requester.display_name,
                avatar_url: r.requester.avatar_url,
            },
            created_at: r.created_at,
        }));
    }

    /**
     * Accept a follow request:
     * 1. Mark request as accepted
     * 2. Create the follows record
     * 3. Increment follower/following counts
     * 4. Send follow_accepted notification to the requester
     */
    async acceptRequest(userId: string, requestId: string): Promise<void> {
        const profile = await this.prisma.profiles.findUnique({
            where: { user_id: userId },
        });
        if (!profile) throw new NotFoundException('Profile not found');

        const request = await this.prisma.follow_requests.findUnique({
            where: { id: requestId },
        });

        if (!request) throw new NotFoundException('Follow request not found');
        if (request.target_profile_id !== profile.id) {
            throw new BadRequestException('Not your follow request');
        }
        if (request.status !== 'pending') {
            throw new BadRequestException('Request is no longer pending');
        }

        // Run everything atomically
        await this.prisma.$transaction([
            this.prisma.follow_requests.update({
                where: { id: requestId },
                data: { status: 'accepted' },
            }),
            this.prisma.follows.create({
                data: {
                    follower_id: request.requester_profile_id,
                    following_id: request.target_profile_id,
                },
            }),
            this.prisma.profiles.update({
                where: { id: request.target_profile_id },
                data: { followers_count: { increment: 1 } },
            }),
            this.prisma.profiles.update({
                where: { id: request.requester_profile_id },
                data: { following_count: { increment: 1 } },
            }),
        ]);

        // Notify the requester that their request was accepted
        await this.notificationsService.createNotification({
            recipientProfileId: request.requester_profile_id,
            actorProfileId: request.target_profile_id, // the acceptor is the actor here
            type: NotificationType.follow_accepted,
        });
    }

    /**
     * Reject a follow request:
     * Hard-deletes the row so the user can re-request later.
     * No notification sent to requester (Instagram behaviour).
     */
    async rejectRequest(userId: string, requestId: string): Promise<void> {
        const profile = await this.prisma.profiles.findUnique({
            where: { user_id: userId },
        });
        if (!profile) throw new NotFoundException('Profile not found');

        const request = await this.prisma.follow_requests.findUnique({
            where: { id: requestId },
        });

        if (!request) throw new NotFoundException('Follow request not found');
        if (request.target_profile_id !== profile.id) {
            throw new BadRequestException('Not your follow request');
        }

        // Hard delete — allows the requester to send another request later
        await this.prisma.follow_requests.delete({ where: { id: requestId } });
    }
}
