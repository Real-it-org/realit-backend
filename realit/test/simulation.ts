import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { PrismaService } from '../src/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app: INestApplication = await NestFactory.create(AppModule);
  await app.init();

  const prisma = app.get(PrismaService);
  const jwtService = app.get(JwtService);
  const configService = app.get(ConfigService);

  // 1. Get or Create a User
  let user = await prisma.users.findUnique({
    where: { email: 'test@example.com' },
  });
  if (!user) {
    user = await prisma.users.create({
      data: {
        email: 'test@example.com',
        username: 'testuser',
        password_hash: 'hash',
        profile: {
          create: {
            username: 'testuser',
          },
        },
      },
    });
  }

  console.log('User ID:', user.id);

  // 2. Generate Token
  const secret = configService.get<string>('AT_SECRET');
  const token = jwtService.sign(
    { sub: user.id, email: user.email },
    { secret },
  );

  // 3. Test Create Post
  const response = await request(app.getHttpServer())
    .post('/post')
    .set('Authorization', `Bearer ${token}`)
    .send({
      heading: 'My Vacation',
      description: 'Check out these photos!',
      media: [
        {
          media_type: 'image',
          size_bytes: 1024,
          filename: 'photo1.jpg',
        },
        {
          media_type: 'video',
          size_bytes: 5000000,
          filename: 'video1.mp4',
        },
      ],
    })
    .expect(201);

  console.log('Response Status:', response.status);
  console.log('Response Body:', JSON.stringify(response.body, null, 2));

  if (response.body.media && response.body.media.length > 0) {
    console.log('✅ Post created and Pre-signed URLs returned.');
    console.log('First URL:', response.body.media[0].upload_url);

    // 4. Test Media Confirmation
    console.log('Simulating Media Confirmation...');
    const uploadedAssetIds = response.body.media.map((m: any) => m.asset_id);

    // Type coercion for request(app.getHttpServer()) if needed, or just let it interpret
    const confirmResponse = await request(app.getHttpServer())
      .post('/post/confirm')
      .set('Authorization', `Bearer ${token}`)
      .send({
        post_id: response.body.post_id,
        uploaded_asset_ids: uploadedAssetIds
      })
      .expect(201);

    console.log('✅ Media confirmed:', confirmResponse.body);
  } else {
    console.error('❌ Failed to get media URLs');
  }

  await app.close();
}

bootstrap();
