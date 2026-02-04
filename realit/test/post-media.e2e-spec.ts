import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';

describe('PostController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let jwtService: JwtService;
  let token: string;
  let userId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    prisma = app.get(PrismaService);
    jwtService = app.get(JwtService);

    // Setup Test User
    const email = `test-${Date.now()}@example.com`;
    let user = await prisma.users.findUnique({ where: { email } });
    if (!user) {
      user = await prisma.users.create({
        data: {
          email,
          username: `testuser-${Date.now()}`,
          password_hash: 'hash',
          profile: {
            create: {
              username: `testuser-${Date.now()}`,
            },
          },
        },
      });
    }
    userId = user.id;
    token = jwtService.sign(
      { sub: user.id, email: user.email },
      { secret: 'at-secret' },
    );
  });

  afterAll(async () => {
    // Cleanup
    if (userId) {
      await prisma.users.delete({ where: { id: userId } });
    }
    await app.close();
  });

  it('/post (POST) should create post and return presigned URLs', async () => {
    const response = await request(app.getHttpServer())
      .post('/post')
      .set('Authorization', `Bearer ${token}`)
      .send({
        heading: 'E2E Test Post',
        description: 'Testing MinIO upload URLs',
        media: [
          {
            media_type: 'image',
            size_bytes: 5000,
            filename: 'test.png',
          },
        ],
      })
      .expect(201);

    expect(response.body).toHaveProperty('post_id');
    expect(response.body).toHaveProperty('media');
    expect(response.body.media).toHaveLength(1);
    expect(response.body.media[0]).toHaveProperty('upload_url');
    expect(response.body.media[0].upload_url).toContain(
      'http://localhost:9000',
    );
    expect(response.body.media[0].upload_url).toContain('media/images/v1');

    console.log(
      'Use this URL to test upload manually if needed:',
      response.body.media[0].upload_url,
    );
  });
});
