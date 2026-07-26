import { Heading, Link, Section, Text } from 'react-email';
import { EmailLayout } from './components/email-layout';

export interface OtpEmailProps {
  name: string;
  appName: string;
  otp: string;
  ipAddress: string;
  formattedDate: string;
  appUrl: string;
  logoUrl: string;
}

export default function OtpEmail({
  name,
  appName,
  otp,
  ipAddress,
  formattedDate,
  appUrl,
  logoUrl,
}: OtpEmailProps) {
  return (
    <EmailLayout
      preview={`Votre code de connexion ${appName} expire dans 10 minutes`}
      appName={appName}
      logoUrl={logoUrl}
      appUrl={appUrl}
      footerNote="Restez connecté(e) !"
    >
      <Heading className="m-0 mb-5 text-center text-[22px] font-bold leading-snug text-on-surface">
        Votre code de connexion
      </Heading>

      <Text className="m-0 mb-4 text-[15px] leading-relaxed text-on-surface">
        Bonjour {name},
      </Text>

      <Text className="m-0 mb-6 text-[15px] leading-relaxed text-on-surface">
        Vous avez demandé à vous connecter à votre compte{' '}
        <strong>{appName}</strong>. Utilisez le code ci-dessous pour finaliser
        votre connexion.
      </Text>

      <Section className="my-7 rounded-2xl bg-brand-container px-5 py-6 text-center">
        <Text className="m-0 mb-2 text-[13px] font-bold uppercase tracking-wider text-brand-on-container">
          Votre code OTP
        </Text>
        <Text className="m-0 font-mono text-[40px] font-bold tracking-[8px] text-brand-on-container">
          {otp}
        </Text>
      </Section>

      <Section className="my-6 rounded-2xl bg-surface-low px-[18px] py-[18px]">
        <Text className="m-0 my-1 text-sm leading-normal text-on-surface-variant">
          <span className="font-bold text-on-surface">Date :</span>{' '}
          {formattedDate} (UTC)
        </Text>
        <Text className="m-0 my-1 text-sm leading-normal text-on-surface-variant">
          <span className="font-bold text-on-surface">Adresse IP :</span>{' '}
          {ipAddress}
        </Text>
      </Section>

      <Section className="my-6 rounded-2xl bg-error-container px-4 py-4">
        <Text className="m-0 text-sm font-medium leading-normal text-on-error-container">
          Ce code expire dans 10 minutes. Ne le partagez avec personne.
        </Text>
      </Section>

      <Text className="m-0 mt-6 text-sm leading-relaxed text-on-surface-variant">
        Si vous n&apos;êtes pas à l&apos;origine de cette demande, ignorez cet
        email ou{' '}
        <Link
          href={`${appUrl}/support`}
          className="font-bold text-brand no-underline"
        >
          contactez le support
        </Link>{' '}
        en cas de doute.
      </Text>
    </EmailLayout>
  );
}

OtpEmail.PreviewProps = {
  name: 'Justin Bisimwa',
  appName: 'EXETATEST',
  otp: '123456',
  ipAddress: '192.168.1.50',
  formattedDate: '2026-06-14 12:00:00',
  appUrl: 'http://localhost:3000',
  logoUrl: '/static/logo.png',
} satisfies OtpEmailProps;

export { OtpEmail };
