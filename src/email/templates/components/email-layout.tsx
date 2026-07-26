import {
  Body,
  Container,
  Head,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Tailwind,
  Text,
  pixelBasedPreset,
} from 'react-email';
import type { ReactNode } from 'react';
import { emailColors } from './colors';

export interface EmailLayoutProps {
  preview: string;
  appName: string;
  logoUrl: string;
  appUrl?: string;
  footerNote?: string;
  children: ReactNode;
}

export function EmailLayout({
  preview,
  appName,
  logoUrl,
  appUrl,
  footerNote = 'Ceci est un message automatique, merci de ne pas répondre.',
  children,
}: EmailLayoutProps) {
  return (
    <Html lang="fr">
      <Tailwind
        config={{
          presets: [pixelBasedPreset],
          theme: {
            extend: {
              colors: {
                brand: emailColors.primary,
                'brand-on': emailColors.onPrimary,
                'brand-container': emailColors.primaryContainer,
                'brand-on-container': emailColors.onPrimaryContainer,
                secondary: emailColors.secondary,
                'secondary-container': emailColors.secondaryContainer,
                'on-secondary-container': emailColors.onSecondaryContainer,
                background: emailColors.background,
                surface: emailColors.white,
                'surface-low': emailColors.surfaceContainerLow,
                'on-surface': emailColors.onSurface,
                'on-surface-variant': emailColors.onSurfaceVariant,
                outline: emailColors.outline,
                'outline-variant': emailColors.outlineVariant,
                'error-container': emailColors.errorContainer,
                'on-error-container': emailColors.onErrorContainer,
              },
            },
          },
        }}
      >
        <Head />
        <Body className="m-0 bg-background font-sans text-on-surface">
          <Preview>{preview}</Preview>
          <Container className="mx-auto max-w-[560px] px-4 py-10">
            <Section className="overflow-hidden rounded-3xl border border-solid border-outline-variant bg-surface">
              <Section className="px-8 pb-4 pt-8 text-center">
                <Img
                  src={logoUrl}
                  alt={appName}
                  width="64"
                  height="64"
                  className="mx-auto rounded-2xl"
                />
                <Text className="mt-3 mb-0 text-xl font-bold tracking-tight text-brand">
                  {appName}
                </Text>
              </Section>

              <Section className="px-8 pb-8 pt-2">{children}</Section>

              <Hr className="m-0 border-solid border-outline-variant" />

              <Section className="bg-surface-low px-8 py-8 text-center">
                <Text className="m-0 mb-2 text-sm font-bold text-brand">
                  {appName}
                </Text>
                <Text className="m-0 text-xs text-on-surface-variant">
                  {footerNote}
                </Text>
              </Section>
            </Section>

            {appUrl ? (
              <Section className="px-4 pt-6 text-center">
                <Text className="m-0 text-xs text-on-surface-variant">
                  Préparation à l&apos;examen d&apos;État ·{' '}
                  <Link href={appUrl} className="text-brand no-underline">
                    {appName}
                  </Link>
                </Text>
              </Section>
            ) : null}
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}
