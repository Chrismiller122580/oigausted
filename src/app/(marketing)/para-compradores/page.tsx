import Link from 'next/link';
import { getServerSession } from 'next-auth';
import {
  Bell,
  CreditCard,
  MapPin,
  MessageCircle,
  Package,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  BadgeCheck,
  Lock,
  Shield,
} from 'lucide-react';
import { authOptions } from '@/lib/auth';
import { PublicPageShell } from '@/components/marketing/PublicPageShell';
import {
  BuyerLandingCTA,
  type BuyerLandingUserState,
} from '@/components/marketing/BuyerLandingCTA';
import {
  buildPublicPageMetadata,
  getPublicSiteInfo,
  JOIN_FAQS,
} from '@/lib/public-site';
import { trustBadges } from '@/lib/design-tokens';

export const metadata = buildPublicPageMetadata({
  title: 'Para compradores • Encuentra y contrata servicios en OigaGIG',
  description:
    'Regístrate gratis, busca servicios locales en Colombia, chatea con profesionales y paga de forma segura con Wompi.',
  path: '/para-compradores',
  keywords: [
    'contratar servicios colombia',
    'buscar profesionales oigagig',
    'marketplace servicios locales',
    'freelancer colombia comprar',
    'pagos seguros wompi',
  ],
});

const STEPS = [
  {
    step: '1',
    title: 'Regístrate gratis',
    body: 'Crea tu cuenta como comprador en minutos. Sin costo de registro ni permanencia.',
  },
  {
    step: '2',
    title: 'Explora gigs',
    body: 'Busca por categoría, ciudad, precio o mapa. Encuentra plomeros, limpieza, belleza y más cerca de ti.',
  },
  {
    step: '3',
    title: 'Chatea y compra seguro',
    body: 'Habla con el vendedor en la app, acuerda detalles y paga con Wompi (Nequi, PSE o tarjeta).',
  },
  {
    step: '4',
    title: 'Sigue tu pedido y califica',
    body: 'Rastrea el estado en tiempo real, recibe notificaciones y deja tu reseña al finalizar.',
  },
];

const BENEFITS = [
  { icon: Sparkles, text: 'Registro y exploración gratis' },
  { icon: MapPin, text: 'Miles de servicios locales en Colombia' },
  { icon: Search, text: 'Busca por categoría, precio, distancia y mapa' },
  { icon: Star, text: 'Lee reseñas y calificaciones antes de contratar' },
  { icon: MessageCircle, text: 'Chat directo con el vendedor, sin intermediarios' },
  { icon: CreditCard, text: 'Pagos seguros con Wompi (Nequi, PSE, tarjetas)' },
  { icon: ShieldCheck, text: 'Pago protegido hasta confirmar el servicio' },
  { icon: Package, text: 'Seguimiento de pedidos en tiempo real' },
  { icon: Bell, text: 'Notificaciones de estado e historial de compras' },
];

const trustIcons = {
  star: Star,
  check: BadgeCheck,
  lock: Lock,
  shield: Shield,
} as const;

const MINI_FAQ = JOIN_FAQS.filter(
  (item) =>
    item.category === 'buyer' ||
    item.id === 'free-to-join' ||
    item.id === 'payment-methods',
);

function resolveUserState(role?: string | null): BuyerLandingUserState {
  const r = (role || '').toLowerCase();
  if (r === 'seller') return 'seller';
  if (r === 'admin') return 'admin';
  if (r === 'buyer') return 'buyer';
  return 'guest';
}

function bottomCtaCopy(userState: BuyerLandingUserState, siteName: string) {
  if (userState === 'buyer') {
    return {
      title: '¿Listo para contratar?',
      body: 'Explora gigs, chatea con profesionales y paga de forma segura desde tu cuenta.',
    };
  }
  if (userState === 'seller' || userState === 'admin') {
    return {
      title: '¿Necesitas un servicio?',
      body: `Como vendedor también puedes contratar otros profesionales en ${siteName}.`,
    };
  }
  return {
    title: 'Empieza hoy, es gratis',
    body: 'Crea tu cuenta gratis y encuentra el servicio que necesitas hoy.',
  };
}

export default async function ParaCompradoresPage() {
  const [site, session] = await Promise.all([
    getPublicSiteInfo(),
    getServerSession(authOptions),
  ]);

  const userState = session?.user
    ? resolveUserState(session.user.role)
    : 'guest';

  const bottomCta = bottomCtaCopy(userState, site.siteName);

  return (
    <PublicPageShell
      siteName={site.siteName}
      title="Para compradores"
      subtitle="Encuentra profesionales de confianza en Colombia. Registro gratis, búsqueda fácil y pagos seguros."
    >
      <div className="space-y-12">
        <section>
          <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed text-lg">
            {site.siteName} conecta a personas que necesitan un servicio con profesionales y negocios
            locales de confianza. Ya sea plomería, limpieza, belleza, mudanzas o diseño — aquí puedes
            buscar, comparar reseñas, chatear y comprar con pagos protegidos vía Wompi.
          </p>
          <div className="mt-8">
            <BuyerLandingCTA userState={userState} />
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
          <h2 className="text-2xl font-semibold mb-4">¿Por qué comprar en {site.siteName}?</h2>
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
          <h2 className="text-2xl font-semibold mb-4">Confianza y seguridad</h2>
          <ul className="flex flex-wrap gap-3 list-none m-0 p-0">
            {trustBadges.map((badge) => {
              const Icon = trustIcons[badge.icon];
              return (
                <li
                  key={badge.label}
                  className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300"
                >
                  <Icon className="h-4 w-4 text-orange-600 shrink-0" aria-hidden />
                  {badge.label}
                </li>
              );
            })}
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">Preguntas frecuentes</h2>
          <div className="space-y-4">
            {MINI_FAQ.map((item) => (
              <div key={item.id} className="rounded-xl border border-border p-4">
                <h3 className="font-medium">{item.question}</h3>
                <p className="text-zinc-600 dark:text-zinc-400 mt-2 text-sm leading-relaxed">
                  {item.answer}
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
          <h2 className="text-xl sm:text-2xl font-semibold mb-2">{bottomCta.title}</h2>
          <p className="text-zinc-600 dark:text-zinc-400 mb-6 max-w-lg mx-auto">
            {bottomCta.body}
          </p>
          <BuyerLandingCTA userState={userState} className="justify-center" />
        </section>
      </div>
    </PublicPageShell>
  );
}