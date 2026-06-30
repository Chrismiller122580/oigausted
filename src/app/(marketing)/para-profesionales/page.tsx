import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { BadgeCheck, CreditCard, Rocket, Star, Users } from 'lucide-react';
import { authOptions } from '@/lib/auth';
import { PublicPageShell } from '@/components/marketing/PublicPageShell';
import {
  SellerLandingCTA,
  type SellerLandingUserState,
} from '@/components/marketing/SellerLandingCTA';
import {
  buildPublicPageMetadata,
  getPublicSiteInfo,
} from '@/lib/public-site';

export const metadata = buildPublicPageMetadata({
  title: 'Para profesionales • Vende tus servicios en OigaGig',
  description:
    '¿Eres profesional o freelancer en Colombia? Aprende cómo funciona OigaGig: regístrate gratis, publica tu servicio y recibe pedidos con pagos seguros vía Wompi.',
  path: '/para-profesionales',
  keywords: [
    'vender servicios colombia',
    'publicar gig oigagig',
    'freelancer colombia',
    'marketplace servicios locales',
    'ganar dinero servicios',
  ],
});

const STEPS = [
  {
    step: '1',
    title: 'Regístrate gratis',
    body: 'Crea tu cuenta como vendedor en minutos. Sin costo de entrada ni permanencia.',
  },
  {
    step: '2',
    title: 'Publica tu servicio',
    body: 'Describe lo que ofreces, pon tu precio, sube fotos y elige tu ciudad o zona de cobertura.',
  },
  {
    step: '3',
    title: 'Recibe pedidos y cobra',
    body: 'Los compradores te contactan, pagan de forma segura con Wompi y tú entregas el servicio.',
  },
];

const BENEFITS = [
  { icon: Rocket, text: 'Publica en menos de 5 minutos' },
  { icon: CreditCard, text: 'Pagos seguros con Wompi, Nequi y PSE' },
  { icon: Star, text: 'Reseñas que generan confianza' },
  { icon: Users, text: 'Visibilidad en tu ciudad y categoría' },
  { icon: BadgeCheck, text: 'Sin intermediarios innecesarios' },
];

const MINI_FAQ = [
  {
    q: '¿Cuánto cuesta registrarse?',
    a: 'Nada. Crear tu cuenta y publicar tu primer servicio es gratis.',
  },
  {
    q: '¿Necesito experiencia previa en plataformas?',
    a: 'No. Te guiamos paso a paso desde el registro hasta tu primer pedido.',
  },
  {
    q: '¿Cómo recibo el dinero?',
    a: 'Configuras tus datos de pago en tu perfil. Cuando completas un pedido, el pago se procesa según las reglas de la plataforma.',
  },
  {
    q: '¿Puedo ofrecer cualquier servicio?',
    a: 'Sí, siempre que sea legal y encaje en las categorías de OigaGig (plomería, belleza, limpieza, mudanzas y más).',
  },
];

function resolveUserState(role?: string | null): SellerLandingUserState {
  const r = (role || '').toLowerCase();
  if (r === 'seller') return 'seller';
  if (r === 'admin') return 'admin';
  if (r === 'buyer') return 'buyer';
  return 'guest';
}

export default async function ParaProfesionalesPage() {
  const [site, session] = await Promise.all([
    getPublicSiteInfo(),
    getServerSession(authOptions),
  ]);

  const userState = session?.user
    ? resolveUserState(session.user.role)
    : 'guest';

  return (
    <PublicPageShell
      siteName={site.siteName}
      title="Para profesionales"
      subtitle="Ofrece tus servicios locales en Colombia. Registro gratis, clientes reales y pagos seguros."
    >
      <div className="space-y-12">
        <section>
          <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed text-lg">
            {site.siteName} conecta a personas que necesitan un servicio con profesionales y negocios
            locales de confianza. Si sabes hacer algo bien — plomería, electricidad, belleza, limpieza,
            fotografía o cualquier oficio — aquí puedes publicar tu servicio y empezar a recibir pedidos.
          </p>
          <div className="mt-8">
            <SellerLandingCTA userState={userState} />
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-6">Cómo funciona</h2>
          <ol className="space-y-6">
            {STEPS.map((item) => (
              <li key={item.step} className="flex gap-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-950/50 text-orange-700 dark:text-orange-300 font-bold">
                  {item.step}
                </span>
                <div>
                  <h3 className="font-semibold text-lg">{item.title}</h3>
                  <p className="text-zinc-600 dark:text-zinc-400 mt-1">{item.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">¿Por qué vender en {site.siteName}?</h2>
          <ul className="grid gap-3 sm:grid-cols-2">
            {BENEFITS.map((b) => {
              const Icon = b.icon;
              return (
                <li
                  key={b.text}
                  className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3"
                >
                  <Icon className="h-5 w-5 text-orange-600 shrink-0" aria-hidden />
                  <span className="text-zinc-700 dark:text-zinc-300">{b.text}</span>
                </li>
              );
            })}
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">Preguntas frecuentes</h2>
          <div className="space-y-4">
            {MINI_FAQ.map((item) => (
              <div key={item.q} className="rounded-xl border border-border p-4">
                <h3 className="font-medium">{item.q}</h3>
                <p className="text-zinc-600 dark:text-zinc-400 mt-2 text-sm leading-relaxed">
                  {item.a}
                </p>
              </div>
            ))}
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            Más respuestas en{' '}
            <Link href="/faq" className="text-orange-600 hover:underline font-medium">
              preguntas frecuentes
            </Link>
            .
          </p>
        </section>

        <section className="rounded-2xl border border-orange-200 bg-orange-50 dark:bg-orange-950/30 dark:border-orange-900/50 p-6 sm:p-8 text-center">
          <h2 className="text-xl sm:text-2xl font-semibold mb-2">
            {userState === 'seller' || userState === 'admin'
              ? '¿Listo para publicar?'
              : userState === 'buyer'
                ? 'Activa tu perfil de vendedor'
                : 'Empieza hoy, es gratis'}
          </h2>
          <p className="text-zinc-600 dark:text-zinc-400 mb-6 max-w-lg mx-auto">
            {userState === 'guest'
              ? 'Miles de colombianos buscan servicios locales cada día. Tu próximo cliente puede estar a un Oiga de distancia.'
              : userState === 'buyer'
                ? 'Ya tienes cuenta. Completa tu perfil de negocio para empezar a publicar servicios.'
                : 'Publica tu servicio y empieza a recibir pedidos desde tu panel de vendedor.'}
          </p>
          <SellerLandingCTA userState={userState} className="justify-center" />
        </section>
      </div>
    </PublicPageShell>
  );
}