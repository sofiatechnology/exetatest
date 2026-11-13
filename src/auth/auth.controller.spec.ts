jest.mock('../email/email.service', () => ({
  EmailService: class EmailService {},
}));

import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { AUTH_COOKIE_NAME, AUTH_TOKEN_TTL_MS } from './auth.constants';

describe('AuthController Google OAuth', () => {
  let controller: AuthController;
  const authService = {
    createGoogleAuthorizationUrl: jest.fn(),
    verifyGoogleOAuthState: jest.fn(),
    authenticateGoogleCode: jest.fn(),
    getSessionUserState: jest.fn(),
  };
  const configService = {
    get: jest.fn((key: string) =>
      key === 'NODE_ENV' ? 'production' : undefined,
    ),
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

  it('redirects authorization requests to Google', () => {
    authService.createGoogleAuthorizationUrl.mockReturnValue(
      'https://accounts.google.com/oauth',
    );
    const redirect = jest.fn();

    controller.googleAuthorize(
      {
        redirect_uri: 'exetatest://auth/google/callback',
        state: 'random-client-state-1234567890',
      },
      { redirect } as unknown as Response,
    );

    expect(redirect).toHaveBeenCalledWith('https://accounts.google.com/oauth');
  });

  it('forwards the authorization code and original state to the approved client', () => {
    authService.verifyGoogleOAuthState.mockReturnValue({
      platform: 'web',
      appRedirect: 'https://app.example.com',
      state: 'client-state-1234567890',
      issuedAt: Date.now(),
    });
    const redirect = jest.fn();

    controller.googleOAuthCallback(
      { state: 'signed-state', code: 'google-code' },
      { redirect } as unknown as Response,
    );

    expect(redirect).toHaveBeenCalledWith(
      302,
      'https://app.example.com?code=google-code&state=client-state-1234567890',
    );
  });

  it('forwards OAuth errors and preserves existing app redirect query parameters', () => {
    authService.verifyGoogleOAuthState.mockReturnValue({
      platform: 'web',
      appRedirect: 'http://localhost:8081?from=login',
      state: 'client-state',
      issuedAt: Date.now(),
    });
    const redirect = jest.fn();

    controller.googleOAuthCallback(
      { state: 'signed-state', error: 'access_denied' },
      { redirect } as unknown as Response,
    );

    expect(redirect).toHaveBeenCalledWith(
      302,
      'http://localhost:8081?from=login&error=access_denied&state=client-state',
    );
  });

  it('stores a web login token in an HttpOnly cookie', async () => {
    authService.authenticateGoogleCode.mockResolvedValue({
      access_token: 'session-token',
      user: {},
    });
    const cookie = jest.fn();
    const request = {
      ip: '127.0.0.1',
      socket: { remoteAddress: '127.0.0.1' },
    } as Request;

    await expect(
      controller.googleToken(
        { code: 'google-code', platform: 'web' },
        request,
        { cookie } as unknown as Response,
      ),
    ).resolves.toEqual({
      access_token: 'web-cookie',
      token_type: 'cookie',
    });

    expect(cookie).toHaveBeenCalledWith(
      AUTH_COOKIE_NAME,
      'session-token',
      expect.objectContaining({
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        maxAge: AUTH_TOKEN_TTL_MS,
      }),
    );
  });

  it('returns a Bearer token to mobile clients without setting a cookie', async () => {
    authService.authenticateGoogleCode.mockResolvedValue({
      access_token: 'session-token',
      user: {},
    });
    const cookie = jest.fn();

    await expect(
      controller.googleToken(
        {
          code: 'google-code',
          platform: 'mobile',
          redirect_uri: 'https://attacker.example/callback',
        },
        {
          ip: '127.0.0.1',
          socket: { remoteAddress: '127.0.0.1' },
        } as Request,
        { cookie } as unknown as Response,
      ),
    ).resolves.toEqual({
      access_token: 'session-token',
      token_type: 'Bearer',
    });

    expect(cookie).not.toHaveBeenCalled();
    expect(authService.authenticateGoogleCode).toHaveBeenCalledWith(
      'google-code',
      undefined,
      '127.0.0.1',
    );
  });

  it('restores session details and expiry from the authenticated request', async () => {
    authService.getSessionUserState.mockResolvedValue({
      id: 'user-id',
      email: 'student@example.com',
    });

    await expect(
      controller.session({
        user: { id: 'user-id', exp: 1_800_000_000 },
      } as Request & { user: { id: string; exp?: number } }),
    ).resolves.toEqual({
      id: 'user-id',
      email: 'student@example.com',
      exp: 1_800_000_000,
      cookieExpiration: 1_800_000_000,
    });
  });

  it('clears the web session cookie on logout', () => {
    const clearCookie = jest.fn();

    expect(controller.logout({ clearCookie } as unknown as Response)).toEqual({
      success: true,
    });
    expect(clearCookie).toHaveBeenCalledWith(AUTH_COOKIE_NAME, { path: '/' });
  });
});
