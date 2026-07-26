import { createElement } from 'react';
import { render } from 'react-email';
import InactivityReminderEmail, {
  type InactivityReminderEmailProps,
} from './templates/inactivity-reminder-email';
import LoginNotificationEmail, {
  type LoginNotificationEmailProps,
} from './templates/login-notification-email';
import OtpEmail, { type OtpEmailProps } from './templates/otp-email';
import SetInvitationEmail, {
  type SetInvitationEmailProps,
} from './templates/set-invitation-email';

export async function renderOtpEmail(
  props: OtpEmailProps,
): Promise<{ html: string; text: string }> {
  const [html, text] = await Promise.all([
    render(createElement(OtpEmail, props)),
    render(createElement(OtpEmail, props), { plainText: true }),
  ]);
  return { html, text };
}

export async function renderLoginNotificationEmail(
  props: LoginNotificationEmailProps,
): Promise<{ html: string; text: string }> {
  const [html, text] = await Promise.all([
    render(createElement(LoginNotificationEmail, props)),
    render(createElement(LoginNotificationEmail, props), { plainText: true }),
  ]);
  return { html, text };
}

export async function renderInactivityReminderEmail(
  props: InactivityReminderEmailProps,
): Promise<{ html: string; text: string }> {
  const [html, text] = await Promise.all([
    render(createElement(InactivityReminderEmail, props)),
    render(createElement(InactivityReminderEmail, props), {
      plainText: true,
    }),
  ]);
  return { html, text };
}

export async function renderSetInvitationEmail(
  props: SetInvitationEmailProps,
): Promise<{ html: string; text: string }> {
  const [html, text] = await Promise.all([
    render(createElement(SetInvitationEmail, props)),
    render(createElement(SetInvitationEmail, props), { plainText: true }),
  ]);
  return { html, text };
}
