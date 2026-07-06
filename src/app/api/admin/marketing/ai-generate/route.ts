import { NextRequest, NextResponse } from 'next/server';
import { requireAdminPanelSession } from '@/lib/admin-auth';
import { devLog } from '@/lib/utils';
import { COLOMBIA_NATIONAL_SCOPE } from '@/lib/colombia-geo';
import { normalizeGeneratedCampaign } from '@/lib/marketing-campaign-types';
import { getPlaybookById } from '@/lib/marketing-playbooks';

interface GenerateRequest {
  goal: string;
  prompt?: string;
  channels: string[];
  segmentHint?: string;
  playbookId?: string;
  tone?: string;
  language?: 'es' | 'en';
  variations?: number;
  targetCity?: string;
  targetScope?: 'national' | 'city';
  buyerFocus?: 'acquisition' | 'retention' | 'both';
}

const GROK_MODEL = "grok-3-mini"; // fast + smart enough for creative marketing

export async function POST(req: NextRequest) {
  const session = await requireAdminPanelSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

  let effectiveGoal = "Promocionar OigaGIG";
  let playbook: ReturnType<typeof getPlaybookById>;
  let channels: string[] = ["email", "instagram", "facebook"];
  let tone = "cercano y confiable";
  let isSpanish = true;
  let variations = 4;
  let targetCity = '';
  let targetScope: 'national' | 'city' = 'national';
  let buyerFocus: 'acquisition' | 'retention' | 'both' = 'both';

  try {
    const body: GenerateRequest = await req.json();
    const {
      goal = "Promocionar OigaGIG",
      prompt = "",
      channels: reqChannels = ["email", "instagram", "facebook"],
      segmentHint = "",
      playbookId = "",
      tone: reqTone = "cercano y confiable",
      language = "es",
      variations: reqVariations = 4,
      targetCity: reqTargetCity = '',
      targetScope: reqTargetScope = 'national',
      buyerFocus: reqBuyerFocus = 'both',
    } = body;

    channels = reqChannels;
    tone = reqTone;
    variations = reqVariations;
    isSpanish = language === "es";
    targetCity = reqTargetCity;
    targetScope = reqTargetScope;
    buyerFocus = reqBuyerFocus;
    playbook = playbookId ? getPlaybookById(playbookId) : undefined;
    effectiveGoal = playbook?.aiGoal || goal;

    const geoLabel = targetScope === 'city' && targetCity
      ? targetCity
      : COLOMBIA_NATIONAL_SCOPE;

    const buyerFocusBlock =
      buyerFocus === 'acquisition'
        ? `ENFOQUE COMPRADORES — ADQUISICIÓN:
- Objetivo: convertir compradores registrados que AÚN NO han pedido.
- recommendedSegment debe mencionar "compradores sin pedidos" o playbook:buyers-no-orders.
- Mensaje educativo: cómo buscar, comparar reseñas, pagar con Wompi.
- CTA principal: explorar /gigs`
        : buyerFocus === 'retention'
          ? `ENFOQUE COMPRADORES — RETENCIÓN:
- Objetivo: compradores que YA compraron — impulsar segunda compra o re-contratación.
- recommendedSegment debe mencionar compradores activos o playbook:buyers-one-order-lapsed.
- Mensaje: servicios recurrentes, confianza, reseñas.
- CTA: buscar nuevo servicio en su ciudad`
          : '';
    const playbookBlock = playbook
      ? `
MODO PLAYBOOK EDUCATIVO (prioridad máxima):
- Playbook: ${playbook.label}
- Audiencia exacta: ${playbook.description}
- Contexto del problema: ${playbook.aiContext}
- CTA obligatorio: "${playbook.defaultCta}" → ${playbook.defaultCtaUrl}
- Estructura del email.body OBLIGATORIA:
  1. Saludo con {{name}} (usar literalmente ese placeholder)
  2. Diagnóstico ("notamos que…" / "vimos que…")
  3. Por qué importa (1-2 frases)
  4. Tres pasos numerados y concretos
  5. CTA con URL {{ctaUrl}} (usar literalmente ese placeholder)
- Tono: maestro amable que enseña, NO vendedor agresivo
- PROHIBIDO inventar descuentos, promociones o urgencia falsa
- recommendedSegment debe ser exactamente: "${playbook.segment}"
`
      : '';

    const apiKey = process.env.GROK_API_KEY || process.env.XAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Grok API key not configured" }, { status: 500 });
    }

    const systemPrompt = `Eres el director creativo de marketing más inteligente y efectivo de Colombia para OigaGIG (oigagig.com).

OigaGIG es la plataforma colombiana de gigs y servicios locales a nivel nacional: conecta compradores con freelancers y negocios locales confiables en todo Colombia (Bogotá, Medellín, Cali, Bucaramanga, Barranquilla, Cartagena y decenas de ciudades más).

Alcance geográfico de esta campaña: ${geoLabel}.
${targetScope === 'city' && targetCity ? `Personaliza el copy para ${targetCity} (menciona la ciudad, servicios locales, confianza regional).` : 'Escribe para alcance nacional en Colombia — no limites el mensaje a una sola ciudad.'}

Tus fortalezas:
- Escribes copy publicitario de alto rendimiento en español natural colombiano (profesional pero cercano, usa "vos", "parce", evita anglicismos innecesarios).
- Entiendes marketing de servicios locales: confianza, rapidez, precio justo, reseñas reales, cercanía.
- Sabes optimizar para email (asuntos que se abren), Instagram/Facebook (engagement + conversión), WhatsApp, X/Twitter.
- Evitas spam, generas urgencia ética y valor real.
- Propones estrategias realistas para una plataforma de dos lados (compradores + vendedores).

Responde SIEMPRE en formato JSON válido y estricto (sin markdown, sin explicaciones fuera del JSON).

Estructura exacta esperada:
{
  "campaignName": "string corto y potente",
  "objective": "string (1 frase clara del objetivo de negocio)",
  "recommendedSegment": "string (ej: 'sellers activos en Bucaramanga', 'buyers inactivos últimos 60 días', 'todos los usuarios activos')",
  "segmentReason": "string (por qué este segmento funciona para este objetivo)",
  "email": {
    "subject": "string (máx 60 caracteres, alto open rate)",
    "previewText": "string (preview line)",
    "body": "string (cuerpo persuasivo, con saltos de línea, CTA claro, máximo 220 palabras)",
    "cta": "string"
  },
  "social": {
    "instagram": "string (post feed + story ideas, emojis, hashtags incluidos, longitud ideal)",
    "facebook": "string (post optimizado para ads/feed, incluye copy largo + corto)",
    "x": "string (tweet o thread corto, máximo 2-3 tweets)",
    "whatsapp": "string (mensaje para broadcast o status, muy directo y accionable)",
    "general": "string (versión neutra para LinkedIn o web)"
  },
  "adCopies": [
    { "headline": "...", "body": "...", "cta": "..." }
  ] (exactamente ${variations} variaciones de alto rendimiento),
  "visualPrompts": [
    "string (prompts detallados en inglés para Midjourney/Flux/DALL-E, estilo fotorealista o ilustración moderna, con vibe colombiana local)"
  ] (3-5 prompts),
  "hashtags": ["#OigaGIG", ...] (8-12 relevantes + branded),
  "bestTimes": "string (mejores horarios/días para enviar o publicar en Colombia, justificación breve)",
  "strategyNotes": "string (3-5 bullets accionables: por qué este enfoque funciona, qué medir, ideas de seguimiento)",
  "complianceTips": "string (breve recordatorio anti-spam y buenas prácticas)"
}

Contexto del pedido actual:
- Objetivo del usuario: ${effectiveGoal}
- Instrucciones adicionales: ${prompt || 'Ninguna'}
- Canales objetivo: ${channels.join(', ')}
- Segmento sugerido por el admin: ${playbook?.segment || segmentHint || 'ninguno'}
- Tono deseado: ${tone}
- Idioma: ${isSpanish ? 'Español colombiano natural' : 'English'}
- Alcance: ${geoLabel}
- Enfoque compradores: ${buyerFocus}
${buyerFocusBlock}
${playbookBlock}

Genera contenido de clase mundial, específico para servicios locales en Colombia. Sé creativo pero medible.`;

    const userPrompt = `Genera una campaña completa de marketing para OigaGIG siguiendo exactamente la estructura JSON indicada.`;

    const response = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: GROK_MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.85,
        max_tokens: 2200,
      }),
    });

    if (!response.ok) {
      const err = await response.text().catch(() => '');
      devLog("Grok marketing generate error:", err);
      throw new Error("Grok generation failed");
    }

    const data = await response.json();
    let content = data.choices?.[0]?.message?.content || "";

    // Try to extract clean JSON
    let parsed;
    try {
      // Remove possible ```json fences
      content = content.replace(/```json\s?/gi, '').replace(/```\s?$/g, '').trim();
      parsed = JSON.parse(content);
    } catch (e) {
      devLog("Failed to parse Grok JSON, raw content:", content);
      // Fallback: create a minimal useful structure
      parsed = createFallbackCampaign(effectiveGoal, channels, tone, isSpanish, playbook, targetCity || undefined, targetScope);
    }

    // Ensure minimum structure
    parsed = normalizeGeneratedCampaign(parsed, effectiveGoal, variations);
    if (playbook) {
      parsed.recommendedSegment = playbook.segment;
      parsed.segmentReason = playbook.description;
    }

    return NextResponse.json({ 
      success: true, 
      campaign: parsed,
      generatedAt: new Date().toISOString()
    });

  } catch (error) {
    devLog("AI Marketing generate error:", error);
    
    // Always return something usable
    const fallback = createFallbackCampaign(
      effectiveGoal || "Promocionar OigaGIG",
      ["email", "instagram", "facebook"],
      "cercano y confiable",
      true,
      playbook,
      targetCity || undefined,
      targetScope,
    );
    return NextResponse.json({ 
      success: true, 
      campaign: fallback,
      fallback: true,
      message: "Usando contenido de respaldo (Grok no disponible en este momento)"
    });
  }
}

