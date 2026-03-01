import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MediaType, VerificationStatus } from '../../generated/prisma/client';

export class FeedPostMediaDto {
    @ApiProperty()
    media_url: string;

    @ApiProperty({ enum: MediaType })
    media_type: MediaType;

    @ApiProperty()
    position: number;
}

export class FeedPostAuthorDto {
    @ApiProperty()
    profile_id: string;

    @ApiProperty()
    username: string;

    @ApiPropertyOptional()
    display_name: string | null;

    @ApiPropertyOptional()
    avatar_url: string | null;
}

export class FeedPostDto {
    @ApiProperty()
    id: string;

    @ApiProperty()
    heading: string;

    @ApiProperty()
    description: string;

    @ApiProperty({ type: [FeedPostMediaDto] })
    media: FeedPostMediaDto[];

    @ApiProperty({ enum: VerificationStatus })
    verification_status: VerificationStatus;

    @ApiProperty()
    likes_count: number;

    @ApiProperty()
    comments_count: number;

    @ApiProperty()
    created_at: Date;

    @ApiProperty({ type: FeedPostAuthorDto })
    author: FeedPostAuthorDto;
}
