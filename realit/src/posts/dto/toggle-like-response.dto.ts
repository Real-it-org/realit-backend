import { ApiProperty } from '@nestjs/swagger';

export class ToggleLikeResponseDto {
    @ApiProperty({ description: 'Whether the post is now liked by the user' })
    liked: boolean;

    @ApiProperty({ description: 'Updated total likes count for the post' })
    likes_count: number;
}
