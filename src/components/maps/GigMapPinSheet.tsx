'use client';

import Link from 'next/link';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { GigMapPin } from '@/lib/gig-map';

type GigMapPinSheetProps = {
  pin: GigMapPin | null;
  sellerName?: string | null;
  distanceKm?: number;
  inProject?: boolean;
  onClose: () => void;
  onAddToProject?: () => void;
};

export function GigMapPinSheet({
  pin,
  sellerName,
  distanceKm,
  inProject,
  onClose,
  onAddToProject,
}: GigMapPinSheetProps) {
  if (!pin) return null;

  return (
    <>
      <button
        type="button"
        className="fixed inset-0 z-40 bg-black/40"
        aria-label="Cerrar"
        onClick={onClose}
      />
      <div className="fixed inset-x-0 bottom-0 z-50 rounded-t-2xl border-t border-border bg-background p-4 pb-6 shadow-2xl sm:mx-auto sm:max-w-md sm:rounded-2xl sm:bottom-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="font-semibold text-base line-clamp-2">{pin.title}</h3>
            <p className="text-sm text-muted-foreground mt-0.5">
              {sellerName || 'Profesional'}
              {pin.city ? ` · ${pin.city}` : ''}
              {distanceKm != null ? ` · ${distanceKm.toFixed(1)} km` : ''}
            </p>
            <p className="text-lg font-bold text-orange-700 mt-2">
              ${pin.price.toLocaleString('es-CO')}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-md p-1 hover:bg-muted"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          {onAddToProject ? (
            <Button
              type="button"
              className="flex-1 bg-orange-600 hover:bg-orange-700"
              disabled={inProject}
              onClick={() => {
                onAddToProject();
                onClose();
              }}
            >
              {inProject ? 'En tu proyecto' : 'Agregar al proyecto'}
            </Button>
          ) : null}
          <Button asChild variant="outline" className="flex-1">
            <Link href={`/gigs/${pin.id}`}>Ver servicio</Link>
          </Button>
        </div>
      </div>
    </>
  );
}