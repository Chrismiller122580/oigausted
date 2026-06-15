import Link from 'next/link';
import { Mail, MapPin, MessageCircle } from 'lucide-react';
import { PublicPageShell } from '@/components/marketing/PublicPageShell';
import {
  buildPublicPageMetadata,
  getPublicSiteInfo,
  PUBLIC_SITE_URL,
} from '@/lib/public-site';

export const metadata = buildPublicPageMetadata({
  title: 'Nosotros • Sobre OigaGig',
  description:
    'Conoce OigaGig: el marketplace colombiano que conecta compradores y vendedores locales. Misión, valores y datos de contacto para soporte.',
  path: '/about',
  keywords: [
    'sobre oigagig',
    'quienes somos',
    'contacto oigagig',
    'marketplace colombia',
    'servicios locales',
  ],
});

export default async function AboutPage() {
  const site = await getPublicSiteInfo();

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: site.siteName,
    url: PUBLIC_SITE_URL,
    description: site.siteTagline,
    logo: `${PUBLIC_SITE_URL}/logo.png`,
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer support',
      email: site.supportEmail,
      telephone: site.supportPhone || undefined,
      areaServed: 'CO',
      availableLanguage: ['Spanish'],
    },
  };

  return (
    <PublicPageShell
      siteName={site.siteName}
      title="Nosotros"
      subtitle="Una plataforma hecha en Colombia para conectar a quien necesita un servicio con quien sabe hacerlo bien."
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="prose prose-zinc dark:prose-invert max-w-none">
        <section className="mb-10">
          <h2 className="text-2xl font-semibold mb-3">Nuestra misión</h2>
          <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
            En {site.siteName} creemos que la confianza se construye de persona a persona. Por eso
            creamos un espacio donde colombianos pueden encontrar y ofrecer servicios locales — sin
            intermediarios innecesarios, con pagos seguros y comunicación directa.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="text-2xl font-semibold mb-3">¿Por qué OigaGig?</h2>
          <ul className="space-y-2 text-zinc-600 dark:text-zinc-400 list-disc pl-5">
            <li>
              <strong>Gente real:</strong> perfiles, reseñas y calificaciones verificadas después de
              cada servicio.
            </li>
            <li>
              <strong>Hecho para Colombia:</strong> pagos con Wompi, Nequi, PSE y ciudades de todo
              el país.
            </li>
            <li>
              <strong>Directo y simple:</strong> publica o contrata en minutos, chatea y acuerda sin
              vueltas.
            </li>
            <li>
              <strong>Lanzamiento reciente:</strong> estamos creciendo con los primeros vendedores y
              compradores — ¡únete desde el inicio!
            </li>
          </ul>
        </section>

        <section className="mb-10">
          <h2 className="text-2xl font-semibold mb-3">Para quién es</h2>
          <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
            <strong>Compradores</strong> que buscan limpieza, transporte, diseño, comida, reparaciones
            y cientos de servicios más. <strong>Vendedores</strong> y freelancers que quieren ganar
            plata extra o montar su negocio con visibilidad local.
          </p>
        </section>
      </div>

      <section className="rounded-2xl border border-border bg-card p-6 md:p-8">
        <h2 className="text-2xl font-semibold mb-4">Contacto</h2>
        <p className="text-zinc-600 dark:text-zinc-400 mb-6">
          ¿Tienes preguntas, sugerencias o necesitas ayuda? Estamos para ti.
        </p>

        <ul className="space-y-4">
          <li className="flex items-start gap-3">
            <Mail className="h-5 w-5 text-orange-600 mt-0.5 shrink-0" />
            <div>
              <p className="font-medium">Correo de soporte</p>
              <a
                href={`mailto:${site.supportEmail}`}
                className="text-orange-600 hover:underline"
              >
                {site.supportEmail}
              </a>
            </div>
          </li>

          {site.supportPhone ? (
            <li className="flex items-start gap-3">
              <MessageCircle className="h-5 w-5 text-orange-600 mt-0.5 shrink-0" />
              <div>
                <p className="font-medium">WhatsApp / Teléfono</p>
                <a
                  href={`https://wa.me/${site.supportPhone.replace(/\D/g, '')}`}
                  className="text-orange-600 hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {site.supportPhone}
                </a>
              </div>
            </li>
          ) : null}

          <li className="flex items-start gap-3">
            <MapPin className="h-5 w-5 text-orange-600 mt-0.5 shrink-0" />
            <div>
              <p className="font-medium">Cobertura</p>
              <p className="text-zinc-600 dark:text-zinc-400">
                Bogotá, Medellín, Cali, Bucaramanga y ciudades de todo Colombia 🇨🇴
              </p>
            </div>
          </li>
        </ul>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/faq"
            className="text-sm font-medium text-orange-600 hover:underline"
          >
            Ver preguntas frecuentes →
          </Link>
          <Link
            href="/signup"
            className="text-sm font-medium text-orange-600 hover:underline"
          >
            Crear cuenta →
          </Link>
        </div>
      </section>
    </PublicPageShell>
  );
}