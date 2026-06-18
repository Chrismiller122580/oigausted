'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Rocket, TrendingUp, BadgeCheck, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';

const perks = [
  { icon: Zap, text: 'Publica en 2 minutos' },
  { icon: TrendingUp, text: 'Sin comisiones ocultas' },
  { icon: BadgeCheck, text: 'Pagos directos con Wompi' },
];

export function SellerPromoCTA() {
  return (
    <section
      className="mx-auto max-w-7xl px-4 sm:px-6 py-14 sm:py-20"
      aria-labelledby="seller-cta-heading"
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-orange-600 via-orange-500 to-amber-500 p-8 sm:p-12 text-white text-center shadow-2xl"
      >
        {/* Decorative pattern */}
        <div
          className="absolute inset-0 bg-[radial-gradient(#ffffff22_1px,transparent_1px)] [background-size:20px_20px] opacity-60"
          aria-hidden
        />
        <div className="absolute -top-20 -right-20 h-60 w-60 rounded-full bg-white/10 blur-3xl" aria-hidden />
        <div className="absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-yellow-300/20 blur-3xl" aria-hidden />

        <div className="relative z-10 max-w-2xl mx-auto">
          <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-white/20 backdrop-blur-sm mb-6">
            <Rocket className="h-7 w-7" aria-hidden />
          </div>

          <h2 id="seller-cta-heading" className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 leading-tight">
            ¿Eres profesional? Tu próximo cliente está a un Oiga de distancia
          </h2>
          <p className="text-white/90 text-base sm:text-lg mb-8 max-w-xl mx-auto">
            Únete a miles de colombianos que ya ganan dinero ofreciendo sus servicios.
            Registro gratis, sin permanencia.
          </p>

          <div className="flex flex-wrap justify-center gap-4 mb-8">
            {perks.map((perk) => {
              const Icon = perk.icon;
              return (
                <span
                  key={perk.text}
                  className="inline-flex items-center gap-2 rounded-full bg-white/15 backdrop-blur-sm px-4 py-2 text-sm font-medium border border-white/20"
                >
                  <Icon className="h-4 w-4 text-[#EAB308]" aria-hidden />
                  {perk.text}
                </span>
              );
            })}
          </div>

          <div className="flex flex-col sm:flex-row justify-center gap-3">
            <Button
              asChild
              size="lg"
              className="bg-white text-orange-700 hover:bg-white/95 font-semibold h-12 px-8 rounded-xl shadow-lg"
            >
              <Link href="/create-gig">Publicar mi servicio gratis</Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="h-12 px-8 rounded-xl border-2 border-white/60 bg-transparent text-white hover:bg-white/10 font-semibold"
            >
              <Link href="/signup">Crear cuenta de profesional</Link>
            </Button>
          </div>
        </div>
      </motion.div>
    </section>
  );
}