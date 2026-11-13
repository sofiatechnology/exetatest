jest.mock('../email/email.service', () => ({
  EmailService: class EmailService {},
}));

jest.mock('google-auth-library', () => {
  const client = {
    generateAuthUrl: jest.fn(),
    getToken: jest.fn(),
    verifyIdToken: jest.fn(),
  };
  return {
    OAuth2Client: jest.fn().mockImplementation(() => client),
    CodeChallengeMethod: { S256: 'S256', Plain: 'plain' },
    __mockClient: client,
  };
});

import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/sequelize';
import { AuthService } from './auth.service';
import { Otp } from '../models/otp.model';
import { User } from '../models/user.model';
import { UsersService } from '../users/users.service';
import { EmailService } from '../email/email.service';

type GoogleClientMock = {
  generateAuthUrl: jest.Mock;
  getToken: jest.Mock;
  verifyIdToken: jest.Mock;
};

type GoogleAuthOptions = {
  state: string;
  scope: string[];
  redirect_uri: string;
  code_challenge?: string;
  code_challenge_method?: string;
};

const googleClient = jest.requireMock<{ __mockClient: GoogleClientMock }>(
  'google-auth-library',
).__mockClient;

describe('AuthService Google OAuth', () => {
  let service: AuthService;
  const userModel = {
    findOrCreate: jest.fn(),
  };
  const usersService = {
    getUserAuthState: jest.fn(),
  };
  const emailService = {
    sendLoginNotification: jest.fn(),
  };
  const user = {
    id: 'user-id',
    email: 'student@example.com',
    avatar: null,
    update: jest.fn(),
  };
  const configValues: Record<string, string> = {
    JWT_SECRET: 'test-jwt-secret',
    GOOGLE_CLIENT_ID: 'google-client-id',
    GOOGLE_CLIENT_SECRET: 'google-client-secret',
    GOOGLE_REDIRECT_URI: 'http://localhost:9080/api/auth/callback',
    WEB_URL: 'http://localhost:8081',
    APP_SCHEME: 'exetatest://',
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    userModel.findOrCreate.mockResolvedValue([user, true]);
    usersService.getUserAuthState.mockResolvedValue({
      id: user.id,
      email: user.email,
    });
    emailService.sendLoginNotification.mockResolvedValue(undefined);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: ConfigService,
          useValue: {
            get: (key: string) => configValues[key],
            getOrThrow: (key: string) => {
              const value = configValues[key];
              if (!value) {
                throw new Error(`Missing test configuration: ${key}`);
              }
              return value;
            },
          },
        },
        { provide: getModelToken(User), useValue: userModel },
        { provide: getModelToken(Otp), useValue: {} },
        { provide: JwtService, useValue: { sign: () => 'exetatest-jwt' } },
        { provide: UsersService, useValue: usersService },
        { provide: EmailService, useValue: emailService },
      ],
    }).compile();

    service = module.get(AuthService);
  });

  it('uses the backend callback URI and preserves the Expo redirect and PKCE', () => {
    let authorizationOptions: GoogleAuthOptions | undefined;
    googleClient.generateAuthUrl.mockImplementation(
      (options: GoogleAuthOptions) => {
        authorizationOptions = options;
        return 'https://google.example.com';
      },
    );

    const url = service.createGoogleAuthorizationUrl({
      redirect_uri: 'http://localhost:8081',
      state: 'expo-state1',
      client_id: 'google-client-id',
      response_type: 'code',
      scope: 'openid email profile',
      code_challenge: 'A'.repeat(43),
      code_challenge_method: 'plain',
    });

    expect(url).toBe('https://google.example.com');
    expect(authorizationOptions).toEqual(
      expect.objectContaining({
        code_challenge: 'A'.repeat(43),
        code_challenge_method: 'plain',
        scope: ['openid', 'email', 'profile'],
        redirect_uri: configValues.GOOGLE_REDIRECT_URI,
      }),
    );
    if (!authorizationOptions) {
      throw new Error('Google authorization options were not generated');
    }
    expect(service.verifyGoogleOAuthState(authorizationOptions.state)).toEqual(
      expect.objectContaining({
        platform: 'web',
        appRedirect: 'http://localhost:8081',
        state: 'expo-state1',
      }),
    );
  });

  it('rejects a client id that does not match the backend Google client', () => {
    expect(() =>
      service.createGoogleAuthorizationUrl({
        redirect_uri: 'http://localhost:8081',
        state: 'expo-state1',
        client_id: 'another-google-client',
      }),
    ).toThrow(BadRequestException);
  });

  it('rejects scopes beyond Google identity', () => {
    expect(() =>
      service.createGoogleAuthorizationUrl({
        redirect_uri: 'http://localhost:8081',
        state: 'expo-state1',
        scope: 'openid https://www.googleapis.com/auth/drive',
      }),
    ).toThrow(BadRequestException);
  });

  it('requires a PKCE challenge when a challenge method is provided', () => {
    expect(() =>
      service.createGoogleAuthorizationUrl({
        redirect_uri: 'http://localhost:8081',
        state: 'expo-state1',
        code_challenge_method: 'S256',
      }),
    ).toThrow(BadRequestException);
  });

  it('rejects redirects outside the configured web origin', () => {
    expect(() =>
      service.createGoogleAuthorizationUrl({
        redirect_uri: 'https://attacker.example/auth/callback',
        state: 'expo-state1',
      }),
    ).toThrow(BadRequestException);
  });

  it('rejects URLs that merely share the configured web URL prefix', () => {
    expect(() =>
      service.createGoogleAuthorizationUrl({
        redirect_uri: 'http://localhost:8081.attacker.example',
        state: 'expo-state1',
      }),
    ).toThrow(BadRequestException);
  });

  it('exchanges the code and only signs in a Google-verified email', async () => {
    googleClient.getToken.mockResolvedValue({
      tokens: { id_token: 'google-id-token' },
    });
    googleClient.verifyIdToken.mockResolvedValue({
      getPayload: () => ({
        email: 'STUDENT@example.com',
        email_verified: true,
        picture: 'https://cdn.example.com/avatar.png',
      }),
    });

    await expect(
      service.authenticateGoogleCode(
        'google-auth-code',
        'A'.repeat(43),
        '127.0.0.1',
      ),
    ).resolves.toEqual({
      access_token: 'exetatest-jwt',
      user: { id: user.id, email: user.email },
    });

    expect(googleClient.getToken).toHaveBeenCalledWith({
      code: 'google-auth-code',
      codeVerifier: 'A'.repeat(43),
      redirect_uri: configValues.GOOGLE_REDIRECT_URI,
    });
    expect(userModel.findOrCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { email: 'student@example.com' },
      }),
    );
  });

  it('rejects Google identities without a verified email', async () => {
    googleClient.getToken.mockResolvedValue({
      tokens: { id_token: 'google-id-token' },
    });
    googleClient.verifyIdToken.mockResolvedValue({
      getPayload: () => ({
        email: 'student@example.com',
        email_verified: false,
      }),
    });

    await expect(
      service.authenticateGoogleCode(
        'google-auth-code',
        undefined,
        '127.0.0.1',
      ),
    ).rejects.toThrow(UnauthorizedException);
    expect(userModel.findOrCreate).not.toHaveBeenCalled();
  });
});
