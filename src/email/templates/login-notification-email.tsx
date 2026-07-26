import { Button, Heading, Link, Section, Text } from 'react-email';
import { EmailLayout } from './components/email-layout';

export interface LoginNotificationEmailProps {
  name: string;
  email: string;
  appName: string;
  ipAddress: string;
  formattedDate: string;
  appUrl: string;
  logoUrl: string;
}

export default function LoginNotificationEmail({
  name,
  email,
  appName,
  ipAddress,
  formattedDate,
  appUrl,
  logoUrl,
}: LoginNotificationEmailProps) {
  return (
    <EmailLayout
      preview="Connexion détectée : nouvel appareil ou nouvel emplacement ?"
      appName={appName}
      logoUrl={logoUrl}
      appUrl={appUrl}
      footerNote="Restez connecté(e) !"
    >
      <Heading className="m-0 mb-5 text-center text-[22px] font-bold leading-snug text-on-surface">
        Nouvelle connexion détectée
      </Heading>

      <Text className="m-0 mb-4 text-[15px] leading-relaxed text-on-surface">
        Bonjour {name},
      </Text>

      <Text className="m-0 mb-6 text-[15px] leading-relaxed text-on-surface">
        Nous avons détecté une connexion à votre compte{' '}
        <span className="font-bold text-brand">{appName}</span> (
        <Link href={`mailto:${email}`} className="text-brand no-underline">
          {email}
        </Link>
        ) depuis une nouvelle adresse IP.
      </Text>

      <Section className="my-6 rounded-2xl bg-surface-low px-[18px] py-[18px]">
        <Text className="m-0 my-1 text-sm leading-normal text-on-surface-variant">
          <span className="font-bold text-on-surface">Date :</span>{' '}
          {formattedDate}
        </Text>
        <Text className="m-0 my-1 text-sm leading-normal text-on-surface-variant">
          <span className="font-bold text-on-surface">Adresse IP :</span>{' '}
          {ipAddress}
        </Text>
      </Section>

      <Section className="my-8 text-center">
        <Button
          href={appUrl}
          className="box-border rounded-full bg-brand px-8 py-3 text-center text-[15px] font-bold tracking-wide text-brand-on no-underline"
        >
          Accéder à votre compte
        </Button>
      </Section>

      <Text className="m-0 mt-6 text-sm leading-relaxed text-on-surface-variant">
        Vous ne reconnaissez pas cette activité ? Contactez{' '}
        <Link
          href={`${appUrl}/support`}
          className="font-bold text-brand no-underline"
        >
          le support
        </Link>{' '}
        immédiatement pour sécuriser votre compte.
      </Text>
    </EmailLayout>
  );
}

LoginNotificationEmail.PreviewProps = {
  name: 'Justin Bisimwa',
  email: 'justin@example.com',
  appName: 'EXETATEST',
  ipAddress: '192.168.1.50',
  formattedDate: '2026-06-14 12:00:00 (UTC)',
  appUrl: 'http://localhost:3000',
  logoUrl: '/static/logo.png',
} satisfies LoginNotificationEmailProps;

export { LoginNotificationEmail };
