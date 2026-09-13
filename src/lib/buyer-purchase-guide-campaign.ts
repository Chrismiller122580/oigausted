import type { GeneratedCampaign } from '@/lib/marketing-campaign-types';
import { resolveUserLanguage, type AppLanguage } from '@/lib/preferred-language';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://oigagig.com';

export const BUYER_PURCHASE_GUIDE_CAMPAIGN = {
  id: 'buyers-how-to-purchase',
  campaignName: 'Guía comprador — Cómo contratar un vendedor en OigaGIG',
  objective: 'Enseñar a compradores cómo encontrar un vendedor, chatear y pagar seguro',
  recommendedSegment: 'playbook:buyers-how-to-purchase',
  segmentReason: 'Compradores que necesitan una guía clara de compra dentro de la plataforma.',
  subject: 'Así contratas un vendedor en OigaGIG (paso a paso)',
  previewText: 'Busca, chatea en la app, paga con Wompi y califica. Todo sin salir de OigaGIG.',
  body: `Hola {{name}},

Contratar un profesional en OigaGIG es simple y seguro. El correo del vendedor no se publica: coordina y paga siempre dentro de la app.

1) Encuentra el servicio
• Explora gigs por categoría o ciudad: ${APP_URL}/gigs
• Usa el mapa si buscas alguien cerca: ${APP_URL}/mapa
• Filtra por reseñas y lee el perfil público del vendedor.

2) Habla con el vendedor en OigaGIG
• Abre el chat desde el gig o el perfil. No hace falta pedir su email.
• Acuerda fecha, alcance y precio antes de pagar.
• Si te piden pagar por fuera, no lo hagas — el pago protegido está en la app.

3) Pide y paga seguro
• Pulsa Pedir / Contratar en el servicio.
• Paga con Wompi: Nequi, PSE o tarjeta.
• El dinero queda protegido hasta que el servicio se confirme.

4) Sigue el pedido y califica
• Ve el estado en Mis Pedidos: ${APP_URL}/buyer
• Coordina detalles en el chat del pedido.
• Al terminar, deja una reseña. Ayuda a otros compradores en {{city}}.

Checklist rápido:
☐ Elige un gig con reseñas
☐ Chatea en la app (no por correo)
☐ Paga con Wompi
☐ Califica cuando terminen

¿Dudas? Escríbenos a support@oigagig.com o ${APP_URL}/support.

👉 Explorar vendedores: {{ctaUrl}}

— El equipo de OigaGIG`,
  cta: 'Explorar vendedores',
  ctaUrl: `${APP_URL}/gigs`,
  social: {
    instagram: `🛒 ¿Cómo contratas un vendedor en OigaGIG?

1. Busca el servicio en tu ciudad
2. Chatea en la app (sin pedir emails)
3. Paga seguro con Wompi
4. Califica al terminar

Empieza aquí 👉 ${APP_URL}/gigs

#OigaGIG #ServiciosLocales #Colombia`,
    facebook: `Contratar en OigaGIG es fácil y seguro:

• Busca por categoría, ciudad o mapa
• Habla con el vendedor en el chat de la app
• Paga con Wompi (Nequi, PSE o tarjeta)
• Sigue tu pedido y deja una reseña

No necesitas el correo del vendedor. Todo queda en la plataforma.

${APP_URL}/gigs`,
    whatsapp: `Hola {{name}}! 👋

Así contratas un vendedor en OigaGIG:

1️⃣ Busca en ${APP_URL}/gigs o el mapa
2️⃣ Chatea en la app (no pidas su email)
3️⃣ Paga con Wompi
4️⃣ Sigue el pedido en ${APP_URL}/buyer

¿Listo? {{ctaUrl}}`,
    x: `Cómo comprar en OigaGIG:

Busca → chatea en la app → paga con Wompi → califica.

Sin emails públicos. Todo en la plataforma.

${APP_URL}/gigs`,
    general: `Guía para compradores OigaGIG: busca un servicio, chatea en la app, paga con Wompi y califica. ${APP_URL}/gigs`,
  },
  hashtags: [
    '#OigaGIG',
    '#ServiciosLocales',
    '#CompradoresColombia',
    '#PagosSeguros',
    '#Colombia',
  ],
  bestTimes:
    'Martes a jueves 9–11am o 6–8pm (hora Colombia).',
  strategyNotes:
    '• Email + push + in-app una vez por comprador.\n• CTA a /gigs y /para-compradores.\n• Medir clics a /gigs y primeros pedidos.',
} as const;

