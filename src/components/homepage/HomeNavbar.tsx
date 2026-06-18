'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Menu, X, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ModeToggle } from '@/components/ui/mode-toggle';
import { MegaSearchBar } from './MegaSearchBar';
import { colombianCities } from '@/lib/design-tokens';
import { cn } from '@/lib/utils';

export function HomeNavbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [selectedCity, setSelectedCity] = useState('Bogotá');

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/90">
      <nav
        className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6"
        aria-label="Navegación principal"
      >
        {/* Logo */}
        <Link
          href="/"
          className="flex shrink-0 items-center gap-1.5 font-bold text-xl sm:text-2xl"
          aria-label="OigaGIG inicio"
        >
          <span className="text-2xl" aria-hidden>
            🧡
          </span>
          <span className="bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent">
            OG OigaGIG
          </span>
        </Link>

        {/* Desktop search */}
        <div className="hidden lg:flex flex-1 max-w-sm mx-4">
          <MegaSearchBar variant="compact" defaultCity={selectedCity} />
        </div>

        {/* Desktop nav links */}
        <div className="hidden md:flex items-center gap-1">
          <Button variant="ghost" asChild className="text-sm font-medium">
            <Link href="/gigs">Categorías</Link>
          </Button>
          <Button variant="ghost" asChild className="text-sm font-medium">
            <Link href="/create-gig">Para Profesionales</Link>
          </Button>
        </div>

        {/* City chips — desktop */}
        <div className="hidden xl:flex items-center gap-1.5">
          {colombianCities.slice(0, 4).map((city) => (
            <button
              key={city.id}
              type="button"
              onClick={() => setSelectedCity(city.label)}
              className={cn(
                'rounded-full px-3 py-1 text-xs font-medium transition-all',
                selectedCity === city.label
                  ? 'bg-orange-500 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-orange-50 hover:text-orange-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-orange-950'
              )}
            >
              {city.label}
            </button>
          ))}
        </div>

        {/* Actions */}
        <div className="ml-auto flex items-center gap-2">
          <ModeToggle />
          <Button variant="ghost" asChild className="hidden sm:inline-flex text-sm">
            <Link href="/login">Ingresar</Link>
          </Button>
          <Button
            asChild
            className="bg-[#F97316] hover:bg-[#EA580C] text-white font-semibold shadow-sm"
          >
            <Link href="/signup">Registrarme gratis</Link>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-expanded={mobileOpen}
            aria-label={mobileOpen ? 'Cerrar menú' : 'Abrir menú'}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </nav>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-t border-slate-200 bg-white px-4 py-4 dark:border-slate-800 dark:bg-slate-900 md:hidden">
          <MegaSearchBar variant="compact" defaultCity={selectedCity} className="mb-4" />
          <div className="flex flex-wrap gap-2 mb-4">
            {colombianCities.map((city) => (
              <button
                key={city.id}
                type="button"
                onClick={() => setSelectedCity(city.label)}
                className={cn(
                  'rounded-full px-3 py-1.5 text-xs font-medium',
                  selectedCity === city.label
                    ? 'bg-orange-500 text-white'
                    : 'bg-slate-100 text-slate-600 dark:bg-slate-800'
                )}
              >
                {city.label}
              </button>
            ))}
          </div>
          <div className="flex flex-col gap-2">
            <Button variant="ghost" asChild className="justify-start">
              <Link href="/gigs" onClick={() => setMobileOpen(false)}>
                Categorías
              </Link>
            </Button>
            <Button variant="ghost" asChild className="justify-start">
              <Link href="/create-gig" onClick={() => setMobileOpen(false)}>
                Para Profesionales
              </Link>
            </Button>
            <Button variant="ghost" asChild className="justify-start sm:hidden">
              <Link href="/login" onClick={() => setMobileOpen(false)}>
                Ingresar
              </Link>
            </Button>
          </div>
        </div>
      )}

      {/* Mobile city selector bar */}
      <div className="flex xl:hidden items-center gap-2 overflow-x-auto px-4 py-2 border-t border-slate-100 dark:border-slate-800 scrollbar-none">
        <span className="text-xs text-muted-foreground shrink-0 flex items-center gap-1">
          <ChevronDown className="h-3 w-3" aria-hidden />
          Ciudad:
        </span>
        {colombianCities.map((city) => (
          <button
            key={city.id}
            type="button"
            onClick={() => setSelectedCity(city.label)}
            className={cn(
              'shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-all',
              selectedCity === city.label
                ? 'bg-orange-500 text-white'
                : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
            )}
          >
            {city.label}
          </button>
        ))}
      </div>
    </header>
  );
}