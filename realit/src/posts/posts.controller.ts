import { Controller, Post, Body, Request } from '@nestjs/common';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { CreatePostResponseDto } from './dto/create-post-response.dto';
import { ConfirmPostMediaDto } from './dto/confirm-post-media.dto';
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiCreatedResponse,
  ApiBody,
  ApiResponse,
} from '@nestjs/swagger';

@ApiTags('posts')
@Controller('post') // Changed to singular /post as requested
export class PostsController {
  constructor(private readonly postsService: PostsService) { }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new post with media' })
  @ApiCreatedResponse({
    description: 'The post has been successfully created.',
    type: CreatePostResponseDto,
  })
  @ApiBody({ type: CreatePostDto })
  @Post()
  async create(
    @Request() req: any,
    @Body() createPostDto: CreatePostDto,
  ): Promise<CreatePostResponseDto> {
    // req.user is the payload return by AtStrategy.validate(), which returns { sub, email }
    return this.postsService.createPost(req.user.sub, createPostDto);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Confirm media upload completion' })
  @ApiResponse({ status: 200, description: 'Media status updated to active' })
  @Post('confirm')
  async confirm(@Request() req: any, @Body() dto: ConfirmPostMediaDto) {
    return this.postsService.confirmPostMedia(req.user.sub, dto);
  }
}
