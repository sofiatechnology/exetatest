import { Column, Row, Section, Text } from 'react-email';
import { emailColors } from './colors';

export interface OtpCodeCardProps {
  otp: string;
  label?: string;
  buttonLabel?: string;
}

/**
 * “Code Requested” card: digit boxes + Copy code pill, using project brand colors.
 * Gmail/Apple Mail may also show a native copy control when they detect the OTP.
 */
export function OtpCodeCard({
  otp,
  label = 'Code Requested',
  buttonLabel = 'Copy code',
}: OtpCodeCardProps) {
  const digits = otp.replace(/\D/g, '').padEnd(6, '•').slice(0, 6).split('');

  return (
    <Section className="mb-7 rounded-2xl bg-surface-low px-5 py-5">
      <Text className="m-0 mb-3 text-[13px] leading-normal text-on-surface-variant">
        {label}
      </Text>

      <Row>
        {digits.map((digit, index) => (
          <Column
            key={`${digit}-${index}`}
            className={index < digits.length - 1 ? 'pr-1.5' : undefined}
            style={{ width: 44 }}
          >
            <Section
              className="rounded-lg border border-solid border-outline-variant bg-surface text-center"
              style={{ width: 40, height: 48 }}
            >
              <Text className="m-0 py-[11px] text-center text-[22px] font-semibold leading-none text-on-surface">
                {digit}
              </Text>
            </Section>
          </Column>
        ))}
      </Row>

      {/*
        Anchor keeps email-safe markup. In browser preview (`npm run email`),
        the click handler copies the OTP; mail clients ignore onClick.
      */}
      <Section className="mt-4">
        <a
          href={`#otp-${otp}`}
          onClick={(event) => {
            event.preventDefault();
            if (
              typeof navigator !== 'undefined' &&
              navigator.clipboard?.writeText
            ) {
              void navigator.clipboard.writeText(otp);
            }
          }}
          style={{
            display: 'inline-block',
            boxSizing: 'border-box',
            backgroundColor: emailColors.primary,
            borderRadius: 9999,
            color: emailColors.onPrimary,
            fontSize: 14,
            fontWeight: 500,
            lineHeight: '16px',
            padding: '10px 20px',
            textDecoration: 'none',
          }}
        >
          {buttonLabel}
        </a>
      </Section>
    </Section>
  );
}
