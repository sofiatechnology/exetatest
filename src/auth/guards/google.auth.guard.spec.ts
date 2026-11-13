import { ExecutionContext, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleAuthGuard } from './google.auth.guard';

describe('GoogleAuthGuard', () => {
  it('redirects callback authorization failures with a generic error code', async () => {
    const configService = {
      getOrThrow: jest.fn().mockReturnValue('exetatest://auth/google/callback'),
    } as unknown as ConfigService;
    const redirect = jest.fn();
    const context = {
      switchToHttp: () => ({
        getRequest: () => ({ path: '/api/auth/google/callback' }),
        getResponse: () => ({ redirect }),
      }),
    } as unknown as ExecutionContext;
    const passportGuardPrototype = Object.getPrototypeOf(
      GoogleAuthGuard.prototype,
    ) as {
      canActivate: (executionContext: ExecutionContext) => Promise<boolean>;
    };
    const canActivate = jest
      .spyOn(passportGuardPrototype, 'canActivate')
      .mockRejectedValue(new Error('sensitive provider error'));

    const result = await new GoogleAuthGuard(configService).canActivate(
      context,
    );

    expect(result).toBe(true);
    expect(redirect).toHaveBeenCalledWith(
      HttpStatus.FOUND,
      'exetatest://auth/google/callback?error=google_auth_failed',
    );
    canActivate.mockRestore();
  });
});
