import {
  BadRequestException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/sequelize';
import { createHmac } from 'crypto';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';
import { Resend } from 'resend';
import { Webhook } from 'svix';
import {
  EmailSuppression,
  EmailSuppressionReason,
} from '../models/email-suppression.model';
import { WebhookEvent } from '../models/webhook-event.model';
import {
  renderInactivityReminderEmail,
  renderLoginNotificationEmail,
  renderOtpEmail,
  renderSetInvitationEmail,
} from './email.renderer';

/**
 * smtp          — Nodemailer only
 * resend        — Resend only
 * smtp-resend   — Nodemailer primary, Resend fallback on failure (default)
 */
type EmailStrategy = 'smtp' | 'resend' | 'smtp-resend';

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text: string;
  appName: string;
  idempotencyKey?: string;
  headers?: Record<string, string>;
  tags?: Array<{ name: string; value: string }>;
  /** Marketing-like emails must check unsubscribe suppression */
  category?: 'transactional' | 'marketing';
}

interface ResendWebhookPayload {
  type?: string;
  created_at?: string;
  data?: {
    email_id?: string;
    to?: string[] | string;
    bounce?: { type?: string; message?: string };
    [key: string]: unknown;
  };
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly emailStrategy: EmailStrategy;
  private readonly resend?: Resend;
  private readonly transporter?: Transporter;

  private static readonly SOFT_BOUNCE_SUPPRESS_THRESHOLD = 3;
  private static readonly DEFAULT_APP_NAME = 'EXETATEST';

  constructor(
    private configService: ConfigService,
    @InjectModel(EmailSuppression)
    private emailSuppressionModel: typeof EmailSuppression,
    @InjectModel(WebhookEvent)
    private webhookEventModel: typeof WebhookEvent,
  ) {
    this.emailStrategy = this.getEmailStrategy();

    const resendApiKey = this.configService.get<string>('RESEND_API_KEY');
    if (resendApiKey) {
      this.resend = new Resend(resendApiKey);
    }

    const smtpHost = this.configService.get<string>('SMTP_HOST');
    const smtpUser = this.configService.get<string>('SMTP_USER');
    if (smtpHost && smtpUser) {
      this.transporter = nodemailer.createTransport({
        host: smtpHost,
        port: this.configService.get<number>('SMTP_PORT', 587),
        secure: this.configService.get<boolean>('SMTP_SECURE', false),
        auth: {
          user: smtpUser,
          pass: this.configService.get<string>('SMTP_PASS'),
        },
      });
    }

    this.logger.log(`Stratégie email: ${this.emailStrategy}`);
  }

  private getEmailStrategy(): EmailStrategy {
    const provider = this.configService
      .get<string>('EMAIL_PROVIDER', 'smtp-resend')
      .toLowerCase();

    if (provider === 'resend') {
      return 'resend';
    }

    if (
      provider === 'smtp' ||
      provider === 'nodemailer' ||
      provider === 'smtp-only'
    ) {
      return 'smtp';
    }

    // Default and aliases: nodemailer primary + Resend fallback
    return 'smtp-resend';
  }

  private getAppName(): string {
    return (
      this.configService.get<string>('APP_NAME') ??
      EmailService.DEFAULT_APP_NAME
    );
  }

  private getAppUrl(): string {
    return (
      this.configService.get<string>('FRONTEND_URL') ??
      this.configService.get<string>('APP_URL') ??
      'http://localhost:5173'
    );
  }

  private getApiBaseUrl(): string {
    return (
      this.configService.get<string>('BASE_URL') ??
      this.configService.get<string>('APP_URL') ??
      'http://localhost:9080'
    );
  }

  private getFromAddress(appName: string): string {
    const fromEmail =
      this.configService.get<string>('FROM_EMAIL') ??
      this.configService.get<string>('EMAIL_FROM') ??
      this.configService.get<string>('SMTP_FROM') ??
      this.configService.get<string>('SMTP_USER');

    if (!fromEmail) {
      throw new Error(
        "L'expéditeur email n'est pas configuré. Définissez FROM_EMAIL.",
      );
    }

    return `"${appName}" <${fromEmail}>`;
  }

  private getReplyTo(): string | undefined {
    return (
      this.configService.get<string>('EMAIL_REPLY_TO') ??
      this.configService.get<string>('SUPPORT_EMAIL') ??
      undefined
    );
  }

