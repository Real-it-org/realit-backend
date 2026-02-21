import {
    Controller,
    Get,
    Post,
    Delete,
    Param,
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
import { FollowRequestsService } from './follow-requests.service';
import { GetCurrentUser } from '../auth/decorators/get-current-user.decorator';
import { FollowRequestResponseDto } from './dto/follow-request-response.dto';
import { PaginationQueryDto } from '../profile/dto/pagination-query.dto';

@ApiTags('Follow Requests')
@ApiBearerAuth()
@Controller('follow-requests')
export class FollowRequestsController {
    constructor(private readonly followRequestsService: FollowRequestsService) { }

    @Get('pending')
    @ApiOperation({ summary: 'List pending incoming follow requests' })
    @ApiResponse({ status: 200, type: [FollowRequestResponseDto] })
    getPendingRequests(
        @GetCurrentUser('sub') userId: string,
        @Query() pagination: PaginationQueryDto,
    ): Promise<FollowRequestResponseDto[]> {
        return this.followRequestsService.getPendingRequests(userId, pagination);
    }

    @Post(':id/accept')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Accept a follow request' })
    @ApiResponse({ status: 204 })
    acceptRequest(
        @GetCurrentUser('sub') userId: string,
        @Param('id') requestId: string,
    ): Promise<void> {
        return this.followRequestsService.acceptRequest(userId, requestId);
    }

    @Delete(':id/reject')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Reject (hard-delete) a follow request — re-requests allowed' })
    @ApiResponse({ status: 204 })
    rejectRequest(
        @GetCurrentUser('sub') userId: string,
        @Param('id') requestId: string,
    ): Promise<void> {
        return this.followRequestsService.rejectRequest(userId, requestId);
    }
}
