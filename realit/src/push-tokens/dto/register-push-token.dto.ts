import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsIn } from 'class-validator';

export class RegisterPushTokenDto {
    @ApiProperty({ description: 'FCM or APNs device token' })
    @IsString()
    token: string;

    @ApiProperty({ enum: ['ios', 'android'] })
    @IsString()
    @IsIn(['ios', 'android'])
    platform: string;
}
