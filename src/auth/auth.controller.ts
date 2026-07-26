import { Controller, Post, Body, Req } from '@nestjs/common';
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

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

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
  @ApiOperation({ summary: 'Vérifier le code OTP et se connecter' })
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
