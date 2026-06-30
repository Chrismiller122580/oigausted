'use client';

import { useRef } from 'react';
import dynamic from 'next/dynamic';
import { MapPin } from 'lucide-react';
import type { CityCluster, GigMapPin } from '@/lib/gig-map';
import type { GigColombiaMapHandle } from '@/components/maps/GigColombiaMap';

const GigColombiaMap = dynamic(() => import('@/components/maps/GigColombiaMap'), {
  ssr: false,
  loading: () => (
    <div className="min-h-[400px] rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-100 animate-pulse" />
  ),
});

type MapaPageClientProps = {
  pins: GigMapPin[];
  clusters: CityCluster[];
  cityCount: number;
};

export function MapaPageClient({ pins, clusters, cityCount }: MapaPageClientProps) {
  const mapRef = useRef<GigColombiaMapHandle>(null);

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_240px]">
      <div>
        <GigColombiaMap ref={mapRef} pins={pins} clusters={clusters} />
        <p className="mt-3 text-xs text-muted-foreground text-center sm:text-left">
          {pins.length.toLocaleString('es-CO')} servicios en {cityCount.toLocaleString('es-CO')} ciudades
          {' · '}
          Haz clic en una ciudad para acercar, luego en un pin para ver el servicio
        </p>
      </div>

      {clusters.length > 0 ? (
        <aside className="rounded-2xl border border-slate-200/80 dark:border-slate-700/80 bg-white dark:bg-slate-900 p-4 h-fit lg:sticky lg:top-24">
          <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <MapPin className="h-4 w-4 text-sky-500" aria-hidden />
            Ciudades
          </h2>
          <ul className="space-y-1 list-none m-0 p-0 max-h-[min(70vh,480px)] overflow-y-auto">
            {clusters.map((cluster) => (
              <li key={cluster.city}>
                <button
                  type="button"
                  onClick={() => mapRef.current?.focusCity(cluster.lat, cluster.lng)}
                  className="w-full flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm text-left hover:bg-orange-50 dark:hover:bg-orange-950/30 transition-colors"
                >
                  <span className="font-medium truncate">{cluster.city}</span>
                  <span className="shrink-0 tabular-nums text-muted-foreground text-xs bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                    {cluster.count}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </aside>
      ) : null}
    </div>
  );
}