import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { Tokens } from './types';
import { RtGuard } from './guards/rt.guard';
import { GetCurrentUser } from './decorators/get-current-user.decorator';

import { Public } from './decorators/public.decorator';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Public()
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'User successfully registered. Returns access and refresh tokens.',
  })
  @ApiResponse({ status: HttpStatus.CONFLICT, description: 'Email or Username already exists' })
  @Post('signup')
  @HttpCode(HttpStatus.CREATED)
  signup(@Body() dto: SignupDto): Promise<Tokens> {
    return this.authService.signup(dto);
  }

  @Public()
  @ApiOperation({ summary: 'Login user' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User successfully logged in. Returns access and refresh tokens.',
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Invalid credentials' })
  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: LoginDto): Promise<Tokens> {
    return this.authService.login(dto);
  }

  @ApiOperation({ summary: 'Logout user' })
  @ApiResponse({ status: HttpStatus.OK, description: 'User successfully logged out.' })
  @ApiBearerAuth()
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  logout(@GetCurrentUser('sub') userId: string, @GetCurrentUser('rt_id') rtId: string) {
    return this.authService.logout(userId, rtId);
  }

  @Public()
  @ApiOperation({ summary: 'Refresh access tokens' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Tokens successfully refreshed. Returns new access and refresh tokens.',
  })
  @ApiBearerAuth()
  @UseGuards(RtGuard)
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  refreshTokens(
    @GetCurrentUser('sub') userId: string,
    @GetCurrentUser('refreshToken') refreshToken: string,
  ) {
    return this.authService.refreshTokens(userId, refreshToken);
  }
}
