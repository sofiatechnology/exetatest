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

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  private static readonly OTP_TTL_MINUTES = 10;
  private static readonly OTP_RATE_LIMIT_MAX_REQUESTS = 3;
  private static readonly OTP_RATE_LIMIT_WINDOW_MINUTES = 10;
  private static readonly OTP_IP_RATE_LIMIT_MAX_REQUESTS = 10;
  private static readonly OTP_MAX_VERIFY_ATTEMPTS = 5;
  private static readonly INVALID_OTP_MESSAGE = 'Code OTP invalide ou expiré';

  constructor(
    private configService: ConfigService,
    @InjectModel(User)
    private userModel: typeof User,
    @InjectModel(Otp)
    private otpModel: typeof Otp,
    private jwtService: JwtService,
    private emailService: EmailService,
    private usersService: UsersService,
  ) {}

  async validateUser(email: string): Promise<User | null> {
    return this.userModel.findOne({ where: { email } });
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

  async updateAvatar(userId: string, file: Express.Multer.File) {
    const user = await this.userModel.findByPk(userId);
    if (!user) {
      throw new NotFoundException('Utilisateur introuvable');
    }

    if (!file || !file.buffer) {
      throw new UnauthorizedException('Aucun fichier fourni');
    }

    throw new BadRequestException(
      "La mise a jour d'avatar est temporairement indisponible",
    );
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
