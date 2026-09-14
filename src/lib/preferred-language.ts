export type AppLanguage = 'es' | 'en';

export const SUPPORTED_LANGUAGES: Array<{
  code: AppLanguage;
  label: string;
  nativeLabel: string;
}> = [
  { code: 'es', label: 'Spanish', nativeLabel: 'Español' },
  { code: 'en', label: 'English', nativeLabel: 'English' },
];

const SPANISH_COUNTRIES = new Set([
  'co', 'mx', 'es', 'ar', 'cl', 'pe', 'ec', 've', 'uy', 'py', 'bo',
  'gt', 'hn', 'ni', 'cr', 'pa', 'sv', 'do', 'cu', 'pr', 'gq',
]);

const ENGLISH_COUNTRIES = new Set([
  'us', 'gb', 'uk', 'ca', 'au', 'nz', 'ie', 'za', 'jm', 'tt', 'bs', 'bb', 'bz',
]);

const ENGLISH_CITY_HINTS = [
  'miami', 'new york', 'orlando', 'houston', 'dallas', 'atlanta', 'chicago',
  'los angeles', 'toronto', 'london', 'austin', 'nashville', 'tampa',
];

export function parseAppLanguage(value: unknown): AppLanguage | null {
  const raw = String(value || '').trim().toLowerCase();
  if (raw === 'es' || raw.startsWith('es-')) return 'es';
  if (raw === 'en' || raw.startsWith('en-')) return 'en';
  return null;
}

export function recommendLanguageFromLocation(input?: {
  countryCode?: string | null;
  city?: string | null;
}): AppLanguage {
  const country = (input?.countryCode || '').trim().toLowerCase();
  const city = (input?.city || '').trim().toLowerCase();

  if (country && ENGLISH_COUNTRIES.has(country)) return 'en';
  if (country && SPANISH_COUNTRIES.has(country)) return 'es';
  if (city && ENGLISH_CITY_HINTS.some((hint) => city.includes(hint))) return 'en';
  return 'es';
}

export function resolveUserLanguage(user?: {
  preferredLanguage?: string | null;
  countryCode?: string | null;
  city?: string | null;
}): AppLanguage {
  const explicit = parseAppLanguage(user?.preferredLanguage);
  if (explicit) return explicit;
  return recommendLanguageFromLocation({
    countryCode: user?.countryCode,
    city: user?.city,
  });
}

export function languageRecommendationLabel(
  lang: AppLanguage,
  countryCode?: string | null,
): string {
  const country = (countryCode || 'co').toUpperCase();
  if (lang === 'en') {
    return `Recommended from your location (${country})`;
  }
  return `Recomendado por su ubicación (${country})`;
}

export function pickLocalizedCopy<T>(copies: { es: T; en: T }, lang: AppLanguage): T {
  return copies[lang] ?? copies.es;
}