  private getLogoUrl(): string {
    const assetsBase = this.configService.get<string>('EMAIL_ASSETS_URL');
    if (assetsBase) {
      return assetsBase.replace(/\/$/, '');
    }

    return `${this.getApiBaseUrl().replace(/\/$/, '')}/email-assets/logo.png`;
  }

  private getUnsubscribeSecret(): string {
    return (
      this.configService.get<string>('UNSUBSCRIBE_SECRET') ??
      this.configService.get<string>('OTP_PEPPER') ??
      this.configService.get<string>('JWT_SECRET') ??
      'dev-unsubscribe-secret'
    );
  }

  buildUnsubscribeToken(email: string): string {
    return createHmac('sha256', this.getUnsubscribeSecret())
      .update(`unsubscribe:${email.trim().toLowerCase()}`, 'utf8')
      .digest('hex')
      .slice(0, 32);
  }

  buildUnsubscribeUrl(email: string): string {
    const token = this.buildUnsubscribeToken(email);
    const base = this.getApiBaseUrl().replace(/\/$/, '');
    const params = new URLSearchParams({
      email: email.trim().toLowerCase(),
      token,
    });
    return `${base}/api/email/unsubscribe?${params.toString()}`;
  }

  async isSuppressed(email: string): Promise<boolean> {
    const row = await this.emailSuppressionModel.findOne({
      where: { email: email.trim().toLowerCase() },
    });

    if (!row) {
      return false;
    }

    if (row.reason === EmailSuppressionReason.SOFT_BOUNCE) {
      return row.softBounceCount >= EmailService.SOFT_BOUNCE_SUPPRESS_THRESHOLD;
    }

    return true;
  }

  async suppressEmail(
    email: string,
    reason: EmailSuppressionReason,
  ): Promise<void> {
    const normalized = email.trim().toLowerCase();
    const existing = await this.emailSuppressionModel.findOne({
      where: { email: normalized },
    });

    if (!existing) {
      await this.emailSuppressionModel.create({
        email: normalized,
        reason,
        softBounceCount: reason === EmailSuppressionReason.SOFT_BOUNCE ? 1 : 0,
      });
      return;
    }

    // Never downgrade complaint / hard bounce / unsubscribe
    const permanentReasons = [
      EmailSuppressionReason.HARD_BOUNCE,
      EmailSuppressionReason.COMPLAINT,
      EmailSuppressionReason.UNSUBSCRIBE,
    ];

    if (permanentReasons.includes(existing.reason)) {
      return;
    }

    if (reason === EmailSuppressionReason.SOFT_BOUNCE) {
      const next = existing.softBounceCount + 1;
      await existing.update({
        softBounceCount: next,
        reason:
          next >= EmailService.SOFT_BOUNCE_SUPPRESS_THRESHOLD
            ? EmailSuppressionReason.SOFT_BOUNCE
            : existing.reason,
      });
      return;
    }

    await existing.update({ reason });
  }

  async unsubscribe(
    email: string,
    token: string,
  ): Promise<{ data: { email: string }; message: string }> {
    const normalized = email?.trim().toLowerCase();
    if (!normalized || !token) {
      throw new BadRequestException('Email et token requis');
    }

    const expected = this.buildUnsubscribeToken(normalized);
    if (token !== expected) {
      throw new UnauthorizedException('Lien de désinscription invalide');
    }

    await this.suppressEmail(normalized, EmailSuppressionReason.UNSUBSCRIBE);

    return {
      data: { email: normalized },
      message: 'Vous êtes désinscrit(e) des emails de relance.',
    };
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private isRetryableResendError(error: { statusCode?: number }): boolean {
    const status = error.statusCode;
    return status === 429 || (typeof status === 'number' && status >= 500);
  }

  private async sendViaSmtp(
    options: SendEmailOptions,
    normalizedTo: string,
    from: string,
    replyTo?: string,
  ): Promise<void> {
    if (!this.transporter) {
      throw new Error(
        "Nodemailer n'est pas configuré (SMTP_HOST / SMTP_USER requis)",
      );
    }

    await this.transporter.sendMail({
      from,
      to: normalizedTo,
      subject: options.subject,
      html: options.html,
      text: options.text,
      replyTo,
      headers: options.headers,
    });
  }

  private async sendViaResend(
    options: SendEmailOptions,
    normalizedTo: string,
    from: string,
    replyTo?: string,
  ): Promise<void> {
    if (!this.resend) {
      throw new Error("Resend n'est pas configuré (RESEND_API_KEY requis)");
    }

    const maxRetries = 3;
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      const { data, error } = await this.resend.emails.send(
        {
          from,
          to: [normalizedTo],
          subject: options.subject,
          html: options.html,
          text: options.text,
          replyTo,
          headers: options.headers,
          tags: options.tags,
        },
        options.idempotencyKey
          ? { idempotencyKey: options.idempotencyKey }
          : undefined,
      );

      if (!error) {
        this.logger.debug(`Email envoyé via Resend: ${data?.id ?? 'ok'}`);
        return;
      }

      lastError = new Error(`Resend email failed: ${error.message}`);
      const statusCode =
        'statusCode' in error
          ? (error as { statusCode?: number }).statusCode
          : undefined;

      if (
        !this.isRetryableResendError({ statusCode }) ||
        attempt === maxRetries - 1
      ) {
        throw lastError;
      }

      const delay = Math.min(1000 * 2 ** attempt, 8000);
      await this.sleep(delay);
    }

    throw lastError ?? new Error('Échec envoi Resend inconnu');
  }

