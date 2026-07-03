'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Menu, X, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import Logo from '@/components/common/Logo';
import {
  getCountryHref,
  listCountries,
  WORLD_MAP_SECTION_ID,
  type CountryConfig,
} from '@/lib/countries';

type WorldwideHeaderProps = {
  activeCountry?: string;
};

function statusLabel(country: CountryConfig): string {
  return country.status === 'live' ? 'En vivo' : 'Próximamente';
}

export function WorldwideHeader({ activeCountry }: WorldwideHeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const countries = listCountries();

  const resolvedActive =
    activeCountry ??
    (pathname && pathname.length > 1 ? pathname.replace(/^\//, '').split('/')[0] : 'co');

  const handleMapClick = useCallback(() => {
    setMobileOpen(false);
    if (pathname === '/') {
      const el = document.getElementById(WORLD_MAP_SECTION_ID);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      }
    }
    router.push(`/#${WORLD_MAP_SECTION_ID}`);
  }, [pathname, router]);

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 sm:py-4">
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <Logo size={36} variant="compact" linkClassName="shrink-0" />
          <div className="hidden sm:flex items-center gap-1.5 text-sm font-semibold text-slate-700 dark:text-slate-200">
            <span aria-hidden>🇨🇴</span>
            <span>Conexión Colombia</span>
          </div>
        </div>

        <nav
          className="hidden lg:flex items-center gap-4 text-sm font-medium"
          aria-label="Países"
        >
          {countries.map((country) => {
            const href = getCountryHref(country);
            const isActive = country.code === resolvedActive;
            return (
              <Link
                key={country.code}
                href={href}
                className={cn(
                  'whitespace-nowrap transition-colors hover:text-blue-600',
                  isActive ? 'text-blue-600 font-semibold' : 'text-slate-700 dark:text-slate-300',
                )}
              >
                {country.flag} {country.name}
              </Link>
            );
          })}
          <button
            type="button"
            onClick={handleMapClick}
            className="flex items-center gap-1 text-blue-600 hover:text-blue-700 font-medium"
          >
            <Globe className="h-4 w-4" aria-hidden />
            Mapa interactivo
          </button>
        </nav>

        <div className="hidden md:flex items-center gap-2">
          <Button variant="ghost" asChild size="sm" className="rounded-full">
            <Link href="/login">Ingresar</Link>
          </Button>
          <Button asChild size="sm" className="rounded-full bg-blue-600 hover:bg-blue-700 text-white">
            <Link href="/signup?role=seller">Publicar un gig (Gratis)</Link>
          </Button>
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden shrink-0"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-expanded={mobileOpen}
          aria-label={mobileOpen ? 'Cerrar menú' : 'Abrir menú'}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {mobileOpen && (
        <div className="border-t border-slate-200 bg-white px-4 py-4 dark:border-slate-800 dark:bg-slate-900 lg:hidden">
          <p className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-slate-600">
            <span aria-hidden>🇨🇴</span> Conexión Colombia
          </p>
          <div className="flex flex-col gap-1">
            {countries.map((country) => {
              const href = getCountryHref(country);
              const isActive = country.code === resolvedActive;
              return (
                <Button key={country.code} variant="ghost" asChild className="justify-start">
                  <Link href={href} onClick={() => setMobileOpen(false)}>
                    <span className={cn(isActive && 'text-blue-600 font-semibold')}>
                      {country.flag} {country.name}{' '}
                      <span className="text-xs text-muted-foreground">
                        ({statusLabel(country)})
                      </span>
                    </span>
                  </Link>
                </Button>
              );
            })}
            <Button variant="ghost" className="justify-start text-blue-600" onClick={handleMapClick}>
              <Globe className="h-4 w-4 mr-2" aria-hidden />
              Mapa interactivo
            </Button>
            <Button variant="ghost" asChild className="justify-start">
              <Link href="/login" onClick={() => setMobileOpen(false)}>
                Ingresar
              </Link>
            </Button>
            <Button asChild className="justify-start bg-blue-600 hover:bg-blue-700 text-white">
              <Link href="/signup?role=seller" onClick={() => setMobileOpen(false)}>
                Publicar un gig (Gratis)
              </Link>
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}