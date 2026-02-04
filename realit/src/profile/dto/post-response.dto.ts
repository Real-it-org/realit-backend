import { ApiProperty } from '@nestjs/swagger';
import { MediaType, VerificationStatus } from '../../generated/prisma/client';

export class PostMediaResponseDto {
  @ApiProperty()
  media_url: string;

  @ApiProperty({ enum: MediaType })
  media_type: MediaType;

  @ApiProperty()
  position: number;
}

export class PostResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  heading: string;

  @ApiProperty()
  description: string;

  @ApiProperty({ type: [PostMediaResponseDto] })
  media: PostMediaResponseDto[];

  @ApiProperty({ enum: VerificationStatus })
  verification_status: VerificationStatus;

  @ApiProperty()
  likes_count: number;

  @ApiProperty()
  comments_count: number;

  @ApiProperty()
  created_at: Date;
}
