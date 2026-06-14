import { EmailService } from '../src/email/email.service';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';

// Mock ConfigService
class MockConfigService {
  get(key: string, defaultValue?: any) {
    const config: Record<string, any> = {
      SMTP_HOST: 'smtp.example.com',
      SMTP_PORT: 587,
      SMTP_SECURE: false,
      SMTP_USER: 'test@example.com',
      SMTP_PASS: 'password',
      SMTP_FROM: 'noreply@exetatest.com',
      APP_NAME: 'EXETATEST',
      APP_URL: 'http://localhost:3000',
      FRONTEND_URL: 'http://localhost:5173',
    };
    return config[key] !== undefined ? config[key] : defaultValue;
  }
}

async function run() {
  const mockConfig = new MockConfigService() as unknown as ConfigService;
  const emailService = new EmailService(mockConfig);

  const outputDir = __dirname;
  console.log(`Writing rendered templates to: ${outputDir}`);

  // 1. OTP Template
  const otpHtml = (emailService as any).getOTPTemplate(
    'Justin Bisimwa',
    'EXETATEST',
    '123456',
    '192.168.1.50',
    new Date('2026-06-14T12:00:00Z'),
    'http://localhost:3000'
  );
  fs.writeFileSync(path.join(outputDir, 'otp_email.html'), otpHtml);
  console.log('Saved otp_email.html');

  // 2. Login Notification Template
  const loginHtml = (emailService as any).getLoginNotificationTemplate(
    'Justin Bisimwa',
    'justin@example.com',
    'EXETATEST',
    '192.168.1.50',
    new Date('2026-06-14T12:00:00Z'),
    'http://localhost:3000'
  );
  fs.writeFileSync(path.join(outputDir, 'login_email.html'), loginHtml);
  console.log('Saved login_email.html');

  // 3. Set Invitation Template
  const inviteHtml = (emailService as any).getSetInvitationTemplate(
    'Arsène Lupin',
    'Mathématiques Générales - Session 2026',
    'EXETATEST',
    'http://localhost:3000'
  );
  fs.writeFileSync(path.join(outputDir, 'invite_email.html'), inviteHtml);
  console.log('Saved invite_email.html');

  // 4. Inactivity Reminder Template
  try {
    if ((emailService as any).getInactivityReminderTemplate) {
      const inactivityHtml = (emailService as any).getInactivityReminderTemplate(
        'Justin Bisimwa',
        15,
        'EXETATEST',
        'http://localhost:5173'
      );
      fs.writeFileSync(path.join(outputDir, 'inactivity_email.html'), inactivityHtml);
      console.log('Saved inactivity_email.html');
    } else {
      console.log('getInactivityReminderTemplate does not exist yet. Will render it after refactoring.');
    }
  } catch (e) {
    console.error('Error rendering inactivity template:', e);
  }
}

run().catch(console.error);
