import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({
    example: 'test@example.com',
    description: 'Email or Username',
  })
  @IsString()
  identifier: string; // email or username

  @ApiProperty({ example: 'securePassword123' })
  @IsString()
  password: string;
}
