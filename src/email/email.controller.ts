import {
  Controller,
  Get,
  Post,
  Query,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import type { Request } from 'express';
import { EmailService } from './email.service';

@ApiTags('email')
@Controller('email')
export class EmailController {
  constructor(private readonly emailService: EmailService) {}

  @Get('unsubscribe')
  @ApiOperation({ summary: 'Se désinscrire des emails de relance' })
  @ApiQuery({ name: 'email', required: true })
  @ApiQuery({ name: 'token', required: true })
  @ApiResponse({ status: 200, description: 'Désinscription réussie' })
  @ApiResponse({ status: 401, description: 'Token invalide' })
  async unsubscribe(
    @Query('email') email: string,
    @Query('token') token: string,
  ) {
    return this.emailService.unsubscribe(email, token);
  }

  @Post('unsubscribe')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Désinscription one-click (List-Unsubscribe-Post)',
  })
  @ApiQuery({ name: 'email', required: true })
  @ApiQuery({ name: 'token', required: true })
  async unsubscribeOneClick(
    @Query('email') email: string,
    @Query('token') token: string,
  ) {
    return this.emailService.unsubscribe(email, token);
  }

  @Post('webhooks/resend')
  @SkipThrottle()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Webhook Resend (bounce / complaint / soft bounce)',
  })
  @ApiResponse({ status: 200, description: 'Événement reçu' })
  async resendWebhook(@Req() req: Request) {
    const rawBody =
      (req as Request & { rawBody?: Buffer }).rawBody ??
      Buffer.from(JSON.stringify(req.body ?? {}));

    return this.emailService.handleResendWebhook(rawBody, req.headers);
  }
}
