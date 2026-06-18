'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { X, Gift } from 'lucide-react';

const STORAGE_KEY = 'launch-promo-dismissed';

interface LaunchPromoBannerProps {
  sellerCount: number;
  maxSlots?: number;
}

export function LaunchPromoBanner({ sellerCount, maxSlots = 50 }: LaunchPromoBannerProps) {
  const [dismissed, setDismissed] = useState(false);
  const [mounted, setMounted] = useState(false);

  const remaining = Math.max(0, maxSlots - sellerCount);
  const promoActive = remaining > 0;

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    try {
      if (localStorage.getItem(STORAGE_KEY) === '1') {
        setDismissed(true);
      }
    } catch {
      // localStorage unavailable (SSR guards, private mode, etc.)
    }
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    try {
      localStorage.setItem(STORAGE_KEY, '1');
    } catch {
      // non-fatal
    }
  };

  if (!mounted || dismissed || !promoActive) {
    return null;
  }

  return (
    <div className="relative z-20 border-b border-border bg-brand-muted text-foreground shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-center gap-3 text-sm sm:text-base">
        <Gift className="h-4 w-4 text-brand shrink-0" />
        <p className="text-center leading-snug">
          <strong>¡Primeros {maxSlots} vendedores reciben promoción gratis!</strong>{' '}
          <span className="hidden sm:inline">Solo quedan </span>
          <span className="font-bold text-orange-700">{remaining}</span>
          <span className="hidden sm:inline"> cupos</span>
          <span className="sm:hidden"> cupos →</span>
          {' — '}
          <Link
            href="/create-gig"
            className="font-semibold underline underline-offset-2 decoration-orange-700/50 hover:decoration-orange-800 transition-colors"
          >
            Publica tu servicio ahora
          </Link>
          <span className="hidden sm:inline"> →</span>
        </p>
        <button
          type="button"
          onClick={handleDismiss}
          className="shrink-0 rounded-full p-1.5 text-orange-800/70 hover:bg-orange-900/10 hover:text-orange-900 transition-colors"
          aria-label="Cerrar aviso de promoción"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}