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
    },
  };

  const mockJwtService = {
    sign: jest.fn().mockReturnValue('signed-token'),
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
    it('should create a new user and return a token', async () => {
      mockPrisma.users.findFirst.mockResolvedValue(null);
      mockPrisma.users.create.mockImplementation(async ({ data }) => ({
        ...data,
        id: 'uuid-123',
      }));

      const result = await service.signup({
        email: 'test@test.com',
        username: 'testuser',
        display_name: 'Test User',
        password: 'password123',
      });

      expect(result).toEqual({ access_token: 'signed-token' });
      expect(mockPrisma.users.create).toHaveBeenCalled();
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
    it('should return token for valid credentials', async () => {
      const passwordHash = await bcrypt.hash('password123', 12);
      mockPrisma.users.findFirst.mockResolvedValue({
        id: 'uuid-123',
        password_hash: passwordHash,
        is_active: true,
      });

      const result = await service.login({
        identifier: 'test@test.com',
        password: 'password123',
      });

      expect(result).toEqual({ access_token: 'signed-token' });
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
