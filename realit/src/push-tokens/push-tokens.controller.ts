import {
    Controller,
    Post,
    Delete,
    Body,
    Param,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import {
    ApiBearerAuth,
    ApiOperation,
    ApiResponse,
    ApiTags,
} from '@nestjs/swagger';
import { PushTokensService } from './push-tokens.service';
import { GetCurrentUser } from '../auth/decorators/get-current-user.decorator';
import { RegisterPushTokenDto } from './dto/register-push-token.dto';

@ApiTags('Push Tokens')
@ApiBearerAuth()
@Controller('push-tokens')
export class PushTokensController {
    constructor(private readonly pushTokensService: PushTokensService) { }

    @Post()
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Register a device push token (FCM/APNs)' })
    @ApiResponse({ status: 204 })
    register(
        @GetCurrentUser('sub') userId: string,
        @Body() dto: RegisterPushTokenDto,
    ): Promise<void> {
        return this.pushTokensService.register(userId, dto.token, dto.platform);
    }

    @Delete(':token')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Unregister a push token (call on logout from a device)' })
    @ApiResponse({ status: 204 })
    unregister(
        @GetCurrentUser('sub') userId: string,
        @Param('token') token: string,
    ): Promise<void> {
        return this.pushTokensService.unregister(userId, token);
    }
}
