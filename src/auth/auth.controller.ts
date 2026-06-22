import { Controller, Post, Body, Req } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiHeader,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { AuthService } from './auth.service';
import { MakeAdminDto } from './dto/make-admin.dto';
import { UsersService } from '../users/users.service';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // Email + OTP

  @Post('otp/send')
  @ApiOperation({ summary: 'Send OTP to user email' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        email: { type: 'string', format: 'email', example: 'user@example.com' },
      },
      required: ['email'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'OTP envoyé avec succès',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'OTP envoyé avec succès' },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Email not found' })
  async sendOTP(@Body('email') email: string, @Req() req: Request) {
    const ipAddress = req.ip || req.socket.remoteAddress || '0.0.0.0';
    try {
      return await this.authService.sendOTP(email, ipAddress);
    } catch (error) {
      console.log('[POST /auth/otp/send] Error:', error);
      throw error;
    }
    // return this.authService.sendOTP(email, ipAddress);
  }

  @Post('otp/verify')
  @ApiOperation({ summary: 'Verify OTP and login user' })
  @ApiHeader({
    name: 'X-Timezone-Offset-Minutes',
    required: false,
    description:
      'Client timezone offset in minutes from JavaScript Date.getTimezoneOffset(). Defaults to UTC when omitted.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        email: { type: 'string', format: 'email', example: 'user@example.com' },
        otp: { type: 'string', example: '123456' },
      },
      required: ['email', 'otp'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'OTP verified successfully, returns JWT (30-day expiry)',
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
  @ApiResponse({ status: 401, description: 'Invalid or expired OTP' })
  @ApiResponse({ status: 404, description: 'Email not found' })
  async verifyOTP(
    @Body('email') email: string,
    @Body('otp') otp: string,
    @Req() req: Request,
  ) {
    const ipAddress = req.ip || req.socket.remoteAddress || '0.0.0.0';
    return this.authService.verifyOTP(
      email,
      otp,
      ipAddress,
      UsersService.parseTimezoneOffsetMinutes(
        req.headers['x-timezone-offset-minutes'],
      ),
    );
  }

  @Post('make-admin')
  @ApiOperation({
    summary: 'Promote a user to admin by email using a server secret',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        email: { type: 'string', format: 'email', example: 'user@example.com' },
        adminSecret: { type: 'string', example: 'your-admin-secret' },
      },
      required: ['email', 'adminSecret'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'User promoted to admin successfully',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'User user@example.com promoted to admin successfully',
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Invalid admin secret' })
  @ApiResponse({ status: 404, description: 'Email not found' })
  @ApiResponse({ status: 500, description: 'Admin secret not configured' })
  async makeAdmin(@Body() dto: MakeAdminDto) {
    return this.authService.promoteToAdminByEmail(dto.email, dto.adminSecret);
  }
}
