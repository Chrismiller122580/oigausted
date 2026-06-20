'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Quote } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StarRating } from '@/components/ui/star-rating';

export interface HomepageTestimonial {
  quote: string;
  name: string;
  role?: string;
  city?: string;
}

interface TestimonialsCarouselProps {
  testimonials: HomepageTestimonial[];
}

export function TestimonialsCarousel({ testimonials }: TestimonialsCarouselProps) {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(0);

  const go = useCallback(
    (dir: 1 | -1) => {
      setDirection(dir);
      setCurrent((prev) => {
        const next = prev + dir;
        if (next < 0) return testimonials.length - 1;
        if (next >= testimonials.length) return 0;
        return next;
      });
    },
    [testimonials.length]
  );

  // Auto-advance
  useEffect(() => {
    const timer = setInterval(() => go(1), 6000);
    return () => clearInterval(timer);
  }, [go]);

  const t = testimonials[current];
  if (!t) return null;

  const variants = {
    enter: (d: number) => ({ x: d > 0 ? 80 : -80, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (d: number) => ({ x: d > 0 ? -80 : 80, opacity: 0 }),
  };

  return (
    <section
      className="bg-gradient-to-br from-orange-50/80 to-amber-50/50 dark:from-orange-950/20 dark:to-slate-900/50 py-14 sm:py-16"
      aria-labelledby="testimonials-heading"
      aria-roledescription="carousel"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="text-center mb-8 sm:mb-10">
          <h2 id="testimonials-heading" className="text-2xl sm:text-3xl font-bold tracking-tight">
            Lo que dicen quienes ya confiaron
          </h2>
          <p className="text-muted-foreground mt-2 text-sm sm:text-base">
            Reseñas reales de personas y negocios en Colombia
          </p>
        </div>

        <div className="relative max-w-3xl mx-auto">
          <div className="overflow-hidden rounded-2xl border border-slate-200/60 dark:border-slate-700/60 bg-white dark:bg-slate-900 shadow-lg p-6 sm:p-10 min-h-[220px] flex flex-col justify-center">
            <Quote className="h-8 w-8 text-orange-300 mb-4" aria-hidden />

            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={current}
                custom={direction}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.35, ease: 'easeInOut' }}
              >
                <div className="mb-4">
                  <StarRating rating={5} size="sm" />
                </div>
                <blockquote className="text-base sm:text-lg text-foreground leading-relaxed mb-6">
                  &ldquo;{t.quote}&rdquo;
                </blockquote>
                <footer className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-orange-400 to-amber-400 flex items-center justify-center text-white font-bold text-sm">
                    {t.name.charAt(0)}
                  </div>
                  <div>
                    <cite className="not-italic font-semibold text-sm">{t.name}</cite>
                    <p className="text-xs text-muted-foreground">
                      {t.role}
                      {t.role && t.city ? ' • ' : ''}
                      {t.city}
                    </p>
                  </div>
                </footer>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-4 mt-6">
            <Button
              variant="outline"
              size="icon"
              onClick={() => go(-1)}
              aria-label="Testimonio anterior"
              className="rounded-full"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <div className="flex gap-2" role="tablist" aria-label="Testimonios">
              {testimonials.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  role="tab"
                  aria-selected={i === current}
                  aria-label={`Testimonio ${i + 1}`}
                  onClick={() => {
                    setDirection(i > current ? 1 : -1);
                    setCurrent(i);
                  }}
                  className={`h-2 rounded-full transition-all ${
                    i === current
                      ? 'w-6 bg-orange-800'
                      : 'w-2 bg-slate-300 dark:bg-slate-600 hover:bg-orange-400'
                  }`}
                />
              ))}
            </div>

            <Button
              variant="outline"
              size="icon"
              onClick={() => go(1)}
              aria-label="Siguiente testimonio"
              className="rounded-full"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Desktop grid preview */}
        <div className="hidden lg:grid grid-cols-4 gap-4 mt-10">
          {testimonials.map((item, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Ver testimonio de ${item.name}`}
              aria-pressed={i === current}
              onClick={() => {
                setDirection(i > current ? 1 : -1);
                setCurrent(i);
              }}
              className={`text-left rounded-xl border p-4 transition-all ${
                i === current
                  ? 'border-orange-400 bg-orange-50/50 dark:bg-orange-950/30 shadow-sm'
                  : 'border-slate-200/60 dark:border-slate-700/60 hover:border-orange-200'
              }`}
            >
              <p className="text-xs text-muted-foreground line-clamp-3">&ldquo;{item.quote}&rdquo;</p>
              <p className="text-xs font-semibold mt-2">{item.name}</p>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}