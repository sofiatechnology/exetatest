import { BadRequestException } from '@nestjs/common';
import {
  GoogleOAuthState,
  signGoogleOAuthState,
  verifyGoogleOAuthState,
} from './google-oauth-state.util';

describe('Google OAuth state', () => {
  const secret = 'test-jwt-secret';
  const state: GoogleOAuthState = {
    platform: 'web',
    appRedirect: 'https://app.example.com',
    state: 'random-client-state-123456',
    issuedAt: 1_000,
  };

  it('round-trips signed state', () => {
    const signed = signGoogleOAuthState(state, secret);

    expect(verifyGoogleOAuthState(signed, secret, 2_000)).toEqual(state);
  });

  it('rejects altered or expired state', () => {
    const signed = signGoogleOAuthState(state, secret);
    const [payload, signature] = signed.split('.');
    const altered = `${payload}.${signature.slice(0, -1)}a`;

    expect(() => verifyGoogleOAuthState(altered, secret, 2_000)).toThrow(
      BadRequestException,
    );
    expect(() => verifyGoogleOAuthState(signed, secret, 602_000)).toThrow(
      BadRequestException,
    );
  });
});
