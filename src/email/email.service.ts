import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter: Transporter;

  constructor(private configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('SMTP_HOST'),
      port: this.configService.get<number>('SMTP_PORT'),
      secure: this.configService.get<boolean>('SMTP_SECURE', false),
      auth: {
        user: this.configService.get<string>('SMTP_USER'),
        pass: this.configService.get<string>('SMTP_PASS'),
      },
    });
  }

  async sendLoginNotification(
    email: string,
    name: string,
    ipAddress: string,
    timestamp: Date,
  ): Promise<void> {
    const appName = this.configService.get<string>('APP_NAME', 'EXETAT Test');
    const appUrl = this.configService.get<string>(
      'APP_URL',
      'http://localhost:3000',
    );

    const htmlContent = this.getLoginNotificationTemplate(
      name,
      email,
      appName,
      ipAddress,
      timestamp,
      appUrl,
    );

    await this.transporter.sendMail({
      from: `"${appName}" <${this.configService.get<string>('SMTP_FROM')}>`,
      to: email,
      subject: 'Connexion détectée : nouvel appareil ou nouvel emplacement ?',
      html: htmlContent,
    });
  }

  async sendOTP(
    email: string,
    name: string,
    otp: string,
    ipAddress: string,
    timestamp: Date,
  ): Promise<void> {
    const appName = this.configService.get<string>('APP_NAME', 'EXETATEST');
    const appUrl = this.configService.get<string>(
      'APP_URL',
      'http://localhost:3000',
    );

    const htmlContent = this.getOTPTemplate(
      name,
      appName,
      otp,
      ipAddress,
      timestamp,
      appUrl,
    );

    await this.transporter.sendMail({
      from: `"${appName}" <${this.configService.get<string>('SMTP_FROM')}>`,
      to: email,
      subject: 'Votre code OTP de connexion',
      html: htmlContent,
    });
  }

  async sendInactivityReminder(
    email: string,
    name: string,
    inactivityDays: number,
  ): Promise<void> {
    const appName = this.configService.get<string>('APP_NAME', 'EXETATEST');
    const appUrl = this.configService.get<string>(
      'FRONTEND_URL',
      'http://localhost:5173',
    );

    const htmlContent = this.getInactivityReminderTemplate(
      name,
      inactivityDays,
      appName,
      appUrl,
    );

    await this.transporter.sendMail({
      from: `"${appName}" <${this.configService.get<string>('SMTP_FROM')}>`,
      to: email,
      subject: `On vous attend sur ${appName}`,
      html: htmlContent,
    });
  }

  private getInactivityReminderTemplate(
    name: string,
    inactivityDays: number,
    appName: string,
    appUrl: string,
  ): string {
    return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>On vous attend sur ${appName}</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Google Sans', Roboto, -apple-system, BlinkMacSystemFont, Arial, sans-serif; background-color: #F9F9FF; color: #191C20;">
  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #F9F9FF; font-family: 'Google Sans', Roboto, Arial, sans-serif;">
    <tr>
      <td align="center" style="padding: 40px 16px;">
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 560px; background-color: #FFFFFF; border: 1px solid #E0E2EC; border-radius: 24px; overflow: hidden; box-shadow: 0 4px 12px rgba(65, 95, 145, 0.05);">
          <tr>
            <td style="padding: 32px 32px 16px 32px; text-align: center;">
              <table border="0" cellpadding="0" cellspacing="0" align="center" style="margin: 0 auto 16px auto; background-color: #D6E3FF; border-radius: 50%; width: 64px; height: 64px; text-align: center;">
                <tr>
                  <td align="center" valign="middle" style="height: 64px; width: 64px; vertical-align: middle;">
                    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#284777" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display: inline-block; vertical-align: middle;">
                      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
                      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
                    </svg>
                  </td>
                </tr>
              </table>
              <div style="font-size: 20px; font-weight: 700; color: #415F91; letter-spacing: -0.5px; margin-top: 8px;">${appName}</div>
            </td>
          </tr>
          <tr>
            <td style="padding: 16px 32px 32px 32px;">
              <h1 style="font-size: 22px; font-weight: 700; color: #191C20; margin: 0 0 20px 0; line-height: 1.3; text-align: center;">On vous attend sur ${appName}</h1>
              <p style="font-size: 15px; line-height: 1.6; color: #191C20; margin: 0 0 16px 0;">Bonjour ${name},</p>
              <p style="font-size: 15px; line-height: 1.6; color: #191C20; margin: 0 0 24px 0;">
                Ça fait <strong>${inactivityDays} jours</strong> qu’on ne vous a pas vu(e). Une petite séance aujourd’hui peut relancer votre progression.
              </p>
              <div style="text-align: center; margin: 32px 0;">
                <a href="${appUrl}" style="display: inline-block; background-color: #415F91; color: #FFFFFF; text-decoration: none; padding: 12px 32px; border-radius: 100px; font-weight: 700; font-size: 15px; letter-spacing: 0.25px;">Reprendre l’entraînement</a>
              </div>
              <p style="font-size: 13px; color: #74777F; line-height: 1.6; margin: 24px 0 0 0; font-style: italic;">
                Si vous n’avez plus accès à ce compte, ignorez simplement cet email. Ceci est un message automatique.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 32px; text-align: center; border-top: 1px solid #E0E2EC; background-color: #F3F3FA;">
              <p style="font-size: 14px; font-weight: 700; color: #415F91; margin: 0;">À très vite !</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;
  }

  private getOTPTemplate(
    name: string,
    appName: string,
    otp: string,
    ipAddress: string,
    timestamp: Date,
    appUrl: string,
  ): string {
    const formattedDate = timestamp
      .toISOString()
      .replace('T', ' ')
      .substring(0, 19);

    return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Votre code OTP</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Google Sans', Roboto, -apple-system, BlinkMacSystemFont, Arial, sans-serif; background-color: #F9F9FF; color: #191C20;">
  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #F9F9FF; font-family: 'Google Sans', Roboto, Arial, sans-serif;">
    <tr>
      <td align="center" style="padding: 40px 16px;">
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 560px; background-color: #FFFFFF; border: 1px solid #E0E2EC; border-radius: 24px; overflow: hidden; box-shadow: 0 4px 12px rgba(65, 95, 145, 0.05);">
          <tr>
            <td style="padding: 32px 32px 16px 32px; text-align: center;">
              <table border="0" cellpadding="0" cellspacing="0" align="center" style="margin: 0 auto 16px auto; background-color: #D6E3FF; border-radius: 50%; width: 64px; height: 64px; text-align: center;">
                <tr>
                  <td align="center" valign="middle" style="height: 64px; width: 64px; vertical-align: middle;">
                    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#284777" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display: inline-block; vertical-align: middle;">
                      <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/>
                    </svg>
                  </td>
                </tr>
              </table>
              <div style="font-size: 20px; font-weight: 700; color: #415F91; letter-spacing: -0.5px; margin-top: 8px;">${appName}</div>
            </td>
          </tr>
          <tr>
            <td style="padding: 16px 32px 32px 32px;">
              <h1 style="font-size: 22px; font-weight: 700; color: #191C20; margin: 0 0 20px 0; line-height: 1.3; text-align: center;">Votre code de connexion</h1>
              <p style="font-size: 15px; line-height: 1.6; color: #191C20; margin: 0 0 16px 0;">Bonjour ${name},</p>
              <p style="font-size: 15px; line-height: 1.6; color: #191C20; margin: 0 0 24px 0;">
                Vous avez demandé à vous connecter à votre compte <strong>${appName}</strong>. Utilisez le code ci-dessous pour finaliser votre connexion.
              </p>
              
              <div style="background-color: #D6E3FF; border-radius: 16px; padding: 24px 20px; margin: 28px 0; text-align: center;">
                <div style="font-size: 13px; color: #284777; margin-bottom: 8px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">Votre code OTP</div>
                <div style="font-size: 40px; font-weight: 700; color: #284777; letter-spacing: 8px; font-family: 'Courier New', Courier, monospace;">${otp}</div>
              </div>

              <div style="background-color: #F3F3FA; border-radius: 16px; padding: 18px; margin: 24px 0;">
                <div style="font-size: 14px; color: #44474E; line-height: 1.5; margin: 4px 0;">
                  <span style="font-weight: 700; color: #191C20;">Date :</span> ${formattedDate} (UTC)
                </div>
                <div style="font-size: 14px; color: #44474E; line-height: 1.5; margin: 4px 0;">
                  <span style="font-weight: 700; color: #191C20;">Adresse IP :</span> ${ipAddress}
                </div>
              </div>

              <div style="background-color: #FFDAD6; border-radius: 16px; padding: 16px; margin: 24px 0; font-size: 14px; color: #93000A; line-height: 1.5; font-weight: 500;">
                ⚠️ Ce code expire dans 10 minutes. Ne le partagez avec personne.
              </div>

              <p style="font-size: 14px; line-height: 1.6; color: #44474E; margin: 24px 0 0 0;">
                Si vous n'êtes pas à l'origine de cette demande, ignorez cet email ou
                <a href="${appUrl}/support" style="color: #415F91; text-decoration: none; font-weight: 700;">contactez le support</a> en cas de doute.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 32px; text-align: center; border-top: 1px solid #E0E2EC; background-color: #F3F3FA;">
              <p style="font-size: 14px; font-weight: 700; color: #415F91; margin: 0;">Restez connecté(e) !</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;
  }

  private getLoginNotificationTemplate(
    name: string,
    email: string,
    appName: string,
    ipAddress: string,
    timestamp: Date,
    appUrl: string,
  ): string {
    const formattedDate =
      timestamp.toISOString().replace('T', ' ').substring(0, 19) + ' (UTC)';

    return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Notification de connexion</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Google Sans', Roboto, -apple-system, BlinkMacSystemFont, Arial, sans-serif; background-color: #F9F9FF; color: #191C20;">
  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #F9F9FF; font-family: 'Google Sans', Roboto, Arial, sans-serif;">
    <tr>
      <td align="center" style="padding: 40px 16px;">
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 560px; background-color: #FFFFFF; border: 1px solid #E0E2EC; border-radius: 24px; overflow: hidden; box-shadow: 0 4px 12px rgba(65, 95, 145, 0.05);">
          <tr>
            <td style="padding: 32px 32px 16px 32px; text-align: center;">
              <table border="0" cellpadding="0" cellspacing="0" align="center" style="margin: 0 auto 16px auto; background-color: #FFDAD6; border-radius: 50%; width: 64px; height: 64px; text-align: center;">
                <tr>
                  <td align="center" valign="middle" style="height: 64px; width: 64px; vertical-align: middle;">
                    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#BA1A1A" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display: inline-block; vertical-align: middle;">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                      <line x1="12" y1="8" x2="12" y2="12"/>
                      <line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                  </td>
                </tr>
              </table>
              <div style="font-size: 20px; font-weight: 700; color: #415F91; letter-spacing: -0.5px; margin-top: 8px;">${appName}</div>
            </td>
          </tr>
          <tr>
            <td style="padding: 16px 32px 32px 32px;">
              <h1 style="font-size: 22px; font-weight: 700; color: #191C20; margin: 0 0 20px 0; line-height: 1.3; text-align: center;">Nouvelle connexion détectée</h1>
              <p style="font-size: 15px; line-height: 1.6; color: #191C20; margin: 0 0 16px 0;">Bonjour ${name},</p>
              <p style="font-size: 15px; line-height: 1.6; color: #191C20; margin: 0 0 24px 0;">
                Nous avons détecté une connexion à votre compte <span style="font-weight: 700; color: #415F91;">${appName}</span>
                (<a href="mailto:${email}" style="color: #415F91; text-decoration: none;">${email}</a>) depuis une nouvelle adresse IP.
              </p>
              
              <div style="background-color: #F3F3FA; border-radius: 16px; padding: 18px; margin: 24px 0;">
                <div style="font-size: 14px; color: #44474E; line-height: 1.5; margin: 4px 0;">
                  <span style="font-weight: 700; color: #191C20;">Date :</span> ${formattedDate}
                </div>
                <div style="font-size: 14px; color: #44474E; line-height: 1.5; margin: 4px 0;">
                  <span style="font-weight: 700; color: #191C20;">Adresse IP :</span> ${ipAddress}
                </div>
              </div>

              <div style="text-align: center; margin: 32px 0;">
                <a href="${appUrl}" style="display: inline-block; background-color: #415F91; color: #FFFFFF; text-decoration: none; padding: 12px 32px; border-radius: 100px; font-weight: 700; font-size: 15px; letter-spacing: 0.25px;">Accéder à votre compte</a>
              </div>

              <p style="font-size: 14px; line-height: 1.6; color: #44474E; margin: 24px 0 0 0;">
                Vous ne reconnaissez pas cette activité ?
                <a href="${appUrl}/reset-password" style="color: #415F91; text-decoration: none; font-weight: 700;">Réinitialisez votre mot de passe</a> et contactez
                <a href="${appUrl}/support" style="color: #415F91; text-decoration: none; font-weight: 700;">le support</a> immédiatement.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 32px; text-align: center; border-top: 1px solid #E0E2EC; background-color: #F3F3FA;">
              <p style="font-size: 14px; font-weight: 700; color: #415F91; margin: 0 0 12px 0;">Restez connecté(e) !</p>
              <div style="margin-top: 15px; margin-bottom: 15px;">
                <a href="#" style="display: inline-block; margin: 0 8px; color: #44474E; text-decoration: none; font-size: 14px; font-weight: 500;">𝕏 (Twitter)</a>
                <a href="#" style="display: inline-block; margin: 0 8px; color: #44474E; text-decoration: none; font-size: 14px; font-weight: 500;">Telegram</a>
                <a href="#" style="display: inline-block; margin: 0 8px; color: #44474E; text-decoration: none; font-size: 14px; font-weight: 500;">Facebook</a>
                <a href="#" style="display: inline-block; margin: 0 8px; color: #44474E; text-decoration: none; font-size: 14px; font-weight: 500;">LinkedIn</a>
              </div>
              <p style="font-size: 12px; color: #44474E; margin: 0;">
                Ceci est un message automatique, merci de ne pas répondre.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;
  }

  async sendSetInvitation(
    email: string,
    inviterName: string,
    setTitle: string,
  ): Promise<void> {
    const appName = this.configService.get<string>(
      'APP_NAME',
      'EXETAT Mastery',
    );
    const appUrl = this.configService.get<string>(
      'FRONTEND_URL',
      'http://localhost:5173',
    );

    const htmlContent = this.getSetInvitationTemplate(
      inviterName,
      setTitle,
      appName,
      appUrl,
    );

    await this.transporter.sendMail({
      from: `"${appName}" <${this.configService.get<string>('SMTP_USER')}>`,
      to: email,
      subject: `Invitation : rejoindre « ${setTitle} » sur ${appName}`,
      html: htmlContent,
    });
  }

  private getSetInvitationTemplate(
    inviterName: string,
    setTitle: string,
    appName: string,
    appUrl: string,
  ): string {
    return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invitation au quiz</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Google Sans', Roboto, -apple-system, BlinkMacSystemFont, Arial, sans-serif; background-color: #F9F9FF; color: #191C20;">
  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #F9F9FF; font-family: 'Google Sans', Roboto, Arial, sans-serif;">
    <tr>
      <td align="center" style="padding: 40px 16px;">
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 560px; background-color: #FFFFFF; border: 1px solid #E0E2EC; border-radius: 24px; overflow: hidden; box-shadow: 0 4px 12px rgba(65, 95, 145, 0.05);">
          <tr>
            <td style="padding: 32px 32px 16px 32px; text-align: center;">
              <table border="0" cellpadding="0" cellspacing="0" align="center" style="margin: 0 auto 16px auto; background-color: #D6E3FF; border-radius: 50%; width: 64px; height: 64px; text-align: center;">
                <tr>
                  <td align="center" valign="middle" style="height: 64px; width: 64px; vertical-align: middle;">
                    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#284777" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display: inline-block; vertical-align: middle;">
                      <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                      <circle cx="8.5" cy="7" r="4"/>
                      <line x1="20" y1="8" x2="20" y2="14"/>
                      <line x1="17" y1="11" x2="23" y2="11"/>
                    </svg>
                  </td>
                </tr>
              </table>
              <div style="font-size: 20px; font-weight: 700; color: #415F91; letter-spacing: -0.5px; margin-top: 8px;">${appName}</div>
            </td>
          </tr>
          <tr>
            <td style="padding: 16px 32px 32px 32px;">
              <h1 style="font-size: 22px; font-weight: 700; color: #191C20; margin: 0 0 20px 0; line-height: 1.3; text-align: center;">Vous êtes invité(e) !</h1>
              <p style="font-size: 15px; line-height: 1.6; color: #191C20; margin: 0 0 16px 0;">
                <span style="font-weight: 700; color: #415F91;">${inviterName}</span> vous a invité(e) à rejoindre un ensemble de quiz sur <strong>${appName}</strong>.
              </p>
              
              <div style="background-color: #D6E3FF; border-radius: 16px; padding: 20px; margin: 24px 0; text-align: center;">
                <div style="font-size: 13px; color: #284777; margin-bottom: 8px; font-weight: 700; text-transform: uppercase;">Ensemble de quiz</div>
                <div style="font-size: 18px; font-weight: 700; color: #284777; margin: 10px 0;">&laquo; ${setTitle} &raquo;</div>
                <div style="font-size: 13px; color: #284777; margin-top: 10px;">
                  Entraînez-vous et progressez ensemble !
                </div>
              </div>

              <p style="font-size: 15px; line-height: 1.6; color: #191C20; margin: 16px 0;">
                Cliquez sur le bouton ci-dessous pour voir et accepter l'invitation :
              </p>

              <div style="text-align: center; margin: 32px 0;">
                <a href="${appUrl}/invitations" style="display: inline-block; background-color: #415F91; color: #FFFFFF; text-decoration: none; padding: 12px 32px; border-radius: 100px; font-weight: 700; font-size: 15px; letter-spacing: 0.25px;">Voir l'invitation</a>
              </div>

              <p style="font-size: 14px; line-height: 1.6; color: #44474E; margin: 24px 0 0 0;">
                Vous n'avez pas encore de compte ? Pas de souci !
                <a href="${appUrl}/signup" style="color: #415F91; text-decoration: none; font-weight: 700;">Inscrivez-vous</a> pour commencer.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 32px; text-align: center; border-top: 1px solid #E0E2EC; background-color: #F3F3FA;">
              <p style="font-size: 14px; font-weight: 700; color: #415F91; margin: 0 0 4px 0;">${appName} · Apprendre ensemble</p>
              <p style="font-size: 12px; color: #44474E; margin: 0;">
                Ceci est un message automatique, merci de ne pas répondre.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;
  }
}
