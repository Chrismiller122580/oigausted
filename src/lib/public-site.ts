import type { Metadata } from 'next';
import { getPlatformConfig } from '@/lib/prisma';

export function getSiteUrl(): string {
  const raw =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXTAUTH_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined);
  return raw?.replace(/\/$/, '') || 'https://oigagig.com';
}

export const PUBLIC_SITE_URL = getSiteUrl();

export interface PublicSiteInfo {
  siteName: string;
  siteTagline: string;
  supportEmail: string;
  supportPhone: string | null;
}

export interface JoinFaqItem {
  id: string;
  question: string;
  answer: string;
  category: string;
}

export const JOIN_FAQ_CATEGORIES: Record<string, string> = {
  join: 'Unirse a OigaGig',
  buyer: 'Para compradores',
  seller: 'Para vendedores',
  payments: 'Pagos y seguridad',
  account: 'Cuenta y registro',
  general: 'General',
};

/** Curated FAQs for visitors who want to join (buyers + sellers). */
export const JOIN_FAQS: JoinFaqItem[] = [
  {
    id: 'what-is-oigagig',
    category: 'join',
    question: '¿Qué es OigaGig y cómo funciona?',
    answer:
      'OigaGig es un marketplace colombiano que conecta personas que necesitan un servicio con profesionales locales de confianza. Publicas o buscas gigs (servicios), chateas directo, pagas de forma segura con Wompi (Nequi, PSE, tarjetas) y dejas reseñas reales después del trabajo.',
  },
  {
    id: 'free-to-join',
    category: 'join',
    question: '¿Es gratis unirse a OigaGig?',
    answer:
      'Sí. Crear cuenta y explorar servicios es gratis. Los vendedores pueden publicar gigs sin costo de registro. OigaGig cobra una comisión solo cuando se completa una venta exitosa (configurada de forma transparente en la plataforma).',
  },
  {
    id: 'who-can-join',
    category: 'join',
    question: '¿Quién puede usar OigaGig?',
    answer:
      'Cualquier persona en Colombia mayor de edad con documento válido. Puedes registrarte como comprador para contratar servicios, como vendedor para ofrecer los tuyos, o convertirte en vendedor más adelante desde tu perfil.',
  },
  {
    id: 'buyer-how-to-hire',
    category: 'buyer',
    question: '¿Cómo contrato un servicio como comprador?',
    answer:
      '1) Crea tu cuenta gratis. 2) Explora gigs por categoría o ciudad. 3) Revisa perfil, reseñas y precio. 4) Haz tu pedido y chatea con el vendedor para acordar detalles. 5) Paga con Wompi cuando corresponda y califica al finalizar.',
  },
  {
    id: 'buyer-payments-safe',
    category: 'buyer',
    question: '¿Mis pagos están protegidos?',
    answer:
      'Los pagos se procesan a través de Wompi, una pasarela reconocida en Colombia. Recibes comprobante de la transacción y puedes contactar soporte si hay algún problema con tu pedido.',
  },
  {
    id: 'seller-how-to-start',
    category: 'seller',
    question: '¿Cómo empiezo a vender en OigaGig?',
    answer:
      'Regístrate, completa tu perfil (foto, descripción, WhatsApp) y publica tu primer gig en menos de 5 minutos: título, categoría, precio, ciudad y fotos. Los compradores te contactan directo desde la plataforma.',
  },
  {
    id: 'seller-payout',
    category: 'seller',
    question: '¿Cómo recibo mi dinero como vendedor?',
    answer:
      'Configura tus datos bancarios en la sección de ganancias. Cuando completes un pedido, el pago del comprador se registra en la plataforma y los desembolsos se gestionan según el flujo de pagos y retiros de OigaGig (Wompi / transferencias según disponibilidad).',
  },
  {
    id: 'seller-launch-promo',
    category: 'seller',
    question: '¿Hay promoción para los primeros vendedores?',
    answer:
      'Durante el lanzamiento, los primeros 50 vendedores pueden recibir promoción destacada gratis. Publica tu gig pronto para asegurar tu cupo — el contador en la página principal muestra los lugares disponibles.',
  },
  {
    id: 'payment-methods',
    category: 'payments',
    question: '¿Qué métodos de pago aceptan?',
    answer:
      'A través de Wompi puedes pagar con Nequi, PSE, tarjetas débito/crédito y otros métodos habilitados según tu banco. Todo en pesos colombianos (COP).',
  },
  {
    id: 'commission',
    category: 'payments',
    question: '¿Cuánto cobra OigaGig de comisión?',
    answer:
      'OigaGig retiene un porcentaje de comisión sobre ventas completadas para mantener la plataforma, el soporte y los pagos seguros. El porcentaje vigente se muestra de forma transparente antes de publicar o vender.',
  },
  {
    id: 'signup-requirements',
    category: 'account',
    question: '¿Qué necesito para registrarme?',
    answer:
      'Un correo electrónico válido, una contraseña segura y aceptar nuestros Términos y Política de Privacidad. Para vender, te recomendamos completar teléfono/WhatsApp, ciudad y una foto de perfil para generar más confianza.',
  },
  {
    id: 'delete-account',
    category: 'account',
    question: '¿Puedo eliminar o desactivar mi cuenta?',
    answer:
      'Sí. Si tienes pedidos o actividad activa, tu cuenta puede desactivarse en lugar de eliminarse para proteger el historial de compradores y vendedores. Escríbenos a soporte si necesitas ayuda con tu cuenta.',
  },
];

export async function getPublicSiteInfo(): Promise<PublicSiteInfo> {
  try {
    const config = await getPlatformConfig();
    return {
      siteName: config.siteName || 'OigaGig',
      siteTagline:
        config.siteTagline || 'Conecta con profesionales locales en Colombia',
      supportEmail: config.supportEmail || 'support@oigagig.com',
      supportPhone: config.supportPhone?.trim() || null,
    };
  } catch {
    return {
      siteName: 'OigaGig',
      siteTagline: 'Conecta con profesionales locales en Colombia',
      supportEmail: 'support@oigagig.com',
      supportPhone: null,
    };
  }
}

export function buildPublicPageMetadata({
  title,
  description,
  path,
  keywords = [],
}: {
  title: string;
  description: string;
  path: string;
  keywords?: string[];
}): Metadata {
  const canonical = `${PUBLIC_SITE_URL}${path}`;

  return {
    title,
    description,
    keywords,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: 'OigaGig',
      locale: 'es_CO',
      type: 'website',
      images: [
        {
          url: '/logo.png',
          width: 1200,
          height: 630,
          alt: 'OigaGig - Servicios locales en Colombia',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ['/logo.png'],
    },
    robots: { index: true, follow: true },
  };
}

export const PUBLIC_PAGE_PATHS = [
  '/',
  '/gigs',
  '/signup',
  '/login',
  '/faq',
  '/about',
  '/privacy',
  '/terms',
  '/create-gig',
  '/para-profesionales',
] as const;