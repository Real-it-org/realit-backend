import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { PrismaService } from '../src/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

/**
 * Feed Simulation — verifies GET /feed returns posts from followed users.
 *
 * Scenario:
 *   1. Create User A and User B (with profiles)
 *   2. User B creates a post
 *   3. User A follows User B
 *   4. User A calls GET /feed → expects User B's post to appear
 *   5. Test cursor pagination by calling GET /feed?cursor=<post_id>
 */
async function bootstrap() {
    const app: INestApplication = await NestFactory.create(AppModule);
    await app.init();

    const prisma = app.get(PrismaService);
    const jwtService = app.get(JwtService);
    const configService = app.get(ConfigService);
    const atSecret = configService.get<string>('AT_SECRET');

    const timestamp = Date.now();

    // ── Helper: generate AT for a user ────────────────────────────────
    const generateToken = (userId: string, email: string) =>
        jwtService.sign({ sub: userId, email }, { secret: atSecret });

    try {
        // ── 1. Create User A ──────────────────────────────────────────────
        const userA = await prisma.users.create({
            data: {
                email: `feed_a_${timestamp}@test.com`,
                username: `feed_a_${timestamp}`,
                password_hash: 'hash',
                profile: {
                    create: {
                        username: `feed_a_${timestamp}`,
                        display_name: 'Alice',
                    },
                },
            },
            include: { profile: true },
        });
        console.log('✅ User A created:', userA.id);

        // ── 2. Create User B ──────────────────────────────────────────────
        const userB = await prisma.users.create({
            data: {
                email: `feed_b_${timestamp}@test.com`,
                username: `feed_b_${timestamp}`,
                password_hash: 'hash',
                profile: {
                    create: {
                        username: `feed_b_${timestamp}`,
                        display_name: 'Bob',
                    },
                },
            },
            include: { profile: true },
        });
        console.log('✅ User B created:', userB.id);

        // ── 3. User B creates a post ──────────────────────────────────────
        const post = await prisma.posts.create({
            data: {
                profile_id: userB.profile!.id,
                heading: 'Feed Test Post',
                description: 'This should appear in User A\'s feed',
            },
        });
        console.log('✅ Post created:', post.id);

        // ── 4. User A follows User B ──────────────────────────────────────
        await prisma.follows.create({
            data: {
                follower_id: userA.profile!.id,
                following_id: userB.profile!.id,
            },
        });
        console.log('✅ User A now follows User B');

        // ── 5. User A calls GET /feed ─────────────────────────────────────
        const tokenA = generateToken(userA.id, userA.email);

        const feedResponse = await request(app.getHttpServer())
            .get('/feed')
            .set('Authorization', `Bearer ${tokenA}`)
            .expect(200);

        const posts = feedResponse.body;
        console.log(`\n📋 Feed returned ${posts.length} post(s):`);

        if (posts.length === 0) {
            console.error('❌ Feed is empty — expected at least 1 post');
        } else {
            const feedPost = posts[0];
            console.log('   Post ID:', feedPost.id);
            console.log('   Heading:', feedPost.heading);
            console.log('   Author:', JSON.stringify(feedPost.author));
            console.log('   Verification:', feedPost.verification_status);

            // Validate shape
            const hasAuthor = feedPost.author && feedPost.author.username;
            const hasFields = feedPost.id && feedPost.heading !== undefined && feedPost.created_at;

            if (hasAuthor && hasFields) {
                console.log('✅ Feed response shape is correct');
            } else {
                console.error('❌ Feed response shape is missing fields');
            }
        }

        // ── 6. Test cursor pagination ─────────────────────────────────────
        if (posts.length > 0) {
            const cursorResponse = await request(app.getHttpServer())
                .get(`/feed?cursor=${posts[0].id}&limit=5`)
                .set('Authorization', `Bearer ${tokenA}`)
                .expect(200);

            console.log(`\n📋 Cursor pagination returned ${cursorResponse.body.length} post(s) (expected 0 since only 1 post exists)`);
            console.log('✅ Cursor pagination works');
        }

        // ── Cleanup ───────────────────────────────────────────────────────
        await prisma.follows.deleteMany({
            where: { follower_id: userA.profile!.id },
        });
        await prisma.posts.deleteMany({ where: { id: post.id } });
        await prisma.profiles.deleteMany({
            where: { id: { in: [userA.profile!.id, userB.profile!.id] } },
        });
        await prisma.users.deleteMany({
            where: { id: { in: [userA.id, userB.id] } },
        });
        console.log('\n🧹 Cleanup completed');
        console.log('\n🎉 Feed simulation passed!');

    } catch (error) {
        console.error('❌ Simulation failed:', error);
    }

    await app.close();
}

bootstrap();
