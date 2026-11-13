import { InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { buildGoogleMobileRedirectUrl } from './google-mobile-redirect.util';

describe('buildGoogleMobileRedirectUrl', () => {
  it('requires the configured URI to match the allowlist', () => {
    const configService = {
      getOrThrow: jest.fn().mockReturnValue('https://attacker.example'),
    } as unknown as ConfigService;

    expect(() =>
      buildGoogleMobileRedirectUrl(configService, {
        access_token: 'token',
      }),
    ).toThrow(InternalServerErrorException);
  });

  it('encodes redirect query values', () => {
    const configService = {
      getOrThrow: jest.fn().mockReturnValue('exetatest://auth/google/callback'),
    } as unknown as ConfigService;

    expect(
      buildGoogleMobileRedirectUrl(configService, {
        access_token: 'token+/=',
      }),
    ).toBe('exetatest://auth/google/callback?access_token=token%2B%2F%3D');
  });
});
