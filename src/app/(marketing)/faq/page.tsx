import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { PublicPageShell } from '@/components/marketing/PublicPageShell';
import { FaqAccordion } from '@/components/marketing/FaqAccordion';
import {
  JOIN_FAQS,
  buildPublicPageMetadata,
  getPublicSiteInfo,
} from '@/lib/public-site';

export const metadata = buildPublicPageMetadata({
  title: 'Preguntas frecuentes • Unirse a OigaGig',
  description:
    'FAQ para compradores y vendedores en Colombia: cómo funciona OigaGig, registro gratis, pagos con Wompi, comisiones, promoción de lanzamiento y más.',
  path: '/faq',
  keywords: [
    'faq oigagig',
    'cómo funciona oigagig',
    'unirse oigagig',
    'vender servicios colombia',
    'comprar servicios locales',
    'wompi nequi',
  ],
});

export default async function FaqPage() {
  const site = await getPublicSiteInfo();

  let dynamicFaqs: { id: string; question: string; answer: string; category: string | null }[] =
    [];
  try {
    dynamicFaqs = await prisma.faqItem.findMany({
      where: { isActive: true },
      orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
      select: { id: true, question: true, answer: true, category: true },
    });
  } catch {
    // non-fatal
  }

  const staticIds = new Set(JOIN_FAQS.map((f) => f.question.trim().toLowerCase()));
  const extraFaqs = dynamicFaqs.filter(
    (f) => !staticIds.has(f.question.trim().toLowerCase())
  );

  const allFaqs = [
    ...JOIN_FAQS,
    ...extraFaqs.map((f) => ({
      id: f.id,
      question: f.question,
      answer: f.answer,
      category: f.category || 'general',
    })),
  ];

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: allFaqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };

  return (
    <PublicPageShell
      siteName={site.siteName}
      title="Preguntas frecuentes"
      subtitle="Todo lo que necesitas saber antes de unirte a OigaGig como comprador o vendedor."
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <FaqAccordion items={allFaqs} />

      <div className="mt-12 rounded-2xl border border-orange-200 bg-orange-50 dark:bg-orange-950/30 dark:border-orange-900/50 p-6">
        <h2 className="text-xl font-semibold mb-2">¿Listo para empezar?</h2>
        <p className="text-zinc-600 dark:text-zinc-400 mb-4">
          Crea tu cuenta gratis y explora servicios locales en Colombia, o publica tu primer gig
          hoy mismo.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href="/signup"
            className="inline-flex justify-center rounded-xl bg-orange-600 px-6 py-3 font-semibold text-white hover:bg-orange-700 transition-colors"
          >
            Crear cuenta gratis
          </Link>
          <Link
            href="/create-gig"
            className="inline-flex justify-center rounded-xl border border-orange-300 px-6 py-3 font-semibold text-orange-700 dark:text-orange-300 hover:bg-orange-100/50 dark:hover:bg-orange-900/20 transition-colors"
          >
            Publicar mi servicio
          </Link>
        </div>
        <p className="mt-4 text-sm text-muted-foreground">
          ¿Más ayuda? Escríbenos a{' '}
          <a href={`mailto:${site.supportEmail}`} className="text-orange-600 hover:underline">
            {site.supportEmail}
          </a>{' '}
          o visita{' '}
          <Link href="/about" className="text-orange-600 hover:underline">
            Nosotros
          </Link>
          .
        </p>
      </div>

    </PublicPageShell>
  );
}