export function buyerPurchaseGuideAsGeneratedCampaign(): GeneratedCampaign {
  const c = BUYER_PURCHASE_GUIDE_CAMPAIGN;
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
    social: { ...c.social },
    adCopies: [
      {
        headline: 'Contrata un vendedor en 4 pasos',
        body: 'Busca, chatea en la app, paga con Wompi y califica.',
        cta: 'Explorar vendedores',
      },
      {
        headline: 'Paga seguro, sin pedir emails',
        body: 'Todo el trato queda en OigaGIG con Wompi.',
        cta: 'Ver servicios',
      },
    ],
    visualPrompts: [
      'Colombian buyer on phone hiring a local professional through a marketplace app, warm daylight, trustworthy, orange accents',
    ],
    hashtags: [...c.hashtags],
    bestTimes: c.bestTimes,
    strategyNotes: c.strategyNotes,
    complianceTips: 'Incluye opción de baja. No prometas descuentos inventados.',
  };
}

const BUYER_PURCHASE_GUIDE_EN = {
  subject: 'How to hire a seller on OigaGIG (step by step)',
  previewText: 'Search, chat in the app, pay with Wompi, and leave a review. Stay inside OigaGIG.',
  body: `Hi {{name}},

Hiring a professional on OigaGIG is simple and safe. Seller emails are not public — coordinate and pay inside the app.

1) Find the service
• Browse gigs by category or city: ${APP_URL}/gigs
• Use the map if you want someone nearby: ${APP_URL}/mapa
• Filter by reviews and read the seller’s public profile.

2) Talk with the seller in OigaGIG
• Open chat from the gig or profile. You don’t need their email.
• Agree on date, scope, and price before paying.
• If someone asks you to pay off-platform, don’t — protected payment is in the app.

3) Book and pay safely
• Tap Request / Hire on the service.
• Pay with Wompi: Nequi, PSE, or card.
• Funds stay protected until the service is confirmed.

4) Track the order and review
• Follow status in My Orders: ${APP_URL}/buyer
• Coordinate details in the order chat.
• When it’s done, leave a review. It helps other buyers in {{city}}.

Quick checklist:
☐ Pick a gig with reviews
☐ Chat in the app (not email)
☐ Pay with Wompi
☐ Leave a review when finished

Questions? Write to support@oigagig.com or ${APP_URL}/support.

👉 Browse sellers: {{ctaUrl}}

— The OigaGIG team`,
} as const;

export function buyerPurchaseGuideLifecycleCopy(
  lang: AppLanguage = 'es',
): { subject: string; message: string } {
  if (lang === 'en') {
    return {
      subject: BUYER_PURCHASE_GUIDE_EN.subject,
      message: BUYER_PURCHASE_GUIDE_EN.body,
    };
  }
  return {
    subject: BUYER_PURCHASE_GUIDE_CAMPAIGN.subject,
    message: BUYER_PURCHASE_GUIDE_CAMPAIGN.body,
  };
}

export function buyerPurchaseGuideLifecycleCopyForUser(user: {
  preferredLanguage?: string | null;
  countryCode?: string | null;
  city?: string | null;
}): { subject: string; message: string; language: AppLanguage } {
  const language = resolveUserLanguage(user);
  return { ...buyerPurchaseGuideLifecycleCopy(language), language };
}
