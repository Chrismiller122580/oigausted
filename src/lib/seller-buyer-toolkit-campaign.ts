import type { GeneratedCampaign } from '@/lib/marketing-campaign-types';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://oigagig.com';

export const SELLER_BUYER_TOOLKIT_CAMPAIGN = {
  id: 'sellers-get-buyers-toolkit',
  campaignName: 'Guía vendedor — Cómo conseguir compradores en OigaGIG',
  objective: 'Educar a vendedores sobre todas las herramientas de OigaGIG para atraer y convertir compradores',
  recommendedSegment: 'playbook:sellers-get-buyers-toolkit',
  segmentReason: 'Vendedores que pueden usar el toolkit completo de la plataforma para crecer.',
  subject: '¿Cómo conseguir más compradores en OigaGIG? Tu guía completa',
  previewText: 'Perfil público, gigs, marketing IA, chat, reseñas y más — todo en un solo lugar.',
  body: `Hola {{name}},

En OigaGIG tienes más que un listado: tienes un kit completo para que compradores en {{city}} y en todo Colombia te encuentren, confíen en ti y te contraten. Aquí va la guía práctica con las herramientas que ya tienes en tu cuenta.

1) Publica y mantén tus servicios visibles
• Crea o actualiza tus gigs en ${APP_URL}/create-gig — título claro, buenas fotos, precio y categoría.
• Revisa que estén activos (no pausados) en ${APP_URL}/seller/gigs. Si están pausados, no aparecen en búsquedas.

2) Tu tienda web personal (clientes directos, sin depender solo del marketplace)
• Configura tu perfil en ${APP_URL}/seller/profile: nombre del negocio, bio, foto y ubicación.
• Comparte tu enlace público y QR desde el panel — ideal para Instagram, WhatsApp y tarjetas.
• Destaca hasta 12 servicios en tu vitrina para que los compradores vean lo mejor primero.

3) Estudio de Marketing con IA
• En ${APP_URL}/seller/marketing genera posts para Instagram y WhatsApp con tu marca y enlace a tu tienda.
• Descarga creativos listos para publicar (feed y stories) con QR y URL de tu perfil.

4) Aparece en búsquedas locales
• Agrega tu ciudad y radio de atención en tu perfil y en cada gig.
• Los compradores te encuentran en ${APP_URL}/gigs y en el mapa ${APP_URL}/mapa cuando buscan cerca.

5) Convierte consultas en pedidos
• Responde rápido en ${APP_URL}/messages cuando un comprador te escribe antes de comprar.
• Después del pago, coordina por el chat del pedido — la buena atención genera reseñas y repetición.

6) Construye confianza con reseñas
• Pide amablemente una reseña al terminar cada trabajo bien hecho.
• Tu calificación aparece en tu perfil público y en cada gig — es tu mejor publicidad.

7) Crece con la comunidad OigaGIG
• Red de Vendedores (${APP_URL}/seller/network): arma proyectos grandes con otros profesionales.
• Referidos (${APP_URL}/referrals): invita colegas y gana comisión cuando vendan en la plataforma.

Checklist de esta semana (15 minutos):
☐ Al menos 1 gig activo con foto
☐ Perfil completo + enlace público copiado
☐ 1 post generado en Marketing IA
☐ Revisar mensajes pendientes

¿Necesitas ayuda? Escríbenos a support@oigagig.com o visita ${APP_URL}/support.

👉 Ir a mi panel de vendedor: {{ctaUrl}}

— El equipo de OigaGIG`,
  cta: 'Ir a mi panel de vendedor',
  ctaUrl: `${APP_URL}/seller`,
  social: {
    instagram: `🔧 ¿Vendes en OigaGIG y quieres MÁS compradores en {{city}}?

Tu kit completo ya está en la plataforma 👇

✅ Gigs activos con buenas fotos
✅ Tu tienda web + QR (ponlo en tu bio)
✅ Marketing IA → posts listos para publicar
✅ Aparece en búsquedas y en el mapa local
✅ Responde rápido en chat = más pedidos
✅ Reseñas = confianza = más clientes

Checklist de 15 min en tu panel 👉 ${APP_URL}/seller

#OigaGIG #ServiciosLocales #EmprendedoresColombia #VendeEnLinea #Colombia`,
    facebook: `¿Eres vendedor en OigaGIG y quieres más compradores?

No necesitas otra app — usa el toolkit que ya tienes:

• Publica y activa tus gigs (${APP_URL}/create-gig)
• Tu perfil público con link y QR para compartir (${APP_URL}/seller/profile)
• Estudio Marketing IA para Instagram y WhatsApp (${APP_URL}/seller/marketing)
• Visibilidad local en búsquedas y mapa (${APP_URL}/mapa)
• Chat con compradores antes y después del pedido (${APP_URL}/messages)
• Reseñas que venden por ti

Empieza hoy: ${APP_URL}/seller`,
    whatsapp: `Hola {{name}}! 👋

Si vendes servicios en OigaGIG, esto te ayuda a conseguir más compradores en {{city}}:

1️⃣ Gigs activos con foto → ${APP_URL}/seller/gigs
2️⃣ Tu link público + QR → ${APP_URL}/seller/profile
3️⃣ Posts con IA para redes → ${APP_URL}/seller/marketing
4️⃣ Responde consultas rápido → ${APP_URL}/messages
5️⃣ Pide reseñas al terminar cada trabajo ⭐

Panel de vendedor: {{ctaUrl}}
¿Dudas? support@oigagig.com`,
    x: `Vendedores en OigaGIG: ¿quieren más compradores?

Gigs activos + perfil público + Marketing IA + chat rápido + reseñas.

Guía completa en tu panel → ${APP_URL}/seller

#OigaGIG #ServiciosLocales`,
    general: `Guía para vendedores OigaGIG: usa gigs activos, perfil público con QR, Marketing IA, mapa local, chat y reseñas para conseguir más compradores. ${APP_URL}/seller`,
  },
  hashtags: [
    '#OigaGIG',
    '#ServiciosLocales',
    '#EmprendedoresColombia',
    '#VendeEnLinea',
    '#FreelanceColombia',
    '#Colombia',
    '#NegociosLocales',
    '#MarketingDigital',
  ],
  bestTimes:
    'Martes a jueves 9–11am o 6–8pm (hora Colombia). Para Instagram: publicar feed martes/jueves; stories cualquier día en horario pico local.',
  strategyNotes:
    '• Email educativo una vez por vendedor (cron diario, 75/día hasta cubrir base).\n• Instagram: carrusel con checklist de 7 herramientas.\n• WhatsApp: reenviar a contactos o status con link al panel.\n• Medir: clics a /seller, /seller/marketing, /seller/profile.',
} as const;

