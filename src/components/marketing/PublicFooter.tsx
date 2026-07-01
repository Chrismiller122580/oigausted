import Link from 'next/link';
import { AppStoreBadges } from '@/components/marketing/AppStoreBadges';
import { BRAND_NAME } from '@/lib/brand';
import { ShareOigaGig } from '@/components/marketing/ShareOigaGig';

const FOOTER_LINKS = [
  { href: '/gigs', label: 'Explorar servicios' },
  { href: '/para-compradores', label: 'Para compradores' },
  { href: '/para-profesionales', label: 'Para profesionales' },
  { href: '/faq', label: 'Preguntas frecuentes' },
  { href: '/about', label: 'Nosotros' },
  { href: '/privacy', label: 'Privacidad' },
  { href: '/terms', label: 'Términos' },
  { href: '/login', label: 'Iniciar sesión' },
  { href: '/signup', label: 'Crear cuenta' },
] as const;

export function PublicFooter({ siteName = BRAND_NAME }: { siteName?: string }) {
  return (
    <footer className="border-t bg-card dark:bg-card py-10 text-sm">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="font-semibold text-zinc-900 dark:text-white mb-1">{siteName}</div>
            <p className="text-zinc-500 leading-relaxed">
              Conectando Colombia, un servicio a la vez. Hecho con cariño por y para colombianos.
            </p>
          </div>

          <nav aria-label="Enlaces públicos" className="grid grid-cols-2 gap-x-4 gap-y-2">
            {FOOTER_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="space-y-5">
            <AppStoreBadges />
            <ShareOigaGig siteName={siteName} />
          </div>

          <div className="text-zinc-500">
            <p className="font-medium text-zinc-700 dark:text-zinc-300 mb-1">Legal</p>
            <p className="leading-relaxed">
              Consulta nuestras{' '}
              <Link href="/privacy" className="text-orange-600 hover:underline">
                políticas de privacidad
              </Link>{' '}
              y{' '}
              <Link href="/terms" className="text-orange-600 hover:underline">
                términos de uso
              </Link>
              . ¿Dudas? Visita{' '}
              <Link href="/faq" className="text-orange-600 hover:underline">
                FAQ
              </Link>{' '}
              o{' '}
              <Link href="/about" className="text-orange-600 hover:underline">
                contáctanos
              </Link>
              .
            </p>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-border text-zinc-500 flex flex-col sm:flex-row justify-between gap-2">
          <span>© {new Date().getFullYear()} {siteName}</span>
          <span>Colombia • Servicios locales • Pagos con Wompi</span>
        </div>
      </div>
    </footer>
  );
}