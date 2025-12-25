import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
  ) {}

  async signup(dto: SignupDto) {
    // Check uniqueness
    const exists = await this.prisma.users.findFirst({
      where: {
        OR: [{ email: dto.email }, { username: dto.username }],
      },
    });

    if (exists) {
      throw new ConflictException('Email or username already in use');
    }

    const password_hash = await bcrypt.hash(dto.password, 12);

    const user = await this.prisma.users.create({
      data: {
        email: dto.email,
        username: dto.username,
        display_name: dto.display_name,
        password_hash,
      },
    });

    return this.signToken(user.id);
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.users.findFirst({
      where: {
        OR: [
          { email: dto.identifier },
          { username: dto.identifier },
        ],
        is_active: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const valid = await bcrypt.compare(
      dto.password,
      user.password_hash,
    );

    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.signToken(user.id);
  }

  private signToken(userId: string) {
    const payload = { sub: userId };
    return {
      access_token: this.jwt.sign(payload),
    };
  }
}
