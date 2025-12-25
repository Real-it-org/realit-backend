import { IsEmail, IsString, MinLength } from 'class-validator';

export class SignupDto {
  @IsEmail()
  email: string;

  @IsString()
  username: string;

  @IsString()
  display_name: string;

  @IsString()
  @MinLength(8)
  password: string;
}
