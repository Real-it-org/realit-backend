import { ApiProperty } from '@nestjs/swagger';
import { ProfileResponseDto } from './profile-response.dto';

export class PublicProfileDto extends ProfileResponseDto {
    @ApiProperty()
    id: string;

    @ApiProperty()
    is_following: boolean;
}
