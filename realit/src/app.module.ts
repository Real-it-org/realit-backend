import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { APP_GUARD } from '@nestjs/core';
import { AtGuard } from './auth/guards/at.guard';

import { ProfileModule } from './profile/profile.module';
import { PostsModule } from './posts/posts.module';
import { NotificationsModule } from './notifications/notifications.module';
import { FollowRequestsModule } from './follow-requests/follow-requests.module';
import { PushTokensModule } from './push-tokens/push-tokens.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    AuthModule,
    ProfileModule,
    PostsModule,
    NotificationsModule,
    FollowRequestsModule,
    PushTokensModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: AtGuard,
    },
  ],
})
export class AppModule { }
