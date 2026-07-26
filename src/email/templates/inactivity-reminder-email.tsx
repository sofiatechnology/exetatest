import { Button, Heading, Link, Section, Text } from 'react-email';
import { EmailLayout } from './components/email-layout';

export interface InactivityReminderEmailProps {
  name: string;
  inactivityDays: number;
  appName: string;
  appUrl: string;
  logoUrl: string;
  unsubscribeUrl: string;
}

export default function InactivityReminderEmail({
  name,
  inactivityDays,
  appName,
  appUrl,
  logoUrl,
  unsubscribeUrl,
}: InactivityReminderEmailProps) {
  return (
    <EmailLayout
      preview={`On vous attend sur ${appName}`}
      appName={appName}
      logoUrl={logoUrl}
      appUrl={appUrl}
      footerNote="À très vite !"
    >
      <Heading className="m-0 mb-5 text-center text-[22px] font-bold leading-snug text-on-surface">
        On vous attend sur {appName}
      </Heading>

      <Text className="m-0 mb-4 text-[15px] leading-relaxed text-on-surface">
        Bonjour {name},
      </Text>

      <Text className="m-0 mb-6 text-[15px] leading-relaxed text-on-surface">
        Ça fait <strong>{inactivityDays} jours</strong> qu&apos;on ne vous a pas
        vu(e). Une petite séance aujourd&apos;hui peut relancer votre
        progression.
      </Text>

      <Section className="my-8 text-center">
        <Button
          href={appUrl}
          className="box-border rounded-full bg-brand px-8 py-3 text-center text-[15px] font-bold tracking-wide text-brand-on no-underline"
        >
          Reprendre l&apos;entraînement
        </Button>
      </Section>

      <Text className="m-0 mt-6 text-[13px] italic leading-relaxed text-on-surface-variant">
        Si vous n&apos;avez plus accès à ce compte, ignorez simplement cet
        email. Ceci est un message automatique.
      </Text>

      <Text className="m-0 mt-4 text-center text-xs text-on-surface-variant">
        Vous ne souhaitez plus recevoir ces rappels ?{' '}
        <Link href={unsubscribeUrl} className="text-brand no-underline">
          Se désinscrire
        </Link>
      </Text>
    </EmailLayout>
  );
}

InactivityReminderEmail.PreviewProps = {
  name: 'Justin Bisimwa',
  inactivityDays: 15,
  appName: 'EXETATEST',
  appUrl: 'http://localhost:5173',
  logoUrl: '/static/logo.png',
  unsubscribeUrl:
    'http://localhost:9080/api/email/unsubscribe?email=demo@example.com&token=preview',
} satisfies InactivityReminderEmailProps;

export { InactivityReminderEmail };