/** Shape for admin marketing studio tabs (email + social). */
export function sellerToolkitAsGeneratedCampaign(): GeneratedCampaign {
  const c = SELLER_BUYER_TOOLKIT_CAMPAIGN;
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
        headline: 'Más compradores con las herramientas que ya tienes',
        body: 'Gigs, perfil público, Marketing IA, chat y reseñas — todo en OigaGIG.',
        cta: 'Ir a mi panel',
      },
      {
        headline: 'Tu negocio local merece más visibilidad',
        body: 'Activa tus gigs, comparte tu QR y publica con IA esta semana.',
        cta: 'Empezar ahora',
      },
    ],
    visualPrompts: [
      'Friendly Colombian service professional checking phone with OigaGIG seller dashboard, warm natural light, modern local business vibe, trustworthy',
      'Instagram carousel mockup showing 7 steps for sellers to get buyers, orange brand colors, Colombian city background',
    ],
    hashtags: [...c.hashtags],
    bestTimes: c.bestTimes,
    strategyNotes: c.strategyNotes,
    complianceTips: 'Incluye opción de baja en emails. No prometas resultados garantizados — enfócate en herramientas reales de la plataforma.',
  };
}

/** Lifecycle / broadcast email copy (subject + body). */
export function sellerToolkitLifecycleCopy(): { subject: string; message: string } {
  return {
    subject: SELLER_BUYER_TOOLKIT_CAMPAIGN.subject,
    message: SELLER_BUYER_TOOLKIT_CAMPAIGN.body,
  };
}