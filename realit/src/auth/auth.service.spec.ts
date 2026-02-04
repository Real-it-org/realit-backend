import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { ConflictException, UnauthorizedException } from '@nestjs/common';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: PrismaService;
  let jwtService: JwtService;

  const mockPrisma = {
    users: {
      findFirst: jest.fn(),
      create: jest.fn(),
      findUnique: jest.fn(),
    },
    refresh_tokens: {
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findUnique: jest.fn(),
    },
  };

  const mockJwtService = {
    signAsync: jest.fn().mockResolvedValue('signed-token'),
    decode: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prisma = module.get<PrismaService>(PrismaService);
    jwtService = module.get<JwtService>(JwtService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('signup', () => {
    it('should create a new user and return tokens', async () => {
      mockPrisma.users.findFirst.mockResolvedValue(null);
      mockPrisma.users.create.mockImplementation(async ({ data }) => ({
        ...data,
        id: 'uuid-123',
      }));
      mockPrisma.refresh_tokens.create.mockResolvedValue({});

      const result = await service.signup({
        email: 'test@test.com',
        username: 'testuser',
        display_name: 'Test User',
        password: 'password123',
      });

      expect(result).toEqual({
        access_token: 'signed-token',
        refresh_token: 'signed-token',
      });
      expect(mockPrisma.users.create).toHaveBeenCalled();
      expect(mockPrisma.refresh_tokens.create).toHaveBeenCalled();
    });

    it('should throw ConflictException if email or username exists', async () => {
      mockPrisma.users.findFirst.mockResolvedValue({ id: 'existing' });

      await expect(
        service.signup({
          email: 'test@test.com',
          username: 'testuser',
          display_name: 'Test User',
          password: 'password123',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('login', () => {
    it('should return tokens for valid credentials', async () => {
      const passwordHash = await bcrypt.hash('password123', 12);
      mockPrisma.users.findFirst.mockResolvedValue({
        id: 'uuid-123',
        email: 'test@test.com',
        password_hash: passwordHash,
        is_active: true,
      });
      mockPrisma.refresh_tokens.create.mockResolvedValue({});

      const result = await service.login({
        identifier: 'test@test.com',
        password: 'password123',
      });

      expect(result).toEqual({
        access_token: 'signed-token',
        refresh_token: 'signed-token',
      });
    });

    it('should throw UnauthorizedException if user not found', async () => {
      mockPrisma.users.findFirst.mockResolvedValue(null);

      await expect(
        service.login({ identifier: 'nonexistent', password: '123' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if password is wrong', async () => {
      const passwordHash = await bcrypt.hash('password123', 12);
      mockPrisma.users.findFirst.mockResolvedValue({
        id: 'uuid-123',
        password_hash: passwordHash,
        is_active: true,
      });

      await expect(
        service.login({ identifier: 'test@test.com', password: 'wrongpass' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
