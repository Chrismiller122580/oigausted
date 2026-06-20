'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, MapPin, Loader2, Navigation } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { getCurrentLocation } from '@/lib/distance';
import { brandButtonClass, colombianCities } from '@/lib/design-tokens';

interface MegaSearchBarProps {
  variant?: 'hero' | 'compact';
  defaultCity?: string;
  className?: string;
}

export function MegaSearchBar({
  variant = 'hero',
  defaultCity = 'Bogotá',
  className,
}: MegaSearchBarProps) {
  const router = useRouter();
  const [service, setService] = useState('');
  const [location, setLocation] = useState(defaultCity);
  const [geoLoading, setGeoLoading] = useState(false);

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (service.trim()) params.set('q', service.trim());
    if (location.trim()) params.set('ciudad', location.trim());
    const qs = params.toString();
    router.push(qs ? `/gigs?${qs}` : '/gigs');
  };

  const handleGeolocation = async () => {
    setGeoLoading(true);
    try {
      const coords = await getCurrentLocation();
      localStorage.setItem('userLocation', JSON.stringify(coords));
      setLocation('Cerca de mí');
    } catch {
      setLocation(defaultCity);
    } finally {
      setGeoLoading(false);
    }
  };

  const isHero = variant === 'hero';

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        handleSearch();
      }}
      className={cn(
        'flex w-full gap-2',
        isHero ? 'flex-col sm:flex-row' : 'flex-row items-center',
        className
      )}
      role="search"
      aria-label="Buscar servicios locales"
    >
      <div className={cn('relative flex-1', isHero && 'min-w-0')}>
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none"
          aria-hidden
        />
        <Input
          type="search"
          placeholder={
            isHero
              ? '¿Qué servicio necesitas? ej: plomero, limpieza hoy'
              : 'Buscar servicios…'
          }
          value={service}
          onChange={(e) => setService(e.target.value)}
          className={cn(
            'pl-9 bg-white dark:bg-slate-900 text-foreground border-slate-200 dark:border-slate-700',
            isHero ? 'h-12 text-base rounded-xl' : 'h-9 rounded-lg'
          )}
          aria-label="Servicio que necesitas"
        />
      </div>

      <div className={cn('flex gap-2', isHero ? 'flex-col sm:flex-row sm:flex-1' : 'shrink-0')}>
        <div className="relative flex-1 min-w-[140px]">
          <MapPin
            className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none"
            aria-hidden
          />
          <Input
            list="oigagig-cities"
            placeholder={isHero ? 'En Bogotá o cerca de mí' : 'Ciudad'}
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className={cn(
              'pl-9 pr-10 bg-white dark:bg-slate-900 text-foreground border-slate-200 dark:border-slate-700',
              isHero ? 'h-12 text-base rounded-xl' : 'h-9 rounded-lg w-36'
            )}
            aria-label="Ubicación"
          />
          <datalist id="oigagig-cities">
            {colombianCities.map((c) => (
              <option key={c.id} value={c.label} />
            ))}
          </datalist>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleGeolocation}
            disabled={geoLoading}
            className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 text-orange-700 hover:text-orange-800"
            title="Usar mi ubicación"
            aria-label="Usar mi ubicación"
          >
            {geoLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Navigation className="h-4 w-4" />
            )}
          </Button>
        </div>

        <Button
          type="submit"
          aria-label="Buscar servicios"
          className={cn(
            brandButtonClass,
            'font-semibold shrink-0',
            isHero ? 'h-12 px-8 rounded-xl text-base' : 'h-9 rounded-lg'
          )}
        >
          {isHero ? (
            'Buscar'
          ) : (
            <>
              <Search className="h-4 w-4" aria-hidden />
              <span className="sr-only">Buscar</span>
            </>
          )}
        </Button>
      </div>
    </form>
  );
}