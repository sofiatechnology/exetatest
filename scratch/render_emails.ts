import * as fs from 'fs';
import * as path from 'path';
import {
  renderInactivityReminderEmail,
  renderLoginNotificationEmail,
  renderOtpEmail,
  renderSetInvitationEmail,
} from '../src/email/email.renderer';

async function run() {
  const outputDir = __dirname;
  const logoUrl = '/static/logo.png';
  console.log(`Writing rendered templates to: ${outputDir}`);

  const otp = await renderOtpEmail({
    name: 'Justin Bisimwa',
    appName: 'EXETATEST',
    otp: '123456',
    ipAddress: '192.168.1.50',
    formattedDate: '2026-06-14 12:00:00',
    appUrl: 'http://localhost:3000',
    logoUrl,
  });
  fs.writeFileSync(path.join(outputDir, 'otp_email.html'), otp.html);
  console.log('Saved otp_email.html');

  const login = await renderLoginNotificationEmail({
    name: 'Justin Bisimwa',
    email: 'justin@example.com',
    appName: 'EXETATEST',
    ipAddress: '192.168.1.50',
    formattedDate: '2026-06-14 12:00:00 (UTC)',
    appUrl: 'http://localhost:3000',
    logoUrl,
  });
  fs.writeFileSync(path.join(outputDir, 'login_email.html'), login.html);
  console.log('Saved login_email.html');

  const invite = await renderSetInvitationEmail({
    inviterName: 'Arsène Lupin',
    setTitle: 'Mathématiques Générales - Session 2026',
    appName: 'EXETATEST',
    appUrl: 'http://localhost:3000',
    logoUrl,
  });
  fs.writeFileSync(path.join(outputDir, 'invite_email.html'), invite.html);
  console.log('Saved invite_email.html');

  const inactivity = await renderInactivityReminderEmail({
    name: 'Justin Bisimwa',
    inactivityDays: 15,
    appName: 'EXETATEST',
    appUrl: 'http://localhost:5173',
    logoUrl,
    unsubscribeUrl:
      'http://localhost:9080/api/email/unsubscribe?email=justin@example.com&token=preview',
  });
  fs.writeFileSync(
    path.join(outputDir, 'inactivity_email.html'),
    inactivity.html,
  );
  console.log('Saved inactivity_email.html');
}

run().catch(console.error);