  private async sendEmail(
    options: SendEmailOptions,
  ): Promise<'sent' | 'suppressed'> {
    const normalizedTo = options.to.trim().toLowerCase();

    if (await this.isSuppressed(normalizedTo)) {
      this.logger.warn(
        `Envoi ignoré: ${normalizedTo} est sur la liste de suppression`,
      );
      return 'suppressed';
    }

    const from = this.getFromAddress(options.appName);
    const replyTo = this.getReplyTo();

    if (this.emailStrategy === 'resend') {
      await this.sendViaResend(options, normalizedTo, from, replyTo);
      return 'sent';
    }

    if (this.emailStrategy === 'smtp') {
      await this.sendViaSmtp(options, normalizedTo, from, replyTo);
      this.logger.debug(`Email envoyé via Nodemailer à ${normalizedTo}`);
      return 'sent';
    }

    // Default: Nodemailer primary, Resend fallback
    try {
      await this.sendViaSmtp(options, normalizedTo, from, replyTo);
      this.logger.debug(`Email envoyé via Nodemailer à ${normalizedTo}`);
      return 'sent';
    } catch (smtpError) {
      this.logger.warn(
        `Nodemailer a échoué, bascule vers Resend: ${
          smtpError instanceof Error ? smtpError.message : String(smtpError)
        }`,
      );

      try {
        await this.sendViaResend(options, normalizedTo, from, replyTo);
        this.logger.log(`Email envoyé via Resend (fallback) à ${normalizedTo}`);
        return 'sent';
      } catch (resendError) {
        this.logger.error(
          `Échec Nodemailer et Resend pour ${normalizedTo}`,
          resendError instanceof Error
            ? resendError.stack
            : String(resendError),
        );
        throw new Error(
          `Échec envoi email (SMTP puis Resend): ${
            resendError instanceof Error
              ? resendError.message
              : String(resendError)
          }`,
        );
      }
    }
  }

  private formatTimestamp(timestamp: Date): string {
    return timestamp.toISOString().replace('T', ' ').substring(0, 19);
  }

  async sendLoginNotification(
    email: string,
    name: string,
    ipAddress: string,
    timestamp: Date,
  ): Promise<void> {
    const appName = this.getAppName();
    const appUrl = this.getAppUrl();

    const { html, text } = await renderLoginNotificationEmail({
      name,
      email,
      appName,
      ipAddress,
      formattedDate: `${this.formatTimestamp(timestamp)} (UTC)`,
      appUrl,
      logoUrl: this.getLogoUrl(),
    });

    await this.sendEmail({
      appName,
      to: email,
      subject: 'Connexion détectée : nouvel appareil ou nouvel emplacement ?',
      html,
      text,
      category: 'transactional',
      idempotencyKey: `login-${email}-${timestamp.toISOString().slice(0, 16)}`,
      tags: [{ name: 'category', value: 'transactional' }],
    });
  }

  async sendOTP(
    email: string,
    name: string,
    otp: string,
    ipAddress: string,
    timestamp: Date,
    otpId: string,
  ): Promise<void> {
    const appName = this.getAppName();
    const appUrl = this.getAppUrl();

    const { html, text } = await renderOtpEmail({
      name,
      appName,
      otp,
      ipAddress,
      formattedDate: this.formatTimestamp(timestamp),
      appUrl,
      logoUrl: this.getLogoUrl(),
    });

    const result = await this.sendEmail({
      appName,
      to: email,
      subject: `Votre code de connexion ${appName}`,
      html,
      text,
      category: 'transactional',
      idempotencyKey: `otp-${otpId}`,
      tags: [{ name: 'category', value: 'transactional' }],
    });

    if (result === 'suppressed') {
      throw new Error(
        "Impossible d'envoyer l'OTP : cette adresse email est bloquée (bounce/plainte).",
      );
    }
  }

