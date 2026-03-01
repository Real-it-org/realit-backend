import { Module } from '@nestjs/common';
import { FeedController } from './feed.controller';
import { FeedService } from './feed.service';
import { PrismaModule } from '../prisma/prisma.module';
import { StorageModule } from '../storage/storage.module';

@Module({
    imports: [PrismaModule, StorageModule],
    controllers: [FeedController],
    providers: [FeedService],
})
export class FeedModule { }
