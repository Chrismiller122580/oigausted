'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ChevronDown, MapPin, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import GigColombiaMap from '@/components/maps/GigColombiaMap';
import type { CityCluster, GigMapPin } from '@/lib/gig-map';
import type { GigColombiaMapHandle } from '@/components/maps/GigColombiaMap';
import { cn } from '@/lib/utils';

type MapaPageClientProps = {
  pins: GigMapPin[];
  clusters: CityCluster[];
  cityCount: number;
};

function shortCityLabel(city: string, max = 32): string {
  const trimmed = city.trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max - 1)}…`;
}

export function MapaPageClient({ pins, clusters, cityCount }: MapaPageClientProps) {
  const mapRef = useRef<GigColombiaMapHandle>(null);
  const [citiesExpanded, setCitiesExpanded] = useState(false);

  return (
    <div className="relative h-[100dvh] w-full overflow-hidden">
      <GigColombiaMap
        ref={mapRef}
        pins={pins}
        clusters={clusters}
        className="absolute inset-0"
      />

      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-start justify-between gap-3 p-3 sm:p-4">
        <Button
          asChild
          variant="secondary"
          size="sm"
          className="pointer-events-auto shadow-md bg-white/95 hover:bg-white dark:bg-slate-900/95"
        >
          <Link href="/">
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Inicio
          </Link>
        </Button>

        {clusters.length > 0 ? (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className={cn(
              'pointer-events-auto shadow-md bg-white/95 hover:bg-white dark:bg-slate-900/95 gap-1.5',
              citiesExpanded && 'ring-2 ring-sky-500/40',
            )}
            onClick={() => setCitiesExpanded((open) => !open)}
            aria-expanded={citiesExpanded}
            aria-controls="mapa-cities-panel"
          >
            <MapPin className="h-4 w-4 shrink-0" aria-hidden />
            <span>Ciudades</span>
            <span className="tabular-nums">{cityCount}</span>
            <ChevronDown
              className={cn('h-4 w-4 shrink-0 transition-transform', citiesExpanded && 'rotate-180')}
              aria-hidden
            />
          </Button>
        ) : null}
      </div>

      {clusters.length > 0 && citiesExpanded ? (
        <aside
          id="mapa-cities-panel"
          className="absolute z-20 top-14 right-3 sm:right-4 w-[min(100%-1.5rem,240px)] rounded-xl border border-slate-200/80 bg-white/95 shadow-xl backdrop-blur-sm dark:border-slate-700/80 dark:bg-slate-900/95 animate-in fade-in slide-in-from-top-2 duration-200"
        >
          <div className="flex items-center justify-between gap-2 border-b border-slate-200/80 px-3 py-2 dark:border-slate-700/80">
            <h2 className="text-xs font-semibold flex items-center gap-1.5 text-muted-foreground uppercase tracking-wide">
              <MapPin className="h-3.5 w-3.5 text-sky-500" aria-hidden />
              Ciudades
            </h2>
            <button
              type="button"
              className="rounded-md p-1 hover:bg-slate-100 dark:hover:bg-slate-800"
              onClick={() => setCitiesExpanded(false)}
              aria-label="Ocultar lista de ciudades"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <ul className="m-0 max-h-[min(36dvh,280px)] list-none space-y-0.5 overflow-y-auto p-1.5">
            {clusters.map((cluster) => (
              <li key={cluster.city}>
                <button
                  type="button"
                  onClick={() => {
                    mapRef.current?.focusCity(cluster.lat, cluster.lng);
                    setCitiesExpanded(false);
                  }}
                  title={cluster.city}
                  className="flex w-full items-center justify-between gap-2 rounded-md px-2.5 py-1.5 text-left text-xs hover:bg-orange-50 dark:hover:bg-orange-950/30 transition-colors"
                >
                  <span className="truncate font-medium min-w-0">
                    {shortCityLabel(cluster.city)}
                  </span>
                  <span className="shrink-0 rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] tabular-nums text-muted-foreground dark:bg-slate-800">
                    {cluster.count}
                  </span>
                </button>
              </li>
            ))}
          </ul>
          <p className="border-t border-slate-200/80 px-3 py-1.5 text-[10px] text-muted-foreground dark:border-slate-700/80">
            {pins.length.toLocaleString('es-CO')} servicios · toca un pin en el mapa
          </p>
        </aside>
      ) : null}
    </div>
  );
}