import { ExecutionContext, HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthGuard } from '@nestjs/passport';
import type { Request, Response } from 'express';
import { isObservable, lastValueFrom } from 'rxjs';
import { buildGoogleMobileRedirectUrl } from '../utils/google-mobile-redirect.util';

@Injectable()
export class GoogleAuthGuard extends AuthGuard('google') {
  constructor(private readonly configService: ConfigService) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const canActivate = super.canActivate(context);
      return isObservable(canActivate)
        ? await lastValueFrom(canActivate)
        : await canActivate;
    } catch (error) {
      const request = context.switchToHttp().getRequest<Request>();
      if (!request.path.endsWith('/auth/google/callback')) {
        throw error;
      }

      const response = context.switchToHttp().getResponse<Response>();
      response.redirect(
        HttpStatus.FOUND,
        buildGoogleMobileRedirectUrl(this.configService, {
          error: 'google_auth_failed',
        }),
      );
      return true;
    }
  }
}
