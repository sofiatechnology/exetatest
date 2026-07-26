import { Button, Heading, Link, Section, Text } from 'react-email';
import { EmailLayout } from './components/email-layout';

export interface SetInvitationEmailProps {
  inviterName: string;
  setTitle: string;
  appName: string;
  appUrl: string;
  logoUrl: string;
}

export default function SetInvitationEmail({
  inviterName,
  setTitle,
  appName,
  appUrl,
  logoUrl,
}: SetInvitationEmailProps) {
  return (
    <EmailLayout
      preview={`${inviterName} vous invite à rejoindre « ${setTitle} »`}
      appName={appName}
      logoUrl={logoUrl}
      appUrl={appUrl}
      footerNote={`${appName} · Apprendre ensemble`}
    >
      <Heading className="m-0 mb-5 text-center text-[22px] font-bold leading-snug text-on-surface">
        Vous êtes invité(e) !
      </Heading>

      <Text className="m-0 mb-4 text-[15px] leading-relaxed text-on-surface">
        <span className="font-bold text-brand">{inviterName}</span> vous a
        invité(e) à rejoindre un ensemble de quiz sur <strong>{appName}</strong>
        .
      </Text>

      <Section className="my-6 rounded-2xl bg-brand-container px-5 py-5 text-center">
        <Text className="m-0 mb-2 text-[13px] font-bold uppercase text-brand-on-container">
          Ensemble de quiz
        </Text>
        <Text className="m-0 my-2.5 text-lg font-bold text-brand-on-container">
          &laquo; {setTitle} &raquo;
        </Text>
        <Text className="m-0 mt-2.5 text-[13px] text-brand-on-container">
          Entraînez-vous et progressez ensemble !
        </Text>
      </Section>

      <Text className="m-0 my-4 text-[15px] leading-relaxed text-on-surface">
        Cliquez sur le bouton ci-dessous pour voir et accepter l&apos;invitation
        :
      </Text>

      <Section className="my-8 text-center">
        <Button
          href={`${appUrl}/invitations`}
          className="box-border rounded-full bg-brand px-8 py-3 text-center text-[15px] font-bold tracking-wide text-brand-on no-underline"
        >
          Voir l&apos;invitation
        </Button>
      </Section>

      <Text className="m-0 mt-6 text-sm leading-relaxed text-on-surface-variant">
        Vous n&apos;avez pas encore de compte ? Pas de souci !{' '}
        <Link
          href={`${appUrl}/signup`}
          className="font-bold text-brand no-underline"
        >
          Inscrivez-vous
        </Link>{' '}
        pour commencer.
      </Text>
    </EmailLayout>
  );
}

SetInvitationEmail.PreviewProps = {
  inviterName: 'Arsène Lupin',
  setTitle: 'Mathématiques Générales - Session 2026',
  appName: 'EXETATEST',
  appUrl: 'http://localhost:3000',
  logoUrl: '/static/logo.png',
} satisfies SetInvitationEmailProps;

export { SetInvitationEmail };
