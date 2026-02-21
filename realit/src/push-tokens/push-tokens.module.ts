import { Module } from '@nestjs/common';
import { PushTokensService } from './push-tokens.service';
import { PushTokensController } from './push-tokens.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [PushTokensController],
    providers: [PushTokensService],
    exports: [PushTokensService], // exported for future push sending use
})
export class PushTokensModule { }
