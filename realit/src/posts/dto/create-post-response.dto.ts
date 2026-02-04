import { ApiProperty } from '@nestjs/swagger';

export class PostMediaUploadDto {
  @ApiProperty({ description: 'Unique identifier for the media asset' })
  asset_id: string;

  @ApiProperty({
    description: 'Pre-signed URL for uploading the file (valid for 1 hour)',
  })
  upload_url: string;

  @ApiProperty({
    description: 'Object key where the file should be stored in the bucket',
  })
  object_key: string;
}

export class CreatePostResponseDto {
  @ApiProperty({ description: 'Unique identifier for the newly created post' })
  post_id: string;

  @ApiProperty({
    type: [PostMediaUploadDto],
    description: 'List of media items with upload URLs',
  })
  media: PostMediaUploadDto[];
}
