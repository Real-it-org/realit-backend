import { Module } from '@nestjs/common';
import { ProfileController } from './profile.controller';
import { ProfileService } from './profile.service';
import { PrismaService } from '../prisma/prisma.service';
import { StorageModule } from '../storage/storage.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [StorageModule, NotificationsModule],
  controllers: [ProfileController],
  providers: [ProfileService, PrismaService],
})
export class ProfileModule { }
