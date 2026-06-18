'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { StarRating } from '@/components/ui/star-rating';

/* Client-only animated pieces for the Oiga GiG 1.0 facelift landing.
   These use framer-motion for entrance staggers and hover lifts.
   They receive server-fetched data as props from the Server Component page.
*/

interface LandingCategory {
  name: string
  icon: string
  description?: string
  avgRating?: number | null
  reviewCount?: number
}

export function AnimatedCategoryGrid({ popularCategories }: { popularCategories: LandingCategory[] }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
      {popularCategories.map((cat, index) => {
        const ic = cat.icon;
        const isIconPath = typeof ic === 'string' && ic.startsWith('/');
        return (
          <motion.div
            key={cat.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(index * 0.035, 0.4) }}
            whileHover={{ y: -2 }}
          >
            <Link
              href={`/gigs?categoria=${encodeURIComponent(cat.name)}`}
              className="group category-card"
            >
              <div className="category-icon-wrap mb-4 transition-transform group-hover:scale-110">
                {isIconPath ? (
                  <img
                    src={ic}
                    alt=""
                    className="h-12 w-12 object-contain p-1"
                    loading="lazy"
                  />
                ) : (
                  <span className="text-5xl">{ic}</span>
                )}
              </div>
              <h3 className="font-semibold text-lg text-zinc-900 dark:text-white group-hover:text-orange-600">
                {cat.name}
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 line-clamp-2 flex-1">
                {cat.description}
              </p>

              {cat.avgRating ? (
                <div className="mt-3">
                  <StarRating rating={cat.avgRating} size="sm" showValue reviewCount={cat.reviewCount} />
                </div>
              ) : (
                <div className="mt-3 text-xs text-zinc-400">Disponible ahora</div>
              )}
            </Link>
          </motion.div>
        );
      })}
    </div>
  );
}

interface LandingTestimonial {
  quote: string
  name: string
  role?: string
  city?: string
}

export function AnimatedTestimonials({ testimonials }: { testimonials: LandingTestimonial[] }) {
  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
      {testimonials.map((t, i) => (
        <motion.div
          key={i}
          whileHover={{ y: -3 }}
          className="testimonial-card"
        >
          <div className="mb-3">
            <StarRating rating={5} size="sm" />
          </div>
          <p className="text-sm text-zinc-700 dark:text-zinc-300 flex-1 leading-relaxed">“{t.quote}”</p>
          <div className="mt-5 pt-4 border-t text-xs">
            <div className="font-semibold text-zinc-900 dark:text-white">{t.name}</div>
            <div className="text-muted-foreground">{t.role} • {t.city}</div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
