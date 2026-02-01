import {
  Injectable,
  ForbiddenException,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { Tokens, JwtPayload } from './types';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
  ) { }

  async signup(dto: SignupDto): Promise<Tokens> {
    const exists = await this.prisma.users.findFirst({
      where: {
        OR: [{ email: dto.email }, { username: dto.username }],
      },
    });

    if (exists) {
      throw new ConflictException('Email or username already in use');
    }

    const password_hash = await bcrypt.hash(dto.password, 12);

    const user = await this.prisma.$transaction(async (tx) => {
      const newUser = await tx.users.create({
        data: {
          email: dto.email,
          username: dto.username,
          password_hash,
        },
      });

      await tx.profiles.create({
        data: {
          user_id: newUser.id,
          username: dto.username,
          display_name: dto.display_name,
        },
      });

      return newUser;
    });

    return this.generateTokensAndSave(user.id, user.email);
  }

  async login(dto: LoginDto): Promise<Tokens> {
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

    return this.generateTokensAndSave(user.id, user.email);
  }

  async logout(userId: string, rtId: string) {
    if (rtId) {
      await this.prisma.refresh_tokens.update({
        where: { id: rtId },
        data: { is_revoked: true },
      }).catch(() => { });
    }
  }

  async refreshTokens(userId: string, rt: string): Promise<Tokens> {
    const decoded = this.jwt.decode(rt) as any;
    if (!decoded || !decoded.rt_id) throw new ForbiddenException('Invalid Token Structure');

    const rtId = decoded.rt_id;

    const tokenRecord = await this.prisma.refresh_tokens.findUnique({
      where: { id: rtId },
    });

    if (!tokenRecord) throw new ForbiddenException('Access Denied');
    if (tokenRecord.is_revoked) throw new ForbiddenException('Access Denied');

    const isMatch = await bcrypt.compare(rt, tokenRecord.token_hash);
    if (!isMatch) throw new ForbiddenException('Access Denied');

    // Rotation: Revoke old (or delete) to prevent reuse
    // We can just delete it to keep table clean, or mark revoked for audit.
    // Let's delete for simplicity and space.
    await this.prisma.refresh_tokens.delete({
      where: { id: rtId }
    });

    const user = await this.prisma.users.findUnique({ where: { id: userId } });
    if (!user) throw new ForbiddenException('User not found');

    return this.generateTokensAndSave(user.id, user.email);
  }

  private async generateTokensAndSave(userId: string, email: string): Promise<Tokens> {
    const rtId = crypto.randomUUID();

    const [at, rt] = await Promise.all([
      this.jwt.signAsync(
        { sub: userId, email, rt_id: rtId },
        { secret: this.config.get<string>('AT_SECRET'), expiresIn: '15m' },
      ),
      this.jwt.signAsync(
        { sub: userId, email, rt_id: rtId },
        { secret: this.config.get<string>('RT_SECRET'), expiresIn: '7d' },
      ),
    ]);

    const hash = await bcrypt.hash(rt, 10);

    await this.prisma.refresh_tokens.create({
      data: {
        id: rtId,
        user_id: userId,
        token_hash: hash,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      }
    });

    return {
      access_token: at,
      refresh_token: rt,
    };
  }
}

