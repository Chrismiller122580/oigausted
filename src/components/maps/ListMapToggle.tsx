'use client';

import { useEffect, useState } from 'react';
import { LayoutGrid, Map } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ViewMode = 'list' | 'map';

type ListMapToggleProps = {
  storageKey: string;
  value: ViewMode;
  onChange: (mode: ViewMode) => void;
  className?: string;
};

export function ListMapToggle({ storageKey, value, onChange, className }: ListMapToggleProps) {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
    try {
      const saved = sessionStorage.getItem(storageKey);
      if (saved === 'list' || saved === 'map') {
        onChange(saved);
      }
    } catch {
      // ignore
    }
    // Only restore persisted mode once per storageKey
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  const setMode = (mode: ViewMode) => {
    onChange(mode);
    try {
      sessionStorage.setItem(storageKey, mode);
    } catch {
      // ignore
    }
  };

  if (!hydrated) {
    return (
      <div className={cn('inline-flex rounded-lg border border-border p-0.5 bg-muted/40', className)}>
        <span className="px-3 py-1.5 text-sm text-muted-foreground">Lista</span>
      </div>
    );
  }

  return (
    <div
      className={cn('inline-flex rounded-lg border border-border p-0.5 bg-muted/40', className)}
      role="group"
      aria-label="Vista de resultados"
    >
      <button
        type="button"
        onClick={() => setMode('list')}
        className={cn(
          'inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
          value === 'list' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground',
        )}
      >
        <LayoutGrid className="h-4 w-4" aria-hidden />
        Lista
      </button>
      <button
        type="button"
        onClick={() => setMode('map')}
        className={cn(
          'inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
          value === 'map' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground',
        )}
      >
        <Map className="h-4 w-4" aria-hidden />
        Mapa
      </button>
    </div>
  );
}