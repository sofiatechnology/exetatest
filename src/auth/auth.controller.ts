import {
  BadRequestException,
  Controller,
  Get,
  Post,
  Body,
  Query,
  Req,
  Res,
  UseGuards,
  HttpStatus,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ApiBody,
  ApiConsumes,
  ApiSecurity,
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiHeader,
  ApiQuery,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { GoogleTokenDto } from './dto/google-token.dto';
import { MakeAdminDto } from './dto/make-admin.dto';
import { SendOtpDto } from './dto/send-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { UsersService } from '../users/users.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { AUTH_COOKIE_NAME, AUTH_TOKEN_TTL_MS } from './auth.constants';

interface AuthenticatedRequest extends Request {
  user: { id: string; exp?: number };
}

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @Get('authorize')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({
    summary: 'Start Google OAuth sign-in',
    description:
      'Redirects the user to Google using the backend GOOGLE_REDIRECT_URI. Supply the Expo web URL or configured app scheme as redirect_uri; this app redirect is never sent to Google. PKCE is supported.',
  })
  @ApiQuery({ name: 'redirect_uri', required: true, type: String })
  @ApiQuery({ name: 'state', required: true, type: String })
  @ApiQuery({ name: 'client_id', required: false, type: String })
  @ApiQuery({ name: 'response_type', required: false, enum: ['code'] })
  @ApiQuery({ name: 'scope', required: false, type: String })
  @ApiQuery({ name: 'code_challenge', required: false, type: String })
  @ApiQuery({
    name: 'code_challenge_method',
    required: false,
    enum: ['S256', 'plain'],
  })
  @ApiResponse({
    status: 302,
    description: 'Redirects the browser to the Google sign-in page',
  })
  @ApiResponse({ status: 400, description: 'Invalid redirect URI or state' })
  @ApiResponse({
    status: 500,
    description: 'Google OAuth client credentials are not configured',
  })
  googleAuthorize(
    @Query() q: Record<string, string>,
    @Res() res: Response,
  ): void {
    res.redirect(this.authService.createGoogleAuthorizationUrl(q));
  }

  @Get('callback')
  @ApiOperation({
    summary: 'Handle Google OAuth callback',
    description:
      'Google returns the authorization code here. The backend validates its signed state and redirects the browser to the originally approved frontend or mobile URI with the code and original state.',
  })
  @ApiResponse({
    status: 302,
    description: 'Redirects to the approved frontend or mobile callback',
  })
  @ApiQuery({ name: 'state', required: true, type: String })
  @ApiQuery({ name: 'code', required: false, type: String })
  @ApiQuery({ name: 'error', required: false, type: String })
  googleOAuthCallback(
    @Query() q: Record<string, string>,
    @Res() res: Response,
  ): void {
    if (!q.state) {
      throw new BadRequestException('Missing OAuth state');
    }

    const oauthState = this.authService.verifyGoogleOAuthState(q.state);
    const redirectParams = new URLSearchParams();
    if (q.error) {
      redirectParams.set('error', q.error);
    } else if (q.code) {
      redirectParams.set('code', q.code);
    } else {
      redirectParams.set('error', 'google_auth_failed');
    }
    redirectParams.set('state', oauthState.state);
    const separator = oauthState.appRedirect.includes('?')
      ? oauthState.appRedirect.endsWith('?') ||
        oauthState.appRedirect.endsWith('&')
        ? ''
        : '&'
      : '?';
    const redirectUrl = `${oauthState.appRedirect}${separator}${redirectParams.toString()}`;

    res.redirect(HttpStatus.FOUND, redirectUrl);
  }

  @Post('token')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({
    summary: 'Exchange Google authorization code for an EXETATEST session',
    description:
      'Exchanges the Google code using the configured backend callback URI, verifies the Google ID token, and issues the existing EXETATEST JWT. Web clients receive an HttpOnly cookie; mobile clients receive a Bearer token.',
  })
  @ApiConsumes('application/json', 'application/x-www-form-urlencoded')
  @ApiBody({ type: GoogleTokenDto })
  @ApiResponse({
    status: 200,
    description: 'Google identity verified and an EXETATEST session issued',
    schema: {
      type: 'object',
      properties: {
        access_token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiJ9...' },
        token_type: { type: 'string', enum: ['Bearer', 'cookie'] },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid authorization code or unverified Google email',
  })
  async googleToken(
    @Body() dto: GoogleTokenDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const ipAddress = req.ip || req.socket.remoteAddress || '0.0.0.0';
    const login = await this.authService.authenticateGoogleCode(
      dto.code,
      dto.code_verifier,
      ipAddress,
    );

    if (dto.platform === 'web') {
      const isProduction =
        this.configService.get<string>('NODE_ENV') === 'production';
      res.cookie(AUTH_COOKIE_NAME, login.access_token, {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? 'none' : 'lax',
        maxAge: AUTH_TOKEN_TTL_MS,
        path: '/',
      });
      return { access_token: 'web-cookie', token_type: 'cookie' as const };
    }

    return { access_token: login.access_token, token_type: 'Bearer' as const };
  }

  @Get('session')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Restore the current web or mobile session' })
  @ApiSecurity({ 'JWT-auth': [] })
  @ApiSecurity({ 'cookie-auth': [] })
  @ApiResponse({
    status: 200,
    description: 'Authenticated user state and token expiry',
  })
  @ApiResponse({
    status: 401,
    description: 'Authentication required or expired',
  })
  async session(@Req() req: AuthenticatedRequest) {
    const user = await this.authService.getSessionUserState(req.user.id);
    return {
      ...user,
      ...(req.user.exp
        ? { exp: req.user.exp, cookieExpiration: req.user.exp }
        : {}),
    };
  }

  @Post('logout')
  @ApiOperation({ summary: 'Log out the current web session' })
  @ApiResponse({ status: 200, description: 'Authentication cookie cleared' })
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie(AUTH_COOKIE_NAME, { path: '/' });
    return { success: true };
  }

  @Post('otp/send')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: 'Envoyer un code OTP par email' })
  @ApiBody({ type: SendOtpDto })
  @ApiResponse({
    status: 200,
    description: 'OTP envoyé avec succès',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'object',
          properties: {
            expiresInSeconds: { type: 'number', example: 600 },
          },
        },
        message: { type: 'string', example: 'OTP envoyé avec succès' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Email invalide' })
  @ApiResponse({ status: 429, description: 'Trop de demandes OTP' })
  @ApiResponse({ status: 502, description: "Échec de l'envoi email" })
  async sendOTP(@Body() dto: SendOtpDto, @Req() req: Request) {
    const ipAddress = req.ip || req.socket.remoteAddress || '0.0.0.0';
    return this.authService.sendOTP(dto.email, ipAddress);
  }

  @Post('otp/verify')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({
    summary: 'Vérifier le code OTP et se connecter',
    description:
      "Le compte d'évaluation App Store configuré peut utiliser son code OTP fixe.",
  })
  @ApiHeader({
    name: 'X-Timezone-Offset-Minutes',
    required: false,
    description:
      'Décalage fuseau client en minutes (Date.getTimezoneOffset()). UTC par défaut.',
  })
  @ApiBody({ type: VerifyOtpDto })
  @ApiResponse({
    status: 200,
    description: 'OTP vérifié, retourne un JWT (30 jours)',
    schema: {
      type: 'object',
      properties: {
        access_token: { type: 'string' },
        user: {
          type: 'object',
          properties: {
            email: { type: 'string' },
            avatar: { type: 'string', nullable: true },
            hasSelectedSections: { type: 'boolean' },
            current_streak: { type: 'number', example: 4 },
            longest_streak: { type: 'number', example: 9 },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Code OTP invalide ou expiré',
  })
  @ApiResponse({
    status: 429,
    description: 'Trop de tentatives de vérification',
  })
  async verifyOTP(@Body() dto: VerifyOtpDto, @Req() req: Request) {
    const ipAddress = req.ip || req.socket.remoteAddress || '0.0.0.0';
    return this.authService.verifyOTP(
      dto.email,
      dto.otp,
      ipAddress,
      UsersService.parseTimezoneOffsetMinutes(
        req.headers['x-timezone-offset-minutes'],
      ),
    );
  }

  @Post('make-admin')
  @ApiOperation({
    summary: 'Promouvoir un utilisateur en admin via secret serveur',
  })
  @ApiBody({ type: MakeAdminDto })
  @ApiResponse({
    status: 200,
    description: 'Utilisateur promu admin',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Utilisateur user@example.com promu admin avec succès',
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Secret admin invalide' })
  @ApiResponse({ status: 404, description: 'Email introuvable' })
  @ApiResponse({ status: 500, description: 'Secret admin non configuré' })
  async makeAdmin(@Body() dto: MakeAdminDto) {
    return this.authService.promoteToAdminByEmail(dto.email, dto.adminSecret);
  }
}
