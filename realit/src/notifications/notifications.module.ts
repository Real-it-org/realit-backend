import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [NotificationsController],
    providers: [NotificationsService],
    exports: [NotificationsService], // exported so ProfileModule, PostsModule etc. can inject it
})
export class NotificationsModule { }
