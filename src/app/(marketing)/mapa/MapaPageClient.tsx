'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, MapPin, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import GigColombiaMap from '@/components/maps/GigColombiaMap';
import type { CityCluster, GigMapPin } from '@/lib/gig-map';
import type { GigColombiaMapHandle } from '@/components/maps/GigColombiaMap';

type MapaPageClientProps = {
  pins: GigMapPin[];
  clusters: CityCluster[];
  cityCount: number;
};

export function MapaPageClient({ pins, clusters, cityCount }: MapaPageClientProps) {
  const mapRef = useRef<GigColombiaMapHandle>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
            className="pointer-events-auto shadow-md bg-white/95 hover:bg-white dark:bg-slate-900/95 lg:hidden"
            onClick={() => setSidebarOpen((open) => !open)}
          >
            <MapPin className="h-4 w-4" aria-hidden />
            {cityCount} ciudades
          </Button>
        ) : null}
      </div>

      {clusters.length > 0 ? (
        <aside
          className={`absolute z-20 top-14 right-3 sm:right-4 w-[min(100%-1.5rem,260px)] rounded-2xl border border-slate-200/80 bg-white/95 shadow-xl backdrop-blur-sm dark:border-slate-700/80 dark:bg-slate-900/95 transition-transform duration-200 ${
            sidebarOpen ? 'translate-x-0' : 'translate-x-[calc(100%+1rem)] lg:translate-x-0'
          }`}
        >
          <div className="flex items-center justify-between gap-2 border-b border-slate-200/80 px-4 py-3 dark:border-slate-700/80">
            <h2 className="text-sm font-semibold flex items-center gap-2">
              <MapPin className="h-4 w-4 text-sky-500" aria-hidden />
              Ciudades
            </h2>
            <button
              type="button"
              className="lg:hidden rounded-md p-1 hover:bg-slate-100 dark:hover:bg-slate-800"
              onClick={() => setSidebarOpen(false)}
              aria-label="Cerrar lista de ciudades"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <ul className="m-0 max-h-[min(50dvh,360px)] list-none space-y-1 overflow-y-auto p-2">
            {clusters.map((cluster) => (
              <li key={cluster.city}>
                <button
                  type="button"
                  onClick={() => {
                    mapRef.current?.focusCity(cluster.lat, cluster.lng);
                    setSidebarOpen(false);
                  }}
                  className="flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-orange-50 dark:hover:bg-orange-950/30 transition-colors"
                >
                  <span className="truncate font-medium">{cluster.city}</span>
                  <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-xs tabular-nums text-muted-foreground dark:bg-slate-800">
                    {cluster.count}
                  </span>
                </button>
              </li>
            ))}
          </ul>
          <p className="border-t border-slate-200/80 px-4 py-2 text-[11px] text-muted-foreground dark:border-slate-700/80">
            {pins.length.toLocaleString('es-CO')} servicios · acerca y toca un pin
          </p>
        </aside>
      ) : null}
    </div>
  );
}