import { prisma } from '@/lib/prisma';
import { getCountry, listCountries } from '@/lib/countries';

export async function countActiveSellers(countryCode: string): Promise<number> {
  const code = getCountry(countryCode)?.code ?? countryCode;
  try {
    return await prisma.user.count({
      where: {
        role: 'seller',
        isActive: true,
        countryCode: code,
      },
    });
  } catch {
    // countryCode column may not exist yet during migration
    if (code === 'co') {
      return await prisma.user.count({
        where: { role: 'seller', isActive: true },
      });
    }
    return 0;
  }
}

export async function countAllCountrySellers(): Promise<Record<string, number>> {
  const countries = listCountries();
  const entries = await Promise.all(
    countries.map(async (c) => [c.code, await countActiveSellers(c.code)] as const),
  );
  return Object.fromEntries(entries);
}

export function isPioneerEligible(
  countryCode: string,
  currentSellerCount: number,
): boolean {
  const country = getCountry(countryCode);
  if (!country || country.status !== 'coming_soon') return false;
  return currentSellerCount < country.pioneerLimit;
}

export function getPioneerNumber(currentSellerCount: number): number {
  return currentSellerCount + 1;
}