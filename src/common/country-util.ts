import countries from './countries.json';

export const isValidCountryCode = (code: string | null | undefined): boolean => {
  if (!code) return false;
  try {
    const up = code.toUpperCase();
    return countries.some((c: { code: string }) => c.code === up);
  } catch (err) {
    return false;
  }
};

export const normalizeCountryCode = (code: string | null | undefined): string | null => {
  if (!code) return null;
  return code.toUpperCase();
};

export const allCountryCodes = (): string[] => countries.map((c: { code: string }) => c.code);
