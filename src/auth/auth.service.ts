import {
  HttpException,
  HttpStatus,
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/sequelize';
import { ConfigService } from '@nestjs/config';
import { User, UserRoleEnum } from '../models/user.model';
import { Otp } from '../models/otp.model';
import { JwtPayload } from './jwt.strategy';
import { EmailService } from '../email/email.service';
import { createHmac, randomInt } from 'crypto';
import { Op } from 'sequelize';
import { UsersService } from '../users/users.service';
import {
  CodeChallengeMethod,
  OAuth2Client,
  TokenPayload,
} from 'google-auth-library';
import {
  GoogleOAuthState,
  signGoogleOAuthState,
  verifyGoogleOAuthState,
} from './utils/google-oauth-state.util';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  private static readonly OTP_TTL_MINUTES = 10;
  private static readonly OTP_RATE_LIMIT_MAX_REQUESTS = 3;
  private static readonly OTP_RATE_LIMIT_WINDOW_MINUTES = 10;
  private static readonly OTP_IP_RATE_LIMIT_MAX_REQUESTS = 10;
  private static readonly OTP_MAX_VERIFY_ATTEMPTS = 5;
  private static readonly INVALID_OTP_MESSAGE = 'Code OTP invalide ou expiré';
  private googleClient?: OAuth2Client;
  private readonly googleRedirectUri: string;

  constructor(
    private readonly configService: ConfigService,
    @InjectModel(User)
    private userModel: typeof User,
    @InjectModel(Otp)
    private otpModel: typeof Otp,
    private jwtService: JwtService,
    private emailService: EmailService,
    private usersService: UsersService,
  ) {
    this.googleRedirectUri = this.configService.getOrThrow<string>(
      'GOOGLE_REDIRECT_URI',
    );
  }

  async validateUser(email: string): Promise<User | null> {
    return this.userModel.findOne({ where: { email } });
  }

  async findOrCreateGoogleUser(email: string, avatar?: string): Promise<User> {
    const normalizedEmail = email.trim().toLowerCase();
    const [user] = await this.userModel.findOrCreate({
      where: { email: normalizedEmail },
      defaults: {
        email: normalizedEmail,
        ...(avatar ? { avatar } : {}),
        role: UserRoleEnum.USER,
        current_streak: 0,
        longest_streak: 0,
      },
    });

    if (avatar && user.avatar !== avatar) {
      await user.update({ avatar });
    }

    return user;
  }

  private getGoogleClient(): OAuth2Client {
    if (!this.googleClient) {
      this.googleClient = new OAuth2Client(
        this.configService.getOrThrow<string>('GOOGLE_CLIENT_ID'),
        this.configService.getOrThrow<string>('GOOGLE_CLIENT_SECRET'),
        this.googleRedirectUri,
      );
    }

    return this.googleClient;
  }

  private getGoogleRedirectTarget(
    requestedUri: string,
  ): Pick<GoogleOAuthState, 'platform' | 'appRedirect'> {
    const appScheme = this.configService.get<string>('APP_SCHEME');
    if (
      appScheme &&
      requestedUri.startsWith(appScheme) &&
      !requestedUri.includes('#')
    ) {
      return { platform: 'mobile', appRedirect: requestedUri };
    }

    const webUrl = this.configService.getOrThrow<string>('WEB_URL');
    if (requestedUri.startsWith(webUrl)) {
      try {
        const target = new URL(requestedUri);
        const frontend = new URL(webUrl);
        if (
          target.origin === frontend.origin &&
          !target.username &&
          !target.password &&
          !target.hash
        ) {
          return { platform: 'web', appRedirect: requestedUri };
        }
      } catch {
        throw new BadRequestException('Invalid redirect_uri');
      }
    }

    throw new BadRequestException('Invalid redirect_uri');
  }

  createGoogleAuthorizationUrl(query: Record<string, unknown>): string {
    const appRedirect = query.redirect_uri;
    const clientState = query.state;
    if (
      typeof appRedirect !== 'string' ||
      typeof clientState !== 'string' ||
      !appRedirect ||
      !clientState ||
      clientState.length > 512
    ) {
      throw new BadRequestException('redirect_uri and state are required');
    }

    const target = this.getGoogleRedirectTarget(appRedirect);
    const clientId = this.configService.getOrThrow<string>('GOOGLE_CLIENT_ID');
    if (
      query.client_id !== undefined &&
      (typeof query.client_id !== 'string' || query.client_id !== clientId)
    ) {
      throw new BadRequestException('Invalid OAuth client_id');
    }

    if (
      query.response_type !== undefined &&
      (typeof query.response_type !== 'string' ||
        query.response_type !== 'code')
    ) {
      throw new BadRequestException('Unsupported OAuth response_type');
    }

    const allowedScopes = new Set(['openid', 'email', 'profile']);
    if (query.scope !== undefined && typeof query.scope !== 'string') {
      throw new BadRequestException('Invalid Google OAuth scope');
    }
    const scopes = query.scope?.trim().split(/\s+/).filter(Boolean);
    if (scopes?.some((scope) => !allowedScopes.has(scope))) {
      throw new BadRequestException('Unsupported Google OAuth scope');
    }

    if (
      query.code_challenge !== undefined &&
      (typeof query.code_challenge !== 'string' ||
        !/^[A-Za-z0-9._~-]{43,128}$/.test(query.code_challenge))
    ) {
      throw new BadRequestException('Invalid PKCE code_challenge');
    }
    if (
      query.code_challenge_method !== undefined &&
      (typeof query.code_challenge_method !== 'string' ||
        !['S256', 'plain'].includes(query.code_challenge_method))
    ) {
      throw new BadRequestException('Invalid PKCE code_challenge_method');
    }
    if (!query.code_challenge && query.code_challenge_method) {
      throw new BadRequestException(
        'code_challenge_method requires code_challenge',
      );
    }

    const state = signGoogleOAuthState(
      {
        ...target,
        state: clientState,
        issuedAt: Date.now(),
      },
      this.configService.getOrThrow<string>('JWT_SECRET'),
    );
    const options: Parameters<OAuth2Client['generateAuthUrl']>[0] = {
      redirect_uri: this.googleRedirectUri,
      scope: scopes?.length ? scopes : ['openid', 'email', 'profile'],
      state,
      prompt: 'select_account',
    };

    if (typeof query.code_challenge === 'string') {
      options.code_challenge = query.code_challenge;
      options.code_challenge_method =
        query.code_challenge_method === 'plain'
          ? CodeChallengeMethod.Plain
          : CodeChallengeMethod.S256;
    }

    return this.getGoogleClient().generateAuthUrl(options);
  }

  verifyGoogleOAuthState(state: string): GoogleOAuthState {
    return verifyGoogleOAuthState(
      state,
      this.configService.getOrThrow<string>('JWT_SECRET'),
    );
  }

  async authenticateGoogleCode(
    code: string,
    codeVerifier: string | undefined,
    ipAddress: string,
  ) {
    const google = this.getGoogleClient();
    let idToken: string | undefined;
    try {
      const { tokens } = await google.getToken({
        code,
        ...(codeVerifier ? { codeVerifier } : {}),
        redirect_uri: this.googleRedirectUri,
      });
      idToken = tokens.id_token ?? undefined;
    } catch (error) {
      this.logger.warn(
        `Google authorization code exchange failed: ${
          error instanceof Error ? error.message : 'unknown provider error'
        }`,
      );
      throw new UnauthorizedException(
        'Invalid or expired Google authorization code',
      );
    }

    if (!idToken) {
      throw new UnauthorizedException(
        'Google did not return an identity token',
      );
    }

    let payload: TokenPayload | undefined;
    try {
      const ticket = await google.verifyIdToken({
        idToken,
        audience: this.configService.getOrThrow<string>('GOOGLE_CLIENT_ID'),
      });
      payload = ticket.getPayload();
    } catch (error) {
      this.logger.warn(
        `Google identity token verification failed: ${
          error instanceof Error ? error.message : 'unknown provider error'
        }`,
      );
      throw new UnauthorizedException('Invalid Google identity token');
    }

    if (!payload?.email || payload.email_verified !== true) {
      throw new UnauthorizedException(
        'Google account does not have a verified email address',
      );
    }

    const user = await this.findOrCreateGoogleUser(
      payload.email,
      payload.picture,
    );
    return this.login(user, ipAddress);
  }

  async getSessionUserState(userId: string) {
    return this.usersService.getUserAuthState(userId);
  }

  private displayNameFromEmail(email: string): string {
    return email.split('@')[0] || 'Utilisateur';
  }

  async generateJwtToken(user: User): Promise<string> {
    const payload: JwtPayload = { userId: user.id };
    return this.jwtService.sign(payload);
  }

  private getOtpPepper(): string {
    const pepper =
      this.configService.get<string>('OTP_PEPPER') ??
      this.configService.get<string>('JWT_SECRET');

    if (!pepper) {
      throw new HttpException(
        'OTP_PEPPER ou JWT_SECRET doit être configuré',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    return pepper;
  }

  private hashOtp(value: string): string {
    return createHmac('sha256', this.getOtpPepper())
      .update(value, 'utf8')
      .digest('hex');
  }

  private generateOTP(): string {
    return randomInt(100000, 1000000).toString();
  }

  private isAppStoreReviewer(email: string): boolean {
    const reviewerEmail = this.configService
      .get<string>('APP_STORE_REVIEWER_EMAIL')
      ?.trim()
      .toLowerCase();

    return Boolean(reviewerEmail && email === reviewerEmail);
  }

  private isValidAppStoreReviewerOtp(otp: string): boolean {
    return (
      otp.trim() ===
      this.configService.get<string>('APP_STORE_REVIEWER_OTP')?.trim()
    );
  }

  async login(
    user: User,
    ipAddress: string = '0.0.0.0',
    options?: { notifyLoginEmail?: boolean; timezoneOffsetMinutes?: number },
  ) {
    const accessToken = await this.generateJwtToken(user);

    if (options?.notifyLoginEmail ?? true) {
      void this.emailService
        .sendLoginNotification(
          user.email,
          this.displayNameFromEmail(user.email),
          ipAddress,
          new Date(),
        )
        .catch((error: unknown) => {
          this.logger.error(
            'Échec envoi notification de connexion',
            error instanceof Error ? error.stack : String(error),
          );
        });
    }

    const userState = await this.usersService.getUserAuthState(
      user.id,
      options?.timezoneOffsetMinutes,
    );

    return {
      access_token: accessToken,
      user: userState,
    };
  }

  async sendOTP(
    email: string,
    ipAddress: string = '0.0.0.0',
  ): Promise<{ data: { expiresInSeconds: number }; message: string }> {
    if (!email || !email.trim()) {
      throw new BadRequestException("L'email est requis");
    }

    const normalizedEmail = email.trim().toLowerCase();
    const windowStart = new Date();
    windowStart.setMinutes(
      windowStart.getMinutes() - AuthService.OTP_RATE_LIMIT_WINDOW_MINUTES,
    );

    const recentIpRequests = await this.otpModel.count({
      where: {
        requestIp: ipAddress,
        createdAt: { [Op.gte]: windowStart },
      },
    });

    if (recentIpRequests >= AuthService.OTP_IP_RATE_LIMIT_MAX_REQUESTS) {
      throw new HttpException(
        'Trop de demandes OTP depuis cette adresse. Veuillez réessayer plus tard.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    let user = await this.validateUser(normalizedEmail);

    if (!user) {
      user = await this.usersService.createUser(normalizedEmail);
    }

    // The fixed reviewer OTP is verified without sending an email or creating
    // an OTP row, so app-store reviews do not consume email quota.
    if (this.isAppStoreReviewer(normalizedEmail)) {
      return {
        data: {
          expiresInSeconds: AuthService.OTP_TTL_MINUTES * 60,
        },
        message: 'OTP envoyÃ© avec succÃ¨s',
      };
    }

    const recentOtpRequests = await this.otpModel.count({
      where: {
        userId: user.id,
        createdAt: { [Op.gte]: windowStart },
      },
    });

    if (recentOtpRequests >= AuthService.OTP_RATE_LIMIT_MAX_REQUESTS) {
      throw new HttpException(
        'Trop de demandes OTP. Veuillez réessayer plus tard.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const now = new Date();
    await this.otpModel.update(
      { isVerified: true },
      {
        where: {
          userId: user.id,
          isVerified: false,
          expiresAt: { [Op.gt]: now },
        },
      },
    );

    const otp = this.generateOTP();
    const otpExpiry = new Date();
    otpExpiry.setMinutes(otpExpiry.getMinutes() + AuthService.OTP_TTL_MINUTES);
    const codeHash = this.hashOtp(otp);

    const otpRow = await this.otpModel.create({
      userId: user.id,
      code: codeHash,
      expiresAt: otpExpiry,
      isVerified: false,
      attemptCount: 0,
      requestIp: ipAddress,
    });

    try {
      await this.emailService.sendOTP(
        normalizedEmail,
        this.displayNameFromEmail(user.email),
        otp,
        ipAddress,
        new Date(),
        otpRow.id,
      );
    } catch (error) {
      await otpRow.destroy();
      this.logger.error(
        "Échec de l'envoi de l'OTP par email",
        error instanceof Error ? error.stack : String(error),
      );
      throw new HttpException(
        "Échec de l'envoi de l'OTP par email",
        HttpStatus.BAD_GATEWAY,
      );
    }

    return {
      data: {
        expiresInSeconds: AuthService.OTP_TTL_MINUTES * 60,
      },
      message: 'OTP envoyé avec succès',
    };
  }

  async verifyOTP(
    email: string,
    otp: string,
    ipAddress: string = '0.0.0.0',
    timezoneOffsetMinutes = 0,
  ) {
    const normalizedEmail = email?.trim().toLowerCase();
    const user = await this.validateUser(normalizedEmail);

    // Same response for unknown email and bad OTP (anti-enumeration)
    if (!user) {
      throw new UnauthorizedException(AuthService.INVALID_OTP_MESSAGE);
    }

    if (!otp || typeof otp !== 'string') {
      throw new UnauthorizedException(AuthService.INVALID_OTP_MESSAGE);
    }

    if (
      this.isAppStoreReviewer(normalizedEmail) &&
      this.isValidAppStoreReviewerOtp(otp)
    ) {
      return this.login(user, ipAddress, {
        notifyLoginEmail: true,
        timezoneOffsetMinutes,
      });
    }

    const now = new Date();
    const latestActiveOtp = await this.otpModel.findOne({
      where: {
        userId: user.id,
        isVerified: false,
        expiresAt: { [Op.gt]: now },
      },
      order: [['createdAt', 'DESC']],
    });

    if (!latestActiveOtp) {
      throw new UnauthorizedException(AuthService.INVALID_OTP_MESSAGE);
    }

    if (latestActiveOtp.attemptCount >= AuthService.OTP_MAX_VERIFY_ATTEMPTS) {
      throw new HttpException(
        'Trop de tentatives. Demandez un nouveau code OTP.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const codeHash = this.hashOtp(otp.trim());
    const otpRow = await this.otpModel.findOne({
      where: {
        userId: user.id,
        code: codeHash,
        isVerified: false,
        expiresAt: { [Op.gt]: now },
      },
      order: [['createdAt', 'DESC']],
    });

    if (!otpRow) {
      const nextAttempts = latestActiveOtp.attemptCount + 1;
      await latestActiveOtp.update({
        attemptCount: nextAttempts,
        ...(nextAttempts >= AuthService.OTP_MAX_VERIFY_ATTEMPTS
          ? { isVerified: true }
          : {}),
      });

      if (nextAttempts >= AuthService.OTP_MAX_VERIFY_ATTEMPTS) {
        throw new HttpException(
          'Trop de tentatives. Demandez un nouveau code OTP.',
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }

      throw new UnauthorizedException(AuthService.INVALID_OTP_MESSAGE);
    }

    await otpRow.update({ isVerified: true });

    await this.otpModel.update(
      { isVerified: true },
      {
        where: {
          userId: user.id,
          isVerified: false,
          id: { [Op.ne]: otpRow.id },
        },
      },
    );

    return this.login(user, ipAddress, {
      notifyLoginEmail: true,
      timezoneOffsetMinutes,
    });
  }

  async promoteToAdminByEmail(
    email: string,
    adminSecret: string,
  ): Promise<{ message: string }> {
    const configuredSecret = this.configService.get<string>('ADMIN_SECRET');

    if (!configuredSecret) {
      throw new HttpException(
        "Le secret admin n'est pas configuré. Définissez ADMIN_SECRET.",
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    if (adminSecret !== configuredSecret) {
      throw new UnauthorizedException('Secret admin invalide');
    }

    const normalizedEmail = email?.trim().toLowerCase();
    if (!normalizedEmail) {
      throw new BadRequestException("L'email est requis");
    }

    const user = await this.validateUser(normalizedEmail);
    if (!user) {
      throw new NotFoundException('Email introuvable');
    }

    if (user.role === UserRoleEnum.ADMIN) {
      return { message: `L'utilisateur ${normalizedEmail} est déjà admin` };
    }

    await this.usersService.promoteToAdmin(user.id);

    return {
      message: `Utilisateur ${normalizedEmail} promu admin avec succès`,
    };
  }
}
