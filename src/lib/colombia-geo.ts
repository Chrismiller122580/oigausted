import type { Prisma } from '@prisma/client';
import { normalizeCityName } from '@/lib/colombia-cities';

export {
  COLOMBIA_CITIES,
  COLOMBIA_NATIONAL_SCOPE,
  colombianCitiesLegacy,
  citiesByRegion,
  getCityById,
  matchCityInText,
  normalizeCityName,
  type ColombiaCity,
} from '@/lib/colombia-cities';

/** Prisma filter: match city field against label + aliases (case-insensitive). */
export function buildCityWhere(cityInput: string): Prisma.UserWhereInput | null {
  const normalized = normalizeCityName(cityInput);
  if (!normalized) {
    if (!cityInput.trim()) return null;
    return {
      city: { contains: cityInput.trim(), mode: 'insensitive' } as Prisma.StringNullableFilter,
    };
  }

  const terms = [normalized.label, normalized.slug, ...normalized.aliases];
  return {
    OR: terms.map((term) => ({
      city: { contains: term, mode: 'insensitive' } as Prisma.StringNullableFilter,
    })),
  };
}

/** Colombia users filter — empty fallback if countryCode column not migrated yet. */
export function colombiaUserFilter(): Prisma.UserWhereInput {
  return { countryCode: 'co' };
}

export function isCountryCodeSchemaDrift(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return msg.includes('countryCode') || msg.includes('P2022');
}

export function withoutCountryCode(where: Prisma.UserWhereInput): Prisma.UserWhereInput {
  if (!where || typeof where !== 'object') return where;
  const { countryCode: _removed, ...rest } = where as Prisma.UserWhereInput & { countryCode?: string };
  if (rest.AND && Array.isArray(rest.AND)) {
    return {
      ...rest,
      AND: rest.AND.map((clause) =>
        typeof clause === 'object' && clause !== null
          ? withoutCountryCode(clause as Prisma.UserWhereInput)
          : clause,
      ),
    };
  }
  return rest;
}