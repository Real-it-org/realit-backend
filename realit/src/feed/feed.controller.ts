import { Controller, Get, Query } from '@nestjs/common';
import {
    ApiBearerAuth,
    ApiOperation,
    ApiResponse,
    ApiTags,
} from '@nestjs/swagger';
import { GetCurrentUser } from '../auth/decorators/get-current-user.decorator';
import { FeedService } from './feed.service';
import { FeedQueryDto } from './dto/feed-query.dto';
import { FeedPostDto } from './dto/feed-post.dto';

@ApiTags('Feed')
@ApiBearerAuth()
@Controller('feed')
export class FeedController {
    constructor(private readonly feedService: FeedService) { }

    @Get()
    @ApiOperation({ summary: 'Get personalized feed (posts from followed users + own)' })
    @ApiResponse({
        status: 200,
        description: 'Returns a paginated list of feed posts with author info and signed media URLs',
        type: [FeedPostDto],
    })
    async getFeed(
        @GetCurrentUser('sub') userId: string,
        @Query() query: FeedQueryDto,
    ): Promise<FeedPostDto[]> {
        return this.feedService.getFeed(userId, query);
    }
}
