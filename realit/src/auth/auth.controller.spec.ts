import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let controller: AuthController;
  let service: AuthService;

  const mockAuthService = {
    signup: jest.fn(),
    login: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: mockAuthService }],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('signup', () => {
    it('should call authService.signup and return a token', async () => {
      const dto = {
        email: 'test@test.com',
        username: 'testuser',
        display_name: 'Test User',
        password: 'password123',
      };
      mockAuthService.signup.mockResolvedValue({ access_token: 'token' });

      const result = await controller.signup(dto);

      expect(result).toEqual({ access_token: 'token' });
      expect(mockAuthService.signup).toHaveBeenCalledWith(dto);
    });
  });

  describe('login', () => {
    it('should call authService.login and return a token', async () => {
      const dto = { identifier: 'test@test.com', password: 'password123' };
      mockAuthService.login.mockResolvedValue({ access_token: 'token' });

      const result = await controller.login(dto);

      expect(result).toEqual({ access_token: 'token' });
      expect(mockAuthService.login).toHaveBeenCalledWith(dto);
    });
  });
});
