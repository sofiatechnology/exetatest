import { InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

const GOOGLE_MOBILE_REDIRECT_URI_ALLOWLIST = new Set([
  'exetatest://auth/google/callback',
]);

export function buildGoogleMobileRedirectUrl(
  configService: ConfigService,
  query: Record<string, string>,
): string {
  const redirectUri = configService.getOrThrow<string>(
    'GOOGLE_MOBILE_REDIRECT_URI',
  );

  if (!GOOGLE_MOBILE_REDIRECT_URI_ALLOWLIST.has(redirectUri)) {
    throw new InternalServerErrorException(
      'Google mobile redirect URI is not allowed',
    );
  }

  return `${redirectUri}?${new URLSearchParams(query).toString()}`;
}
