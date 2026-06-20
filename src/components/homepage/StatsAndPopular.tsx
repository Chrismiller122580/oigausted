'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { TrendingUp, Star, MapPin, Users, ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StarRating } from '@/components/ui/star-rating';
import { useRef } from 'react';
import { cn } from '@/lib/utils';

export interface HomepageStats {
  gigs: number;
  reviews: number;
  cities: number;
  sellers: number;
}

export interface PopularGig {
  id: string;
  title: string;
  price: number;
  category?: string | null;
  imageUrl?: string | null;
  city?: string | null;
  seller?: {
    name?: string | null;
    businessName?: string | null;
    rating?: number | null;
    reviewCount?: number | null;
  } | null;
}

interface StatsAndPopularProps {
  stats: HomepageStats;
  popularGigs: PopularGig[];
}

const statConfig = [
  { key: 'gigs' as const, label: 'Gigs activos', icon: TrendingUp, color: 'text-[#10B981]' },
  { key: 'reviews' as const, label: 'Reseñas reales', icon: Star, color: 'text-[#EAB308]' },
  { key: 'cities' as const, label: 'Ciudades', icon: MapPin, color: 'text-sky-500' },
  { key: 'sellers' as const, label: 'Profesionales', icon: Users, color: 'text-orange-700' },
];

export function StatsAndPopular({ stats, popularGigs }: StatsAndPopularProps) {
  const scrollRef = useRef<HTMLUListElement>(null);

  const scroll = (dir: 'left' | 'right') => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir === 'left' ? -320 : 320, behavior: 'smooth' });
  };

  return (
    <section className="border-y border-slate-200/80 bg-gradient-to-b from-slate-100/50 to-transparent dark:from-slate-900/50 dark:border-slate-800">
      {/* Stats row */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-12 sm:py-14">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6">
          {statConfig.map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.key}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.08 }}
                className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-700/60 p-5 sm:p-6 text-center shadow-sm hover:shadow-md hover:border-orange-200 dark:hover:border-orange-900 transition-all"
              >
                <Icon className={cn('h-7 w-7 mx-auto mb-2', stat.color)} aria-hidden />
                <div className="text-2xl sm:text-3xl font-bold tabular-nums text-foreground">
                  {stats[stat.key].toLocaleString('es-CO')}
                </div>
                <div className="text-xs sm:text-sm text-muted-foreground mt-1 font-medium">
                  {stat.label}
                </div>
              </motion.div>
            );
          })}
        </div>
        <p className="mt-6 text-center text-xs text-muted-foreground tracking-wide uppercase">
          Datos actualizados en tiempo real
        </p>
      </div>

      {/* Populares cerca de ti */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 pb-14 sm:pb-16">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
              Populares cerca de ti
            </h2>
            <p className="text-muted-foreground text-sm mt-0.5">
              Los servicios más contratados esta semana
            </p>
          </div>
          <div className="hidden sm:flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => scroll('left')}
              aria-label="Anterior"
              className="rounded-full"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => scroll('right')}
              aria-label="Siguiente"
              className="rounded-full"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <ul
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0 list-none m-0 p-0"
          aria-label="Servicios populares"
        >
          {popularGigs.length > 0 ? (
            popularGigs.map((gig, index) => (
              <motion.li
                key={gig.id}
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.06 }}
                className="snap-start shrink-0 w-[260px] sm:w-[280px]"
              >
                <Link href={`/gigs/${gig.id}`} className="group block h-full">
                  <article className="rounded-2xl overflow-hidden border border-slate-200/60 dark:border-slate-700/60 bg-white dark:bg-slate-900 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 h-full flex flex-col">
                    <div className="relative h-36 bg-gradient-to-br from-orange-100 to-amber-50 dark:from-orange-950 dark:to-slate-800">
                      {gig.imageUrl ? (
                        <Image
                          src={gig.imageUrl}
                          alt=""
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                          sizes="280px"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-4xl opacity-40">
                          🛠️
                        </div>
                      )}
                      {gig.category && (
                        <span className="absolute top-2 left-2 rounded-full bg-black/50 backdrop-blur-sm px-2 py-0.5 text-[10px] font-medium text-white">
                          {gig.category}
                        </span>
                      )}
                    </div>
                    <div className="p-4 flex flex-col flex-1">
                      <h3 className="font-semibold text-sm line-clamp-2 group-hover:text-orange-700 transition-colors">
                        {gig.title}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        {gig.seller?.businessName || gig.seller?.name || 'Profesional'}
                        {gig.city ? ` • ${gig.city}` : ''}
                      </p>
                      {gig.seller?.rating ? (
                        <div className="mt-2">
                          <StarRating
                            rating={gig.seller.rating}
                            size="sm"
                            showValue
                            reviewCount={gig.seller.reviewCount ?? undefined}
                          />
                        </div>
                      ) : null}
                      <div className="mt-auto pt-3 flex items-center justify-between">
                        <span className="font-bold text-orange-700">
                          ${gig.price.toLocaleString('es-CO')}
                        </span>
                        <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-orange-800 transition-colors" />
                      </div>
                    </div>
                  </article>
                </Link>
              </motion.li>
            ))
          ) : (
            <li className="w-full py-12 text-center text-muted-foreground text-sm">
              Pronto habrá servicios populares en tu zona.{' '}
              <Link href="/gigs" className="text-orange-700 hover:text-orange-800 hover:underline">
                Explorar todos
              </Link>
            </li>
          )}
        </ul>
      </div>
    </section>
  );
}