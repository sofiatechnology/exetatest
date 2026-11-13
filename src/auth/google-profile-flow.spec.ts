jest.mock('../email/email.service', () => ({
  EmailService: class EmailService {},
}));

import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/sequelize';
import request from 'supertest';
import { App } from 'supertest/types';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { JwtStrategy } from './jwt.strategy';
import { EmailService } from '../email/email.service';
import { Otp } from '../models/otp.model';
import { User } from '../models/user.model';
import { UsersController } from '../users/users.controller';
import { UsersService } from '../users/users.service';

describe('Google login token profile flow', () => {
  const jwtSecret = 'test-jwt-secret';
  const userId = 'c6151bf1-a7e4-4267-bbd5-74362c61129c';
  const avatar = 'https://cdn.example.com/avatar.png';
  const userState = {
    id: userId,
    email: 'student@example.com',
    avatar,
    hasSelectedSections: true,
    isFirstLogin: false,
    section_id: '01',
    section: 'Latin-Philo',
    country: 'CD',
    region: 'GOMA',
    current_streak: 1,
    longest_streak: 1,
  };

  let app: INestApplication;
  let authService: AuthService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [JwtModule.register({ secret: jwtSecret }), PassportModule],
      controllers: [UsersController],
      providers: [
        AuthService,
        JwtStrategy,
        JwtAuthGuard,
        {
          provide: ConfigService,
          useValue: {
            get: (key: string) =>
              key === 'JWT_SECRET' ? jwtSecret : undefined,
          },
        },
        { provide: getModelToken(User), useValue: {} },
        { provide: getModelToken(Otp), useValue: {} },
        {
          provide: EmailService,
          useValue: { sendLoginNotification: jest.fn() },
        },
        {
          provide: UsersService,
          useValue: {
            getUserAuthState: jest.fn().mockResolvedValue(userState),
          },
        },
      ],
    }).compile();

    app = module.createNestApplication();
    app.setGlobalPrefix('api');
    authService = module.get(AuthService);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('accepts the login token on the profile route and returns the avatar URL', async () => {
    const login = await authService.login(
      { id: userId, email: 'student@example.com' } as User,
      '127.0.0.1',
      { notifyLoginEmail: false },
    );

    const response = await request(app.getHttpServer() as App)
      .get('/api/users/me/profile')
      .set('Authorization', `Bearer ${login.access_token}`)
      .expect(200);

    expect(response.body).toEqual(expect.objectContaining(userState));
    expect(response.body).toEqual(expect.objectContaining({ avatar }));
  });
});
