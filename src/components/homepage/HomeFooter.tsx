import Link from 'next/link';
import { MapPin, Mail, Heart } from 'lucide-react';

const FOOTER_LINKS = {
  servicios: [
    { href: '/gigs', label: 'Explorar servicios' },
    { href: '/create-gig', label: 'Publicar un gig' },
    { href: '/faq', label: 'Preguntas frecuentes' },
  ],
  empresa: [
    { href: '/about', label: 'Nosotros' },
    { href: '/privacy', label: 'Privacidad' },
    { href: '/terms', label: 'Términos' },
  ],
  cuenta: [
    { href: '/login', label: 'Ingresar' },
    { href: '/signup', label: 'Registrarme gratis' },
    { href: '/support', label: 'Soporte' },
  ],
} as const;

export function HomeFooter({ siteName = 'OigaGIG' }: { siteName?: string }) {
  return (
    <footer className="border-t border-slate-800 bg-slate-900 text-slate-300">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-12 sm:py-14">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-1.5 font-bold text-xl text-white mb-3">
              <span aria-hidden>🧡</span>
              <span className="bg-gradient-to-r from-orange-400 to-amber-400 bg-clip-text text-transparent">
                {siteName}
              </span>
            </div>
            <p className="text-sm leading-relaxed text-slate-400 mb-4">
              Conectando Colombia, un servicio a la vez. Hecho con cariño por y para colombianos.
            </p>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <MapPin className="h-3.5 w-3.5" aria-hidden />
              Bogotá • Medellín • Cali • Toda Colombia
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(FOOTER_LINKS).map(([section, links]) => (
            <nav key={section} aria-label={section}>
              <h3 className="font-semibold text-white text-sm mb-3 capitalize">
                {section === 'servicios' ? 'Servicios' : section === 'empresa' ? 'Empresa' : 'Cuenta'}
              </h3>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-slate-400 hover:text-orange-400 transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-10 pt-6 border-t border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-slate-500">
          <span>
            © {new Date().getFullYear()} {siteName}. Todos los derechos reservados.
          </span>
          <span className="flex items-center gap-1.5">
            <Heart className="h-3.5 w-3.5 text-orange-500" aria-hidden />
            Colombia • Pagos con Wompi
            <Mail className="h-3.5 w-3.5 ml-2" aria-hidden />
            <Link href="/support" className="hover:text-orange-400 transition-colors">
              Soporte
            </Link>
          </span>
        </div>
      </div>
    </footer>
  );
}