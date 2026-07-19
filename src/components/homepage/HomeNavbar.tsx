'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ModeToggle } from '@/components/ui/mode-toggle';
import { brandButtonClass } from '@/lib/design-tokens';
import { cn } from '@/lib/utils';
import Logo from '@/components/common/Logo';
import { MegaSearchBar } from './MegaSearchBar';

export function HomeNavbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur-md safe-area-inset-top dark:border-slate-800 dark:bg-slate-900/90">
      <nav
        className="mx-auto flex h-14 max-w-7xl items-center gap-2 sm:gap-3 px-3 sm:px-6 min-w-0"
        aria-label="Navegación principal"
      >
        <Logo
          size={36}
          variant="compact"
          linkClassName="shrink-0 text-foreground hover:text-foreground h-9 w-auto"
        />

        <div className="hidden lg:flex flex-1 max-w-md mx-2 min-w-0">
          <MegaSearchBar variant="compact" />
        </div>

        <div className="hidden md:flex items-center gap-1 shrink-0">
          <Button variant="ghost" asChild size="sm" className="text-sm h-9 px-2.5">
            <Link href="/gigs">Explorar</Link>
          </Button>
          <Button variant="ghost" asChild size="sm" className="text-sm h-9 px-2.5">
            <Link href="/para-compradores">Para compradores</Link>
          </Button>
          <Button variant="ghost" asChild size="sm" className="text-sm h-9 px-2.5">
            <Link href="/para-profesionales">Para profesionales</Link>
          </Button>
        </div>

        <div className="ml-auto flex items-center gap-1 sm:gap-1.5 shrink-0">
          <ModeToggle />
          <Button variant="ghost" asChild size="sm" className="hidden sm:inline-flex h-9">
            <Link href="/login">Ingresar</Link>
          </Button>
          <Button asChild size="sm" className={cn(brandButtonClass, 'font-medium h-9 px-3')}>
            <Link href="/signup">Registrarme</Link>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden h-9 w-9"
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
              <Link href="/para-compradores" onClick={() => setMobileOpen(false)}>
                Para compradores
              </Link>
            </Button>
            <Button variant="ghost" asChild className="justify-start">
              <Link href="/para-profesionales" onClick={() => setMobileOpen(false)}>
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