import {
  IsString,
  IsNotEmpty,
  IsArray,
  ValidateNested,
  IsEnum,
  IsInt,
} from 'class-validator';
import { Type } from 'class-transformer';
import { MediaType } from '../../generated/prisma/client';
import { ApiProperty } from '@nestjs/swagger';

export class PostMediaItemDto {
  @ApiProperty({
    enum: MediaType,
    description: 'Type of media (IMAGE or VIDEO)',
  })
  @IsEnum(MediaType)
  media_type: MediaType;

  @ApiProperty({
    description: 'Size of the media file in bytes',
    example: 1024,
  })
  @IsInt()
  size_bytes: number;

  @ApiProperty({
    description: 'Original filename with extension',
    example: 'photo.jpg',
  })
  @IsString()
  @IsNotEmpty()
  filename: string;
}

export class CreatePostDto {
  @ApiProperty({
    description: 'Heading or title of the post',
    required: false,
    example: 'My Vacation',
  })
  @IsString()
  heading?: string;

  @ApiProperty({
    description: 'Detailed description of the post',
    required: false,
    example: 'Had a great time!',
  })
  @IsString()
  description?: string;

  @ApiProperty({
    type: [PostMediaItemDto],
    description: 'List of media items to be uploaded',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PostMediaItemDto)
  media: PostMediaItemDto[];
}
