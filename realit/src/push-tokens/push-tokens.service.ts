import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PushTokensService {
    constructor(private prisma: PrismaService) { }

    /**
     * Register a push token for a device.
     * Uses upsert so re-registering the same token (e.g. app re-install) is safe.
     */
    async register(userId: string, token: string, platform: string): Promise<void> {
        await this.prisma.push_tokens.upsert({
            where: { token },
            update: { user_id: userId, platform }, // re-assign if token moved to new account
            create: { user_id: userId, token, platform },
        });
    }

    /**
     * Unregister a push token (e.g. on logout from a specific device).
     */
    async unregister(userId: string, token: string): Promise<void> {
        // Only delete if it belongs to this user
        await this.prisma.push_tokens.deleteMany({
            where: { token, user_id: userId },
        });
    }

    /**
     * Get all push tokens for a user (used internally to fan-out push notifications).
     */
    async getTokensForUser(userId: string): Promise<{ token: string; platform: string }[]> {
        return this.prisma.push_tokens.findMany({
            where: { user_id: userId },
            select: { token: true, platform: true },
        });
    }
}
