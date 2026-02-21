import { ApiProperty } from '@nestjs/swagger';

export class FollowRequestActorDto {
    @ApiProperty()
    id: string;

    @ApiProperty()
    username: string;

    @ApiProperty({ nullable: true })
    display_name: string | null;

    @ApiProperty({ nullable: true })
    avatar_url: string | null;
}

export class FollowRequestResponseDto {
    @ApiProperty()
    id: string;

    @ApiProperty({ type: FollowRequestActorDto })
    requester: FollowRequestActorDto;

    @ApiProperty()
    created_at: Date;
}
