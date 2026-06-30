'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ModeToggle } from '@/components/ui/mode-toggle';
import { brandButtonClass } from '@/lib/design-tokens';
import { cn } from '@/lib/utils';
import { MegaSearchBar } from './MegaSearchBar';

export function HomeNavbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/90">
      <nav
        className="mx-auto flex h-14 max-w-7xl items-center gap-3 px-4 sm:px-6"
        aria-label="Navegación principal"
      >
        <Link
          href="/"
          className="flex shrink-0 items-center gap-1.5 font-bold text-lg sm:text-xl"
        >
          <span className="text-xl" aria-hidden>
            🧡
          </span>
          <span className="bg-gradient-to-r from-orange-700 to-orange-500 bg-clip-text text-transparent">
            OigaGIG
          </span>
        </Link>

        <div className="hidden lg:flex flex-1 max-w-md mx-2">
          <MegaSearchBar variant="compact" />
        </div>

        <div className="hidden md:flex items-center gap-1">
          <Button variant="ghost" asChild size="sm" className="text-sm">
            <Link href="/gigs">Explorar</Link>
          </Button>
          <Button variant="ghost" asChild size="sm" className="text-sm">
            <Link href="/create-gig">Para profesionales</Link>
          </Button>
        </div>

        <div className="ml-auto flex items-center gap-1.5">
          <ModeToggle />
          <Button variant="ghost" asChild size="sm" className="hidden sm:inline-flex">
            <Link href="/login">Ingresar</Link>
          </Button>
          <Button asChild size="sm" className={cn(brandButtonClass, 'font-medium')}>
            <Link href="/signup">Registrarme</Link>
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

      {mobileOpen && (
        <div className="border-t border-slate-200 bg-white px-4 py-4 dark:border-slate-800 dark:bg-slate-900 md:hidden">
          <MegaSearchBar variant="compact" className="mb-4" />
          <div className="flex flex-col gap-1">
            <Button variant="ghost" asChild className="justify-start">
              <Link href="/gigs" onClick={() => setMobileOpen(false)}>
                Explorar servicios
              </Link>
            </Button>
            <Button variant="ghost" asChild className="justify-start">
              <Link href="/create-gig" onClick={() => setMobileOpen(false)}>
                Para profesionales
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
    </header>
  );
}