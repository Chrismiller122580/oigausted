import Link from 'next/link';
import Image from 'next/image';
import { Star, BadgeCheck, Lock, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { MegaSearchBar } from './MegaSearchBar';
import { brandButtonClass, heroCollageImages, trustBadges } from '@/lib/design-tokens';

const trustIcons = {
  star: Star,
  check: BadgeCheck,
  lock: Lock,
  shield: Shield,
} as const;

const heroBackgroundImages = heroCollageImages.slice(0, 4);

export function HomeHero() {
  return (
    <section
      className="relative overflow-hidden text-white"
      aria-labelledby="hero-heading"
    >
      {/* Colombian photo collage background — 4 images max for faster LCP */}
      <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 gap-0.5 opacity-40 dark:opacity-30" aria-hidden>
        {heroBackgroundImages.map((src, i) => (
          <div key={src} className="relative overflow-hidden">
            <Image
              src={src}
              alt=""
              fill
              className="object-cover scale-105"
              sizes={i === 0 ? '100vw' : '50vw'}
              priority={i === 0}
              quality={i === 0 ? 75 : 60}
              loading={i === 0 ? 'eager' : 'lazy'}
            />
          </div>
        ))}
      </div>

      {/* Gradient overlays */}
      <div
        className="absolute inset-0 bg-gradient-to-br from-slate-900/95 via-orange-950/85 to-slate-900/90"
        aria-hidden
      />
      <div
        className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_0%,_rgba(0,0,0,0.4)_100%)]"
        aria-hidden
      />

      <div className="relative z-10 mx-auto max-w-5xl px-4 py-16 sm:py-20 md:py-24 text-center">
        <div>
          <h1
            id="hero-heading"
            className="text-3xl sm:text-4xl md:text-5xl lg:text-[3.25rem] font-bold leading-tight tracking-tight mb-4"
          >
            El profesional que necesitas,
            <br />
            <span className="text-orange-200">
              con gente de confianza a un Oiga de distancia
            </span>{' '}
            <span role="img" aria-label="Bandera de Colombia">
              🇨🇴
            </span>
          </h1>

          <p className="text-base sm:text-lg md:text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Bogotá • Medellín • Cali • toda Colombia • Pagos seguros con Wompi
          </p>
        </div>

        <div className="mx-auto max-w-2xl mb-8 rounded-2xl bg-white/10 backdrop-blur-md p-3 sm:p-4 border border-white/20 shadow-2xl">
          <MegaSearchBar variant="hero" />
        </div>

        <div className="flex flex-col sm:flex-row justify-center gap-3 mb-8">
          <Button
            asChild
            size="lg"
            className={cn(
              brandButtonClass,
              'font-semibold h-12 px-8 rounded-xl shadow-lg hover:shadow-xl transition-all',
            )}
          >
            <Link href="/gigs">Buscar servicios</Link>
          </Button>
          <Button
            asChild
            variant="outline"
            size="lg"
            className="h-12 px-8 rounded-xl border-2 border-white/70 bg-transparent text-white hover:bg-white/10 font-semibold"
          >
            <Link href="/create-gig">Soy profesional • Publica gratis</Link>
          </Button>
        </div>

        <ul
          className="flex flex-wrap justify-center gap-4 sm:gap-6 text-sm text-white/90 list-none m-0 p-0"
          aria-label="Garantías de confianza"
        >
          {trustBadges.map((badge) => {
            const Icon = trustIcons[badge.icon];
            return (
              <li
                key={badge.label}
                className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 backdrop-blur-sm border border-white/15"
              >
                <Icon className="h-4 w-4 text-[#EAB308]" aria-hidden />
                <span>{badge.label}</span>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}