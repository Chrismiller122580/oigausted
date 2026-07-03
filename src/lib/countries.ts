export type CountryStatus = 'live' | 'coming_soon';

export type CountryConfig = {
  code: string;
  name: string;
  flag: string;
  status: CountryStatus;
  heroGradient: string;
  paymentLabel: string;
  poweredBy?: string;
  categories: string[];
  pioneerLimit: number;
  livePath?: string;
};

export const WORLD_MAP_SECTION_ID = 'mapa-mundial';

const DEFAULT_CATEGORIES = [
  '🛠️ Reparaciones',
  '🎵 DJ y eventos',
  '📸 Fotografía',
  '🏠 Limpieza',
  '💄 Belleza',
];

export const COUNTRIES: CountryConfig[] = [
  {
    code: 'co',
    name: 'Colombia',
    flag: '🇨🇴',
    status: 'live',
    heroGradient: 'linear-gradient(135deg, #C2410C, #9A3412)',
    paymentLabel: 'Wompi',
    categories: DEFAULT_CATEGORIES,
    pioneerLimit: 50,
    livePath: '/',
  },
  {
    code: 'pa',
    name: 'Panamá',
    flag: '🇵🇦',
    status: 'coming_soon',
    heroGradient: 'linear-gradient(135deg, #D91F26, #0038A8)',
    paymentLabel: 'Wompi Panamá',
    poweredBy: 'Conexión Colombia',
    categories: DEFAULT_CATEGORIES,
    pioneerLimit: 50,
  },
  {
    code: 'sv',
    name: 'El Salvador',
    flag: '🇸🇻',
    status: 'coming_soon',
    heroGradient: 'linear-gradient(135deg, #0047AB, #1E3A8A)',
    paymentLabel: 'Pagos seguros',
    poweredBy: 'Conexión Colombia',
    categories: DEFAULT_CATEGORIES,
    pioneerLimit: 50,
  },
];

const countryMap = new Map(COUNTRIES.map((c) => [c.code, c]));

export function listCountries(): CountryConfig[] {
  return COUNTRIES;
}

export function getCountry(code: string | null | undefined): CountryConfig | undefined {
  if (!code) return undefined;
  return countryMap.get(code.toLowerCase().trim());
}

export function isValidCountryCode(code: string | null | undefined): boolean {
  return !!getCountry(code);
}

export function getCountryHref(country: CountryConfig): string {
  if (country.status === 'live' && country.livePath) {
    return country.livePath;
  }
  return `/${country.code}`;
}

export function getCountrySignupUrl(
  code: string,
  role: 'buyer' | 'seller',
): string {
  const params = new URLSearchParams({ country: code, role });
  return `/signup?${params.toString()}`;
}

export function isCountryLandingPath(pathname: string | null | undefined): boolean {
  if (!pathname) return false;
  const segment = pathname.replace(/^\//, '').split('/')[0];
  if (!segment) return false;
  const country = getCountry(segment);
  return !!country && country.status === 'coming_soon';
}

export function normalizeCountryCode(code: string | null | undefined): string {
  const normalized = code?.toLowerCase().trim() ?? 'co';
  return getCountry(normalized)?.code ?? 'co';
}

export function isComingSoonCountry(code: string): boolean {
  return getCountry(code)?.status === 'coming_soon';
}