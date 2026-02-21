import { ApiProperty } from '@nestjs/swagger';
import { NotificationType } from '../../generated/prisma/client';

export class NotificationActorDto {
    @ApiProperty()
    id: string;

    @ApiProperty()
    username: string;

    @ApiProperty({ nullable: true })
    display_name: string | null;

    @ApiProperty({ nullable: true })
    avatar_url: string | null;
}

export class NotificationResponseDto {
    @ApiProperty()
    id: string;

    @ApiProperty({ enum: NotificationType })
    type: NotificationType;

    @ApiProperty({ type: NotificationActorDto })
    actor: NotificationActorDto;

    @ApiProperty({ nullable: true })
    post_id: string | null;

    @ApiProperty({ nullable: true })
    comment_id: string | null;

    @ApiProperty()
    is_read: boolean;

    @ApiProperty()
    created_at: Date;
}