  async sendInactivityReminder(
    email: string,
    name: string,
    inactivityDays: number,
  ): Promise<void> {
    const appName = this.getAppName();
    const appUrl = this.getAppUrl();
    const unsubscribeUrl = this.buildUnsubscribeUrl(email);

    const { html, text } = await renderInactivityReminderEmail({
      name,
      inactivityDays,
      appName,
      appUrl,
      logoUrl: this.getLogoUrl(),
      unsubscribeUrl,
    });

    await this.sendEmail({
      appName,
      to: email,
      subject: `On vous attend sur ${appName}`,
      html,
      text,
      category: 'marketing',
      idempotencyKey: `inactivity-${email}-${inactivityDays}`,
      tags: [{ name: 'category', value: 'marketing' }],
      headers: {
        'List-Unsubscribe': `<${unsubscribeUrl}>`,
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
      },
    });
  }

  async sendSetInvitation(
    email: string,
    inviterName: string,
    setTitle: string,
  ): Promise<void> {
    const appName = this.getAppName();
    const appUrl = this.getAppUrl();

    const { html, text } = await renderSetInvitationEmail({
      inviterName,
      setTitle,
      appName,
      appUrl,
      logoUrl: this.getLogoUrl(),
    });

    await this.sendEmail({
      appName,
      to: email,
      subject: `Invitation : rejoindre « ${setTitle} » sur ${appName}`,
      html,
      text,
      category: 'transactional',
      idempotencyKey: `invite-${email}-${setTitle.slice(0, 40)}`,
      tags: [{ name: 'category', value: 'transactional' }],
    });
  }

  private extractRecipientEmails(data: ResendWebhookPayload['data']): string[] {
    if (!data) {
      return [];
    }

    const to = data.to;
    if (Array.isArray(to)) {
      return to.map((value) => value.trim().toLowerCase()).filter(Boolean);
    }
    if (typeof to === 'string') {
      return [to.trim().toLowerCase()];
    }

    return [];
  }

  async handleResendWebhook(
    rawBody: Buffer | string,
    headers: Record<string, string | string[] | undefined>,
  ): Promise<{ received: true }> {
    const secret = this.configService.get<string>('RESEND_WEBHOOK_SECRET');
    if (!secret) {
      throw new BadRequestException('RESEND_WEBHOOK_SECRET non configuré');
    }

    const svixId = headers['svix-id'];
    const svixTimestamp = headers['svix-timestamp'];
    const svixSignature = headers['svix-signature'];

    if (
      typeof svixId !== 'string' ||
      typeof svixTimestamp !== 'string' ||
      typeof svixSignature !== 'string'
    ) {
      throw new UnauthorizedException('En-têtes webhook Svix manquants');
    }

    const wh = new Webhook(secret);
    const payloadString =
      typeof rawBody === 'string' ? rawBody : rawBody.toString('utf8');

    let payload: ResendWebhookPayload;
    try {
      payload = wh.verify(payloadString, {
        'svix-id': svixId,
        'svix-timestamp': svixTimestamp,
        'svix-signature': svixSignature,
      }) as ResendWebhookPayload;
    } catch {
      throw new UnauthorizedException('Signature webhook invalide');
    }

    const eventId = svixId;
    const eventType = payload.type ?? 'unknown';

    const alreadyProcessed = await this.webhookEventModel.findOne({
      where: { eventId },
    });
    if (alreadyProcessed) {
      return { received: true };
    }

    const recipients = this.extractRecipientEmails(payload.data);

    if (eventType === 'email.bounced') {
      for (const email of recipients) {
        await this.suppressEmail(email, EmailSuppressionReason.HARD_BOUNCE);
      }
    } else if (eventType === 'email.complained') {
      for (const email of recipients) {
        await this.suppressEmail(email, EmailSuppressionReason.COMPLAINT);
      }
    } else if (eventType === 'email.delivery_delayed') {
      for (const email of recipients) {
        await this.suppressEmail(email, EmailSuppressionReason.SOFT_BOUNCE);
      }
    }

    await this.webhookEventModel.create({
      eventId,
      eventType,
    });

    return { received: true };
  }
}
