const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://oigagig.com';

export const SELLER_BUYER_TOOLKIT_CAMPAIGN = {
  id: 'sellers-get-buyers-toolkit',
  campaignName: 'Guía vendedor — Cómo conseguir compradores en OigaGIG',
  objective: 'Educar a vendedores sobre todas las herramientas de OigaGIG para atraer y convertir compradores',
  recommendedSegment: 'sellers',
  segmentReason: 'Vendedores activos que pueden usar el toolkit completo de la plataforma para crecer.',
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
} as const;