import {
    Controller,
    Get,
    Patch,
    Body,
    Query,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import {
    ApiBearerAuth,
    ApiOperation,
    ApiResponse,
    ApiTags,
} from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { GetCurrentUser } from '../auth/decorators/get-current-user.decorator';
import { NotificationResponseDto } from './dto/notification-response.dto';
import { MarkReadDto } from './dto/mark-read.dto';
import { PaginationQueryDto } from '../profile/dto/pagination-query.dto';

@ApiTags('Notifications')
@ApiBearerAuth()
@Controller('notifications')
export class NotificationsController {
    constructor(private readonly notificationsService: NotificationsService) { }

    @Get()
    @ApiOperation({ summary: 'Get paginated notifications for the logged-in user' })
    @ApiResponse({ status: 200, type: [NotificationResponseDto] })
    getNotifications(
        @GetCurrentUser('sub') userId: string,
        @Query() pagination: PaginationQueryDto,
    ): Promise<NotificationResponseDto[]> {
        return this.notificationsService.getNotifications(userId, pagination);
    }

    @Patch('read')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Mark specific notifications as read' })
    @ApiResponse({ status: 204 })
    markAsRead(
        @GetCurrentUser('sub') userId: string,
        @Body() dto: MarkReadDto,
    ): Promise<void> {
        return this.notificationsService.markAsRead(userId, dto.ids);
    }

    @Patch('read-all')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Mark all notifications as read' })
    @ApiResponse({ status: 204 })
    markAllAsRead(@GetCurrentUser('sub') userId: string): Promise<void> {
        return this.notificationsService.markAllAsRead(userId);
    }
}
