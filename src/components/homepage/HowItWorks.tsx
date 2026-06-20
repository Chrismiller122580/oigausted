'use client';

import { motion } from 'framer-motion';
import { Search, MessageCircle, ShieldCheck } from 'lucide-react';

const steps = [
  {
    icon: Search,
    step: '01',
    title: 'Busca el servicio',
    description:
      'Escribe lo que necesitas — plomero, limpieza, diseño — y encuentra profesionales cerca de ti en segundos.',
    illustration: '🔍',
    color: 'from-orange-500 to-amber-400',
  },
  {
    icon: MessageCircle,
    step: '02',
    title: 'Contacta directo',
    description:
      'Chatea con el profesional, acuerda precio y detalles sin intermediarios ni comisiones ocultas.',
    illustration: '💬',
    color: 'from-emerald-500 to-teal-400',
  },
  {
    icon: ShieldCheck,
    step: '03',
    title: 'Paga seguro y califica',
    description:
      'Paga con Wompi al finalizar el trabajo. Deja tu reseña real para ayudar a la comunidad.',
    illustration: '✅',
    color: 'from-violet-500 to-purple-400',
  },
] as const;

export function HowItWorks() {
  return (
    <section
      className="mx-auto max-w-7xl px-4 sm:px-6 py-14 sm:py-16"
      aria-labelledby="how-it-works-heading"
    >
      <div className="text-center mb-10 sm:mb-12">
        <h2 id="how-it-works-heading" className="text-2xl sm:text-3xl font-bold tracking-tight">
          Así de fácil es usar OigaGIG
        </h2>
        <p className="text-muted-foreground mt-2 text-sm sm:text-base max-w-lg mx-auto">
          En 3 pasos encuentras o publicas el servicio que necesitas
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {steps.map((item, i) => {
          const Icon = item.icon;
          return (
            <motion.article
              key={item.step}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.12 }}
              whileHover={{ y: -4 }}
              className="relative rounded-2xl border border-slate-200/60 dark:border-slate-700/60 bg-white dark:bg-slate-900 p-6 sm:p-8 text-center shadow-sm hover:shadow-lg transition-shadow"
            >
              {/* Step number */}
              <span className="absolute top-4 right-4 text-xs font-bold text-muted-foreground/50">
                {item.step}
              </span>

              {/* Illustrated icon */}
              <div
                className={`mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br ${item.color} shadow-lg`}
              >
                <span className="text-3xl" aria-hidden>
                  {item.illustration}
                </span>
              </div>

              <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 dark:bg-orange-950/40 text-orange-800 dark:text-orange-300">
                <Icon className="h-5 w-5" aria-hidden />
              </div>

              <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
            </motion.article>
          );
        })}
      </div>
    </section>
  );
}