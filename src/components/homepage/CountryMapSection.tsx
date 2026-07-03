'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';
import {
  getCountryHref,
  listCountries,
  WORLD_MAP_SECTION_ID,
  type CountryConfig,
} from '@/lib/countries';

type CountryMapSectionProps = {
  sellerCounts: Record<string, number>;
};

function statusBadge(country: CountryConfig): { label: string; className: string } {
  if (country.status === 'live') {
    return { label: 'En vivo', className: 'bg-emerald-100 text-emerald-800' };
  }
  return { label: 'Próximamente', className: 'bg-amber-100 text-amber-800' };
}

export function CountryMapSection({ sellerCounts }: CountryMapSectionProps) {
  const countries = listCountries();

  return (
    <section
      id={WORLD_MAP_SECTION_ID}
      className="scroll-mt-20 bg-white py-12 dark:bg-slate-950"
    >
      <div className="mx-auto my-4 max-w-4xl rounded-2xl border bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h2 className="mb-6 text-center text-xl font-bold">
          🌎 Haz clic en un país del mapa
        </h2>

        <div className="flex flex-wrap justify-center gap-6 sm:gap-8">
          {countries.map((country) => {
            const href = getCountryHref(country);
            const badge = statusBadge(country);
            const sellers = sellerCounts[country.code] ?? 0;

            return (
              <Link
                key={country.code}
                href={href}
                className={cn(
                  'group flex flex-col items-center gap-2 rounded-xl p-4 text-center transition-transform hover:scale-110',
                  'min-w-[140px] cursor-pointer',
                )}
              >
                <span className="text-5xl" aria-hidden>
                  {country.flag}
                </span>
                <span className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                  {country.name}
                </span>
                <span
                  className={cn(
                    'rounded-full px-2.5 py-0.5 text-xs font-medium',
                    badge.className,
                  )}
                >
                  {badge.label}
                </span>
                {country.status === 'coming_soon' && sellers > 0 ? (
                  <span className="text-xs text-muted-foreground">
                    {sellers} profesional{sellers === 1 ? '' : 'es'}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}