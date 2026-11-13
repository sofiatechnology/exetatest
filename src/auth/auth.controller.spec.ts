jest.mock('../email/email.service', () => ({
  EmailService: class EmailService {},
}));

import { HttpStatus, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { User } from '../models/user.model';

describe('AuthController Google callback', () => {
  let controller: AuthController;
  const authService = {
    login: jest.fn(),
  };
  const configService = {
    getOrThrow: jest.fn().mockReturnValue('exetatest://auth/google/callback'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: authService },
        { provide: ConfigService, useValue: configService },
      ],
    }).compile();

    controller = module.get(AuthController);
    jest.clearAllMocks();
  });

  it('redirects with an encoded access token', async () => {
    authService.login.mockResolvedValue({
      access_token: 'token+/=',
      user: { avatar: 'https://cdn.example.com/avatar.png' },
    });
    const redirect = jest.fn();
    const response = { headersSent: false, redirect } as unknown as Response;
    const request = {
      ip: '127.0.0.1',
      socket: { remoteAddress: '127.0.0.1' },
      user: { id: 'user-id' },
    } as Request & { user: User };

    await controller.googleAuthCallback(request, response);

    expect(redirect).toHaveBeenCalledWith(
      HttpStatus.FOUND,
      'exetatest://auth/google/callback?access_token=token%2B%2F%3D',
    );
  });

  it('redirects failures with a generic code, not the underlying error', async () => {
    authService.login.mockRejectedValue(
      new Error('sensitive database error details'),
    );
    const redirect = jest.fn();
    const response = { headersSent: false, redirect } as unknown as Response;
    const request = {
      ip: '127.0.0.1',
      socket: { remoteAddress: '127.0.0.1' },
      user: { id: 'user-id' },
    } as Request & { user: User };
    const loggerError = jest
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => undefined);
    await controller.googleAuthCallback(request, response);
    loggerError.mockRestore();

    expect(redirect).toHaveBeenCalledWith(
      HttpStatus.FOUND,
      'exetatest://auth/google/callback?error=google_auth_failed',
    );
    expect(redirect).not.toHaveBeenCalledWith(
      HttpStatus.FOUND,
      expect.stringContaining('sensitive'),
    );
  });
});
