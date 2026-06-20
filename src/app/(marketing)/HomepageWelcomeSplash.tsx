'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useCallback, useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Search, MessageCircle, ShieldCheck, X, Star, BadgeCheck, Lock, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { brandButtonClass, heroCollageImages, trustBadges } from '@/lib/design-tokens';
import { cn } from '@/lib/utils';

const STORAGE_KEY = 'homepage-welcome-seen';

const steps = [
  {
    icon: Search,
    illustration: '🔍',
    title: 'Busca el servicio',
    description: 'Plomero, limpieza, diseño y más cerca de ti.',
    color: 'from-orange-500 to-amber-400',
  },
  {
    icon: MessageCircle,
    illustration: '💬',
    title: 'Contacta directo',
    description: 'Sin intermediarios ni comisiones ocultas.',
    color: 'from-emerald-500 to-teal-400',
  },
  {
    icon: ShieldCheck,
    illustration: '✅',
    title: 'Paga seguro',
    description: 'Wompi, Nequi, PSE y tarjetas. Con reseñas reales.',
    color: 'from-violet-500 to-purple-400',
  },
] as const;

const trustIcons = {
  star: Star,
  check: BadgeCheck,
  lock: Lock,
  shield: Shield,
} as const;

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
        initial: { opacity: 0, scale: 0.97, y: 16 },
        animate: { opacity: 1, scale: 1, y: 0 },
        transition: { duration: 0.3, ease: 'easeOut' as const },
      };

  return (
    <div className="fixed inset-0 z-[150] flex items-end sm:items-center justify-center p-0 sm:p-6">
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/75 backdrop-blur-md"
        onClick={dismiss}
        aria-label="Cerrar bienvenida"
      />

      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="homepage-welcome-title"
        className="relative z-10 w-full max-w-lg overflow-hidden rounded-t-3xl sm:rounded-3xl border border-slate-200/60 dark:border-slate-700/60 bg-white dark:bg-slate-900 shadow-2xl"
        {...motionProps}
      >
        {/* Hero-style header */}
        <div className="relative overflow-hidden px-6 py-8 text-white">
          <div className="absolute inset-0 grid grid-cols-2 gap-0.5 opacity-35" aria-hidden>
            {heroCollageImages.slice(0, 4).map((src) => (
              <div key={src} className="relative h-full min-h-[88px]">
                <Image src={src} alt="" fill className="object-cover scale-105" sizes="200px" />
              </div>
            ))}
          </div>
          <div
            className="absolute inset-0 bg-gradient-to-br from-slate-900/95 via-orange-950/90 to-slate-900/95"
            aria-hidden
          />

          <button
            type="button"
            onClick={dismiss}
            className="absolute right-4 top-4 z-10 rounded-full border border-white/20 bg-white/10 p-1.5 text-white/90 backdrop-blur-sm transition-colors hover:bg-white/20"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="relative z-10">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-medium backdrop-blur-sm">
              <span>Hecho para Colombia</span>
              <span aria-hidden>🇨🇴</span>
            </div>

            <h2 id="homepage-welcome-title" className="text-2xl font-bold tracking-tight sm:text-3xl leading-tight">
              Bienvenido a{' '}
              <span className="bg-gradient-to-r from-orange-300 to-amber-200 bg-clip-text text-transparent">
                OigaGIG
              </span>
            </h2>
            <p className="mt-3 max-w-md text-sm sm:text-base text-white/85 leading-relaxed">
              El profesional que necesitas, con gente de confianza a un{' '}
              <span className="text-orange-300 font-medium">Oiga</span> de distancia.
            </p>
          </div>
        </div>

        <div className="px-5 py-5 sm:px-6 sm:py-6">
          <ul className="space-y-3">
            {steps.map((step) => {
              const Icon = step.icon;
              return (
                <li
                  key={step.title}
                  className="flex items-center gap-3 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 bg-slate-50/80 dark:bg-slate-800/40 px-3 py-3"
                >
                  <div
                    className={cn(
                      'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br shadow-md',
                      step.color
                    )}
                  >
                    <span className="text-lg" aria-hidden>
                      {step.illustration}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4 text-orange-700 dark:text-orange-300" aria-hidden />
                      <p className="font-semibold text-sm text-foreground">{step.title}</p>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{step.description}</p>
                  </div>
                </li>
              );
            })}
          </ul>

          <ul
            className="mt-4 flex flex-wrap justify-center gap-2 list-none m-0 p-0"
            aria-label="Garantías de confianza"
          >
            {trustBadges.map((badge) => {
              const Icon = trustIcons[badge.icon];
              return (
                <li
                  key={badge.label}
                  className="inline-flex items-center gap-1 rounded-full border border-slate-200/80 dark:border-slate-700/80 bg-white dark:bg-slate-900 px-2.5 py-1 text-[11px] font-medium text-muted-foreground"
                >
                  <Icon className="h-3 w-3 text-[#EAB308]" aria-hidden />
                  {badge.label}
                </li>
              );
            })}
          </ul>

          <div className="mt-5 flex flex-col gap-2.5">
            <Button
              asChild
              className={cn(brandButtonClass, 'h-12 w-full rounded-xl font-semibold shadow-lg')}
            >
              <Link href="/gigs" onClick={dismiss}>
                Buscar servicios
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="h-12 w-full rounded-xl border-2 font-semibold"
            >
              <Link href="/create-gig" onClick={dismiss}>
                Soy profesional • Publica gratis
              </Link>
            </Button>
            <button
              type="button"
              onClick={dismiss}
              className="py-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Seguir explorando
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}