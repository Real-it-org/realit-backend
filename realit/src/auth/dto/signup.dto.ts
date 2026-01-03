import { IsEmail, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SignupDto {
  @ApiProperty({ example: 'test@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'testuser' })
  @IsString()
  username: string;

  @ApiProperty({ example: 'Test User' })
  @IsString()
  display_name: string;

  @ApiProperty({ example: 'securePassword123', minLength: 8 })
  @IsString()
  @MinLength(8)
  password: string;
}
