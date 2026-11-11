import { Controller, Get, Post, Body, Req, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiHeader,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { Request } from 'express';
import { AuthService } from './auth.service';
import { MakeAdminDto } from './dto/make-admin.dto';
import { SendOtpDto } from './dto/send-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { UsersService } from '../users/users.service';
import { GoogleAuthGuard } from './guards/google.auth.guard';
import { User } from '../models/user.model';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('google')
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({
    summary: 'Start Google sign-in',
    description:
      'Open this URL in a browser to redirect to Google for authorization. Google returns to the configured callback URL; this endpoint is not a JSON login request.',
  })
  @ApiResponse({
    status: 302,
    description: 'Redirects the browser to the Google sign-in page',
  })
  @ApiResponse({
    status: 500,
    description: 'Google OAuth client credentials are not configured',
  })
  googleAuth(): void {}

  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({
    summary: 'Complete Google sign-in',
    description:
      'Google redirects the browser here after authorization. On success, returns the same access_token and user response as email OTP login. Configure this exact URL as an authorized redirect URI in Google Cloud Console.',
  })
  @ApiResponse({
    status: 200,
    description: 'Google sign-in succeeded',
    schema: {
      type: 'object',
      properties: {
        access_token: { type: 'string', example: 'google-login-jwt' },
        user: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            email: { type: 'string', example: 'student@example.com' },
            avatar: { type: 'string', nullable: true },
            hasSelectedSections: { type: 'boolean' },
            isFirstLogin: { type: 'boolean' },
            section_id: { type: 'string', nullable: true },
            section: { type: 'string', nullable: true },
            country: { type: 'string', nullable: true },
            region: { type: 'string', nullable: true },
            current_streak: { type: 'number' },
            longest_streak: { type: 'number' },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Google sign-in failed or the Google email is not verified',
  })
  async googleAuthCallback(@Req() req: Request & { user: User }) {
    const ipAddress = req.ip || req.socket.remoteAddress || '0.0.0.0';
    return this.authService.login(req.user, ipAddress);
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
