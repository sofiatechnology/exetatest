import { BadRequestException } from '@nestjs/common';
import { createHmac, timingSafeEqual } from 'crypto';

export interface GoogleOAuthState {
  platform: 'mobile' | 'web';
  appRedirect: string;
  state: string;
  issuedAt: number;
}

const STATE_TTL_MS = 10 * 60 * 1000;

export function signGoogleOAuthState(
  state: GoogleOAuthState,
  secret: string,
): string {
  const encoded = Buffer.from(JSON.stringify(state)).toString('base64url');
  const signature = createHmac('sha256', secret)
    .update(encoded)
    .digest('base64url');
  return `${encoded}.${signature}`;
}

export function verifyGoogleOAuthState(
  value: string,
  secret: string,
  now = Date.now(),
): GoogleOAuthState {
  const [encoded, signature, extra] = value.split('.');
  if (!encoded || !signature || extra !== undefined) {
    throw new BadRequestException('Invalid OAuth state');
  }

  const expected = createHmac('sha256', secret).update(encoded).digest();
  let received: Buffer;
  try {
    received = Buffer.from(signature, 'base64url');
  } catch {
    throw new BadRequestException('Invalid OAuth state');
  }

  if (
    received.length !== expected.length ||
    !timingSafeEqual(received, expected)
  ) {
    throw new BadRequestException('Invalid OAuth state');
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8'));
  } catch {
    throw new BadRequestException('Invalid OAuth state');
  }

  if (
    typeof parsed !== 'object' ||
    parsed === null ||
    !('platform' in parsed) ||
    !('appRedirect' in parsed) ||
    !('state' in parsed) ||
    !('issuedAt' in parsed)
  ) {
    throw new BadRequestException('Invalid OAuth state');
  }

  const state = parsed as GoogleOAuthState;
  if (
    (state.platform !== 'web' && state.platform !== 'mobile') ||
    typeof state.appRedirect !== 'string' ||
    typeof state.state !== 'string' ||
    typeof state.issuedAt !== 'number' ||
    !Number.isSafeInteger(state.issuedAt) ||
    state.issuedAt > now ||
    now - state.issuedAt > STATE_TTL_MS
  ) {
    throw new BadRequestException('Invalid or expired OAuth state');
  }

  return state;
}
