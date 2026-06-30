import { BRAND_PLATFORM_URL } from './seller-marketing-brand';

export interface SellerGeneratedContent {
  objective: string;
  social: {
    instagram: string;
    whatsapp: string;
  };
  hashtags: string[];
  visualPrompts: string[];
  bestTimes: string;
  postingTips: string;
}

export function normalizeSellerGeneratedContent(
  raw: Record<string, unknown>,
  goal: string,
): SellerGeneratedContent {
  const rawSocial =
    raw.social && typeof raw.social === 'object'
      ? (raw.social as Record<string, unknown>)
      : null;

  const hashtags = Array.isArray(raw.hashtags)
    ? raw.hashtags.map((h) => String(h)).filter(Boolean)
    : ['#OigaGig', '#ServiciosLocales', '#Colombia'];

  const visualPrompts = Array.isArray(raw.visualPrompts)
    ? raw.visualPrompts.map((p) => String(p)).filter(Boolean)
    : [];

  return {
    objective: String(raw.objective ?? goal),
    social: {
      instagram: String(rawSocial?.instagram ?? ''),
      whatsapp: String(rawSocial?.whatsapp ?? ''),
    },
    hashtags,
    visualPrompts,
    bestTimes: String(
      raw.bestTimes ??
        'Martes a jueves entre 9am-11am y 6pm-8pm (hora Colombia).',
    ),
    postingTips: String(
      raw.postingTips ??
        'Publica con la imagen con marca de OigaGig y el enlace a tu tienda.',
    ),
  };
}

export function createSellerFallbackContent(
  goal: string,
  businessName: string,
  storeUrl: string,
  gigTitle?: string,
): SellerGeneratedContent {
  const service = gigTitle || 'mis servicios';
  const base = `${businessName} — ${service} en tu zona. Reserva en ${storeUrl}`;
  return {
    objective: goal,
    social: {
      instagram: `✨ ${base}\n\nConfianza, precios claros y atención local.\n\n${storeUrl}\n${BRAND_PLATFORM_URL}`,
      whatsapp: `Hola 👋 Soy ${businessName}. Te ayudo con ${service}.\n\nReserva aquí: ${storeUrl}\n${BRAND_PLATFORM_URL}`,
    },
    hashtags: ['#OigaGig', '#ServiciosLocales', '#Colombia', '#Emprendedores'],
    visualPrompts: [
      `Professional Colombian local service photo, ${businessName}, warm lighting, include subtle ${BRAND_PLATFORM_URL} branding`,
    ],
    bestTimes: 'Martes a jueves 9-11am y 6-8pm (Colombia).',
    postingTips: 'Adjunta la imagen con marca y tu enlace de tienda en cada publicación.',
  };
}