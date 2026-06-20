'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { ArrowRight, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { categoryGradients } from '@/lib/design-tokens';
import { cn } from '@/lib/utils';

export interface HomepageCategory {
  name: string;
  icon: string;
  description?: string;
  proCount: number;
}

interface CategoriesSectionProps {
  categories: HomepageCategory[];
}

export function CategoriesSection({ categories }: CategoriesSectionProps) {
  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 py-14 sm:py-16" aria-labelledby="categories-heading">
      <div className="flex items-end justify-between mb-8 sm:mb-10">
        <div>
          <h2 id="categories-heading" className="text-2xl sm:text-3xl font-bold tracking-tight">
            Categorías populares
          </h2>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">
            Profesionales verificados en tu ciudad
          </p>
        </div>
        <Button variant="ghost" asChild className="hidden sm:inline-flex text-orange-700 hover:text-orange-800">
          <Link href="/gigs">
            Ver todas
            <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
        {categories.map((cat, index) => {
          const gradient = categoryGradients[index % categoryGradients.length];
          const isIconPath = typeof cat.icon === 'string' && cat.icon.startsWith('/');

          return (
            <motion.div
              key={cat.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ delay: Math.min(index * 0.05, 0.4) }}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
            >
              <Link
                href={`/gigs?categoria=${encodeURIComponent(cat.name)}`}
                className="group block h-full"
              >
                <article
                  className={cn(
                    'relative overflow-hidden rounded-2xl border border-slate-200/60 dark:border-slate-700/60',
                    'bg-white dark:bg-slate-900 shadow-sm hover:shadow-xl transition-all duration-300 h-full flex flex-col'
                  )}
                >
                  {/* Colorful header */}
                  <div
                    className={cn(
                      'relative h-24 sm:h-28 bg-gradient-to-br flex items-center justify-center',
                      gradient
                    )}
                  >
                    {isIconPath ? (
                      <div className="relative h-14 w-14 sm:h-16 sm:w-16 rounded-xl overflow-hidden ring-2 ring-white/40 shadow-lg group-hover:scale-110 transition-transform">
                        <Image
                          src={cat.icon}
                          alt=""
                          fill
                          className="object-cover"
                          sizes="64px"
                        />
                      </div>
                    ) : (
                      <span className="text-4xl sm:text-5xl drop-shadow-md group-hover:scale-110 transition-transform">
                        {cat.icon}
                      </span>
                    )}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors" />
                  </div>

                  <div className="p-4 flex flex-col flex-1">
                    <h3 className="font-semibold text-sm sm:text-base leading-snug group-hover:text-orange-800 transition-colors line-clamp-2">
                      {cat.name}
                    </h3>
                    {cat.description && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2 flex-1">
                        {cat.description}
                      </p>
                    )}
                    <div className="mt-3 flex items-center gap-1.5 text-xs font-medium text-[#10B981]">
                      <Users className="h-3.5 w-3.5" aria-hidden />
                      <span>
                        {cat.proCount > 0
                          ? `${cat.proCount.toLocaleString('es-CO')} pros`
                          : 'Disponible ahora'}
                      </span>
                    </div>
                  </div>
                </article>
              </Link>
            </motion.div>
          );
        })}
      </div>

      <div className="mt-6 text-center sm:hidden">
        <Button variant="outline" asChild className="w-full">
          <Link href="/gigs">Ver todas las categorías</Link>
        </Button>
      </div>
    </section>
  );
}