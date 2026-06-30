export interface GeneratedCampaign {
  campaignName: string;
  objective: string;
  recommendedSegment: string;
  segmentReason: string;
  email: {
    subject: string;
    previewText?: string;
    body: string;
    cta?: string;
  };
  social: {
    instagram: string;
    facebook: string;
    x: string;
    whatsapp: string;
    general: string;
  };
  adCopies: Array<{ headline: string; body: string; cta: string }>;
  visualPrompts: string[];
  hashtags: string[];
  bestTimes: string;
  strategyNotes: string;
  complianceTips?: string;
}

export function normalizeGeneratedCampaign(
  raw: Record<string, unknown>,
  goal: string,
  variations = 4,
): GeneratedCampaign {
  const fallbackEmail = {
    subject: 'OigaGIG: Encuentra servicios locales de confianza',
    previewText: '',
    body: `Hola,\n\nEn OigaGIG conectamos a personas con profesionales locales de confianza.\n\nExplora ahora: https://oigagig.com/gigs\n\n— El equipo de OigaGIG`,
    cta: 'Explorar servicios',
  };

  const fallbackSocial = {
    instagram: '',
    facebook: '',
    x: '',
    whatsapp: '',
    general: '',
  };

  const rawEmail = raw.email && typeof raw.email === 'object' ? (raw.email as Record<string, unknown>) : null;
  const rawSocial = raw.social && typeof raw.social === 'object' ? (raw.social as Record<string, unknown>) : null;

  const email = {
    subject: String(rawEmail?.subject ?? fallbackEmail.subject),
    previewText: rawEmail?.previewText ? String(rawEmail.previewText) : fallbackEmail.previewText,
    body: String(rawEmail?.body ?? fallbackEmail.body),
    cta: rawEmail?.cta ? String(rawEmail.cta) : fallbackEmail.cta,
  };

  const social = {
    instagram: String(rawSocial?.instagram ?? fallbackSocial.instagram),
    facebook: String(rawSocial?.facebook ?? fallbackSocial.facebook),
    x: String(rawSocial?.x ?? fallbackSocial.x),
    whatsapp: String(rawSocial?.whatsapp ?? fallbackSocial.whatsapp),
    general: String(rawSocial?.general ?? fallbackSocial.general),
  };

  const adCopies = Array.isArray(raw.adCopies)
    ? raw.adCopies
        .filter((item): item is Record<string, unknown> => !!item && typeof item === 'object')
        .slice(0, variations)
        .map((item) => ({
          headline: String(item.headline ?? ''),
          body: String(item.body ?? ''),
          cta: String(item.cta ?? ''),
        }))
        .filter((item) => item.headline || item.body)
    : [];

  const visualPrompts = Array.isArray(raw.visualPrompts)
    ? raw.visualPrompts.map((item) => String(item)).filter(Boolean)
    : [];

  const hashtags = Array.isArray(raw.hashtags)
    ? raw.hashtags.map((item) => String(item)).filter(Boolean)
    : [];

  return {
    campaignName: String(raw.campaignName ?? `Campaña OigaGIG — ${goal.slice(0, 40)}`),
    objective: String(raw.objective ?? goal),
    recommendedSegment: String(raw.recommendedSegment ?? 'usuarios activos'),
    segmentReason: String(raw.segmentReason ?? 'Mayor probabilidad de conversión y engagement.'),
    email,
    social,
    adCopies: adCopies.length > 0
      ? adCopies
      : [{ headline: email.subject, body: email.body, cta: email.cta ?? 'Ver más' }],
    visualPrompts,
    hashtags,
    bestTimes: String(raw.bestTimes ?? 'Martes a jueves entre 9am-11am y 6pm-8pm (hora Colombia).'),
    strategyNotes: String(raw.strategyNotes ?? ''),
    complianceTips: raw.complianceTips ? String(raw.complianceTips) : undefined,
  };
}