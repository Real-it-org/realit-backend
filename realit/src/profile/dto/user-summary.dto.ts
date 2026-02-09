import { ApiProperty } from '@nestjs/swagger';

export class UserSummaryDto {
    @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
    id: string;

    @ApiProperty({ example: 'johndoe' })
    username: string;

    @ApiProperty({ example: 'John Doe' })
    display_name: string | null;

    @ApiProperty({ example: 'https://example.com/avatar.jpg' })
    avatar_url: string | null;

    @ApiProperty({ example: false })
    is_private: boolean;
}
