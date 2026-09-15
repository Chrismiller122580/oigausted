import type { GeneratedCampaign } from '@/lib/marketing-campaign-types';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://oigagig.com';

export const SELLER_GIG_INTEREST_PLAYBOOK_ID = 'sellers-gig-interest-tools';
export const BUYER_GIG_INTEREST_PLAYBOOK_ID = 'buyers-gig-interest-tools';

export const SELLER_GIG_INTEREST_CAMPAIGN = {
  id: SELLER_GIG_INTEREST_PLAYBOOK_ID,
  campaignName: 'Herramienta nueva — Me gusta, visitas y compartir en sus gigs',
  objective:
    'Avisar a vendedores que los gigs ahora muestran interés público (me gusta a la idea, visitas y botón de compartir) antes de que alguien compre',
  recommendedSegment: `playbook:${SELLER_GIG_INTEREST_PLAYBOOK_ID}`,
  segmentReason: 'Vendedores con cuenta activa que pueden usar la prueba social de sus gigs.',
  subject: '{{name}}, ya puede ver quién se interesa en su gig — antes de comprar',
  previewText: 'Me gusta a la idea, visitas públicas y un botón para compartir su servicio.',
  body: `Buen día {{name}},

Le presentamos una herramienta nueva en OigaGIG para que su servicio se vea con más confianza antes de que alguien pague.

Qué hay de nuevo en cada gig:
• Me gusta a la idea — las personas pueden indicar que les gusta el servicio sin haberlo contratado todavía. Eso no reemplaza las estrellas después del trabajo.
• Visitas — usted y el público ven cuántas personas abrieron el gig.
• Compartir — un botón para enviar el enlace por WhatsApp, redes o copiarlo.

Cómo usarla esta semana:
1. Entre a ${APP_URL}/seller/gigs y confirme que sus servicios estén activos, con foto, precio y ciudad.
2. Abra su gig público y pulse Compartir. Envíelo a clientes de {{city}} y a su WhatsApp o Instagram.
3. Cuando alguien se interese, verá Ver gig primero y Comprar ahora en la página del servicio — así llega más informado.

👉 Ver mis gigs: {{ctaUrl}}

Si necesita ayuda, escríbanos a support@oigagig.com.

— El equipo de OigaGIG`,
  cta: 'Ver mis gigs',
  ctaUrl: `${APP_URL}/seller/gigs`,
} as const;

export const BUYER_GIG_INTEREST_CAMPAIGN = {
  id: BUYER_GIG_INTEREST_PLAYBOOK_ID,
  campaignName: 'Herramienta nueva — Ver el gig, me gusta y comprar con calma',
  objective:
    'Avisar a compradores que pueden ver el detalle del servicio, marcar me gusta a la idea y compartir, y comprar solo cuando estén listos',
  recommendedSegment: `playbook:${BUYER_GIG_INTEREST_PLAYBOOK_ID}`,
  segmentReason: 'Compradores activos que exploran gigs en Colombia.',
  subject: 'Ahora puede ver el gig primero y comprar cuando esté listo',
  previewText: 'Me gusta a la idea, visitas y Compartir — sin presión de comprar desde el listado.',
  body: `Buen día {{name}},

En OigaGIG mejoramos la forma de explorar servicios en {{city}} y en el resto del país.

Qué cambió:
• En el listado el botón principal es Ver gig — entra al detalle, lee la descripción y después decide si compra.
• Puede dar me gusta a la idea de un servicio aunque todavía no lo contrate. Las estrellas del vendedor siguen siendo las reseñas después del trabajo.
• Ve cuántas personas ya miraron ese gig y puede compartirlo con un familiar o un vecino.

Empiece aquí: ${APP_URL}/gigs

👉 Explorar servicios: {{ctaUrl}}

— El equipo de OigaGIG`,
  cta: 'Explorar servicios',
  ctaUrl: `${APP_URL}/gigs`,
} as const;

export function sellerGigInterestLifecycleCopy(): { subject: string; message: string } {
  return {
    subject: SELLER_GIG_INTEREST_CAMPAIGN.subject,
    message: SELLER_GIG_INTEREST_CAMPAIGN.body,
  };
}

export function buyerGigInterestLifecycleCopy(): { subject: string; message: string } {
  return {
    subject: BUYER_GIG_INTEREST_CAMPAIGN.subject,
    message: BUYER_GIG_INTEREST_CAMPAIGN.body,
  };
}

export function sellerGigInterestAsGeneratedCampaign(): GeneratedCampaign {
  const c = SELLER_GIG_INTEREST_CAMPAIGN;
  return {
    campaignName: c.campaignName,
    objective: c.objective,
    recommendedSegment: c.recommendedSegment,
    segmentReason: c.segmentReason,
    email: {
      subject: c.subject,
      previewText: c.previewText,
      body: c.body,
      cta: c.cta,
    },
    social: {
      instagram: `Nueva en OigaGIG \ud83d\udc40\n\nSus gigs ahora muestran:\n\u2764\ufe0f Me gusta a la idea (antes de contratar)\n\ud83d\udc41\ufe0f Cu\u00e1ntas personas lo vieron\n\ud83d\udce4 Bot\u00f3n para compartir\n\nEl listado dice Ver gig. Comprar queda en la p\u00e1gina del servicio.\n\nActive sus gigs y comp\u00e1rtalos \ud83d\udc49 ${APP_URL}/seller/gigs\n\n#OigaGIG #ServiciosLocales #Colombia`,
      facebook: `Herramienta nueva para vendedores en OigaGIG:\n\n• Me gusta a la idea del gig, antes de que alguien compre\n• Contador de visitas\n• Bot\u00f3n para compartir el enlace\n\nAs\u00ed el comprador ve el servicio con calma y compra desde la p\u00e1gina del gig.\n\n${APP_URL}/seller/gigs`,
      whatsapp: `Hola {{name}}. En OigaGIG sus gigs ya muestran me gusta, visitas y un bot\u00f3n para compartir. El listado lleva a Ver gig; comprar queda en el detalle. Revise los suyos: {{ctaUrl}}`,
      x: `Gigs en OigaGIG ahora tienen me gusta a la idea, visitas y compartir. Ver gig primero, comprar despu\u00e9s. ${APP_URL}/gigs`,
      general: `OigaGIG: me gusta a la idea, visitas p\u00fablicas y compartir en cada gig. Ver primero, comprar en el detalle. ${APP_URL}/gigs`,
    },
    adCopies: [
      {
        headline: 'Vea qui\u00e9n se interesa en su gig',
        body: 'Me gusta a la idea, visitas y compartir \u2014 antes de que alguien pague.',
        cta: 'Ver mis gigs',
      },
      {
        headline: 'Ver el gig, despu\u00e9s comprar',
        body: 'Explore con calma, marque la idea que le gusta y contrate cuando est\u00e9 listo.',
        cta: 'Explorar servicios',
      },
    ],
    visualPrompts: [
      'Colombian service marketplace phone screen showing a gig card with heart, eye and share icons, warm orange brand, Bucaramanga street in soft background',
    ],
    hashtags: ['#OigaGIG', '#ServiciosLocales', '#Colombia', '#EmprendedoresColombia'],
    bestTimes: 'Martes a jueves 9–11am o 6–8pm (hora Colombia).',
    strategyNotes:
      'Un env\u00edo por usuario (in-app + email). No automatizar en el cron diario. Medir clics a /gigs y /seller/gigs.',
    complianceTips:
      'No promete m\u00e1s ventas. Distingue me gusta a la idea de rese\u00f1as despu\u00e9s del servicio. Incluye canal de soporte.',
  };
}
