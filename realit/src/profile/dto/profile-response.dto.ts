import { ApiProperty } from '@nestjs/swagger';

export class ProfileResponseDto {
  @ApiProperty()
  username: string;

  @ApiProperty({ required: false, type: String, nullable: true })
  display_name: string | null;

  @ApiProperty({ required: false, type: String, nullable: true })
  bio: string | null;

  @ApiProperty({ required: false, type: String, nullable: true })
  avatar_url: string | null;

  @ApiProperty({ required: false, type: String, nullable: true })
  website: string | null;

  @ApiProperty()
  is_private: boolean;

  @ApiProperty()
  followers_count: number;

  @ApiProperty()
  following_count: number;

  @ApiProperty()
  posts_count: number;

  @ApiProperty()
  unread_notifications_count: number;
}
