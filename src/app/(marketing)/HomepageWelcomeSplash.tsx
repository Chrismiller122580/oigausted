'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { MapPin, MessageCircle, ShieldCheck, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

const STORAGE_KEY = 'homepage-welcome-seen';

const benefits = [
  {
    icon: MapPin,
    title: 'Profesionales locales verificados',
    description: 'Limpieza, transporte, diseño, comida y más en tu ciudad.',
  },
  {
    icon: ShieldCheck,
    title: 'Pagos seguros con Wompi',
    description: 'Nequi, PSE y tarjetas. Sin intermediarios ni sorpresas.',
  },
  {
    icon: MessageCircle,
    title: 'Chat directo y reseñas reales',
    description: 'Habla con el profesional por WhatsApp y contrata con confianza.',
  },
];

export function HomepageWelcomeSplash() {
  const [visible, setVisible] = useState(false);
  const [mounted, setMounted] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  const dismiss = useCallback(() => {
    setVisible(false);
    try {
      localStorage.setItem(STORAGE_KEY, '1');
    } catch {
      // non-fatal
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    try {
      if (localStorage.getItem(STORAGE_KEY) !== '1') {
        setVisible(true);
      }
    } catch {
      setVisible(true);
    }
  }, []);

  useEffect(() => {
    if (!visible) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') dismiss();
    };

    document.addEventListener('keydown', handleKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [visible, dismiss]);

  if (!mounted || !visible) {
    return null;
  }

  const motionProps = prefersReducedMotion
    ? {}
    : {
        initial: { opacity: 0, scale: 0.96, y: 12 },
        animate: { opacity: 1, scale: 1, y: 0 },
        transition: { duration: 0.25, ease: 'easeOut' as const },
      };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 sm:p-6">
      <button
        type="button"
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={dismiss}
        aria-label="Cerrar bienvenida"
      />

      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="homepage-welcome-title"
        className="relative z-10 w-full max-w-lg overflow-hidden rounded-3xl border border-border bg-card shadow-2xl"
        {...motionProps}
      >
        <div className="relative bg-gradient-to-br from-orange-600 to-orange-700 px-6 py-8 text-white">
          <button
            type="button"
            onClick={dismiss}
            className="absolute right-4 top-4 rounded-full p-1.5 text-white/80 transition-colors hover:bg-white/15 hover:text-white"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/15 px-4 py-1.5 text-sm backdrop-blur-md">
            <MapPin className="h-4 w-4" />
            <span>Hecho para Colombia</span>
          </div>

          <h2 id="homepage-welcome-title" className="text-2xl font-bold tracking-tight sm:text-3xl">
            Bienvenido a OigaGig
          </h2>
          <p className="mt-2 max-w-md text-base text-white/90 sm:text-lg">
            El marketplace de servicios locales que conecta colombianos directamente — sin
            intermediarios, con pagos seguros y gente de confianza.
          </p>
        </div>

        <div className="space-y-4 px-6 py-6">
          <ul className="space-y-4">
            {benefits.map((benefit) => {
              const Icon = benefit.icon;
              return (
                <li key={benefit.title} className="flex gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-100 text-orange-600 dark:bg-orange-900/40 dark:text-orange-400">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{benefit.title}</p>
                    <p className="text-sm text-muted-foreground">{benefit.description}</p>
                  </div>
                </li>
              );
            })}
          </ul>

          <div className="flex flex-col gap-3 pt-2">
            <Button
              asChild
              className="h-12 w-full rounded-xl bg-brand text-base font-semibold hover:bg-brand/90"
            >
              <Link href="/signup" onClick={dismiss}>
                Crear cuenta gratis
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="h-12 w-full rounded-2xl text-base font-semibold"
            >
              <Link href="/gigs" onClick={dismiss}>
                Explorar servicios
              </Link>
            </Button>
            <button
              type="button"
              onClick={dismiss}
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Seguir explorando
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}