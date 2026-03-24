import { Controller, Post, Delete, Body, Param, Request } from '@nestjs/common';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { CreatePostResponseDto } from './dto/create-post-response.dto';
import { ConfirmPostMediaDto } from './dto/confirm-post-media.dto';
import { DeletePostResponseDto } from './dto/delete-post-response.dto';
import { ToggleLikeResponseDto } from './dto/toggle-like-response.dto';
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiCreatedResponse,
  ApiBody,
  ApiResponse,
  ApiParam,
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

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a post and all its media' })
  @ApiParam({ name: 'id', description: 'Post ID (UUID)' })
  @ApiResponse({
    status: 200,
    description: 'Post and all associated media deleted',
    type: DeletePostResponseDto,
  })
  @Delete(':id')
  async delete(
    @Request() req: any,
    @Param('id') id: string,
  ): Promise<DeletePostResponseDto> {
    return this.postsService.deletePost(req.user.sub, id);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Toggle like/unlike on a post' })
  @ApiParam({ name: 'id', description: 'Post ID (UUID)' })
  @ApiResponse({
    status: 200,
    description: 'Like toggled successfully',
    type: ToggleLikeResponseDto,
  })
  @Post(':id/like')
  async toggleLike(
    @Request() req: any,
    @Param('id') id: string,
  ): Promise<ToggleLikeResponseDto> {
    return this.postsService.toggleLike(req.user.sub, id);
  }
}