function createFallbackCampaign(
  goal: string,
  channels: string[],
  tone: string,
  isSpanish: boolean,
  playbook?: ReturnType<typeof getPlaybookById>,
  targetCity?: string,
  targetScope: 'national' | 'city' = 'national',
) {
  const geo = targetScope === 'city' && targetCity ? targetCity : 'Colombia';
  const subject = playbook
    ? (isSpanish ? `${playbook.label} — te ayudamos con el siguiente paso` : `${playbook.label} — next steps`)
    : isSpanish
      ? "OigaGIG: Encuentra el servicio que necesitas hoy mismo"
      : "OigaGIG: Find trusted local services today";

  const body = playbook
    ? (isSpanish
        ? `Hola {{name}},\n\n${playbook.description}.\n\nSabemos que a veces no está claro cuál es el siguiente paso. Aquí te guiamos:\n\n1. Revisa tu cuenta en OigaGIG\n2. Sigue las instrucciones del panel\n3. Completa la acción pendiente\n\n👉 ${playbook.defaultCta}: {{ctaUrl}}\n\nSi necesitas ayuda, escríbenos a support@oigagig.com.\n\n— El equipo de OigaGIG`
        : `Hello {{name}},\n\n${playbook.description}.\n\n👉 ${playbook.defaultCta}: {{ctaUrl}}\n\n— OigaGIG`)
    : isSpanish
      ? `Hola,\n\nEn OigaGIG conectamos a personas con los mejores profesionales locales en ${geo}.\n\n¿Necesitas un plomero, electricista, estilista o servicio de limpieza? Encuentra opciones confiables con reseñas reales en segundos.\n\nExplora ahora: https://oigagig.com/gigs\n\n— El equipo de OigaGIG`
      : `Hello,\n\nOigaGIG connects you with trusted local professionals in ${geo}.\n\nFind plumbers, electricians, cleaners and more with real reviews.\n\nBrowse now: https://oigagig.com/gigs`;

  return {
    campaignName: "Campaña OigaGIG - " + goal.slice(0, 40),
    objective: goal,
    recommendedSegment: playbook?.segment || "usuarios activos",
    segmentReason: playbook?.description || "Mayor probabilidad de conversión y engagement.",
    email: {
      subject,
      previewText: playbook?.description || `Servicios locales de confianza en ${geo}.`,
      body,
      cta: playbook?.defaultCta || "Explorar servicios",
    },
    social: {
      instagram: `🔧 ¿Buscas un servicio de confianza en ${geo}? En OigaGIG encuentras profesionales verificados con reseñas reales. #OigaGIG #ServiciosLocales #Colombia`,
      facebook: `OigaGIG: la forma más fácil de encontrar servicios locales confiables en ${geo}. Plomería, electricidad, belleza, mudanzas y más. ¡Únete gratis!`,
      x: `¿Necesitas un servicio confiable en ${geo}? OigaGIG te conecta con los mejores locales en minutos. → oigagig.com`,
      whatsapp: `Hola! En OigaGIG encuentras servicios locales de confianza en ${geo}. ¿Qué necesitas hoy? Visita oigagig.com`,
      general: "OigaGIG — Servicios locales de confianza en Colombia. Conecta con profesionales verificados."
    },
    adCopies: [
      { headline: "Servicios locales que sí cumplen", body: `Profesionales con reseñas reales en ${geo}. Rápido y confiable.`, cta: "Buscar ahora" },
      { headline: "Tu próximo servicio de confianza", body: "Elige entre los mejores evaluados de tu zona.", cta: "Ver opciones" },
    ],
    visualPrompts: [
      `Photorealistic photo of a friendly Colombian service professional in ${geo}, natural daylight, warm colors, trustworthy vibe`,
      "Vibrant Colombian city scene with diverse people using a mobile app, modern lifestyle, friendly and professional atmosphere"
    ],
    hashtags: ["#OigaGIG", "#ServiciosLocales", "#Colombia", "#EmprendedoresColombia", "#Confianza"],
    bestTimes: "Martes a jueves entre 9am-11am y 6pm-8pm (hora Colombia). Alto engagement en redes y mejor apertura de email.",
    strategyNotes: "• Enfócate en el dolor del usuario (necesidad urgente de un servicio).\n• Usa testimonios y números de gigs activos.\n• Mide clics al /gigs y registros nuevos.",
    complianceTips: "Incluye opción clara de baja. No uses lenguaje engañoso. Sé transparente con los beneficios."
  };
}


