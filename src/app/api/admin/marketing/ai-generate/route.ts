import { NextRequest, NextResponse } from 'next/server';
// @ts-ignore
import { getServerSession } from 'next-auth';
import { authOptions, isAdmin } from '@/lib/auth';
import { devLog } from '@/lib/utils';

interface GenerateRequest {
  goal: string;                    // e.g. "Adquirir más compradores en Bucaramanga", "Promocionar nueva categoría plomería"
  prompt?: string;                 // free-form additional instructions
  channels: string[];              // ["email", "instagram", "facebook", "x", "whatsapp", "tiktok"]
  segmentHint?: string;            // optional current segment
  tone?: string;                   // "profesional", "cercano", "urgente", "amigable", "confiable"
  language?: 'es' | 'en';
  variations?: number;             // how many ad variants
}

const GROK_MODEL = "grok-3-mini"; // fast + smart enough for creative marketing

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!isAdmin(session)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const body: GenerateRequest = await req.json();
    const {
      goal = "Promocionar OigaUsted",
      prompt = "",
      channels = ["email", "instagram", "facebook"],
      segmentHint = "",
      tone = "cercano y confiable",
      language = "es",
      variations = 4,
    } = body;

    const apiKey = process.env.GROK_API_KEY || process.env.XAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Grok API key not configured" }, { status: 500 });
    }

    const isSpanish = language === 'es';

    const systemPrompt = `Eres el director creativo de marketing más inteligente y efectivo de Colombia para OigaUsted (oigagig.com).

OigaUsted es la plataforma colombiana #1 de gigs y servicios locales: conecta personas que necesitan servicios (compradores) con freelancers y negocios locales confiables (vendedores), con foco inicial en Bucaramanga y área metropolitana.

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
  "hashtags": ["#OigaUsted", ...] (8-12 relevantes + branded),
  "bestTimes": "string (mejores horarios/días para enviar o publicar en Colombia, justificación breve)",
  "strategyNotes": "string (3-5 bullets accionables: por qué este enfoque funciona, qué medir, ideas de seguimiento)",
  "complianceTips": "string (breve recordatorio anti-spam y buenas prácticas)"
}

Contexto del pedido actual:
- Objetivo del usuario: ${goal}
- Instrucciones adicionales: ${prompt || 'Ninguna'}
- Canales objetivo: ${channels.join(', ')}
- Segmento sugerido por el admin: ${segmentHint || 'ninguno'}
- Tono deseado: ${tone}
- Idioma: ${isSpanish ? 'Español colombiano natural' : 'English'}

Genera contenido de clase mundial, específico para servicios locales en Colombia. Sé creativo pero medible.`;

    const userPrompt = `Genera una campaña completa de marketing para OigaUsted siguiendo exactamente la estructura JSON indicada.`;

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
      parsed = createFallbackCampaign(goal, channels, tone, isSpanish);
    }

    // Ensure minimum structure
    parsed = normalizeCampaignResponse(parsed, goal, channels, variations, isSpanish);

    return NextResponse.json({ 
      success: true, 
      campaign: parsed,
      generatedAt: new Date().toISOString()
    });

  } catch (error) {
    devLog("AI Marketing generate error:", error);
    
    // Always return something usable
    const fallback = createFallbackCampaign(
      "Promocionar OigaUsted", 
      ["email", "instagram", "facebook"], 
      "cercano y confiable", 
      true
    );
    return NextResponse.json({ 
      success: true, 
      campaign: fallback,
      fallback: true,
      message: "Usando contenido de respaldo (Grok no disponible en este momento)"
    });
  }
}

function createFallbackCampaign(goal: string, channels: string[], tone: string, isSpanish: boolean) {
  const subject = isSpanish 
    ? "OigaUsted: Encuentra el servicio que necesitas hoy mismo" 
    : "OigaUsted: Find trusted local services today";

  return {
    campaignName: "Campaña OigaUsted - " + goal.slice(0, 40),
    objective: goal,
    recommendedSegment: "usuarios activos",
    segmentReason: "Mayor probabilidad de conversión y engagement.",
    email: {
      subject,
      previewText: "Servicios locales de confianza en Bucaramanga y más.",
      body: isSpanish 
        ? `Hola,\n\nEn OigaUsted conectamos a personas con los mejores profesionales locales de Bucaramanga y el área metropolitana.\n\n¿Necesitas un plomero, electricista, estilista o servicio de limpieza? Encuentra opciones confiables con reseñas reales en segundos.\n\nExplora ahora: https://oigagig.com/gigs\n\n— El equipo de OigaUsted`
        : `Hello,\n\nOigaUsted connects you with trusted local professionals in Bucaramanga.\n\nFind plumbers, electricians, cleaners and more with real reviews.\n\nBrowse now: https://oigagig.com/gigs`,
      cta: "Explorar servicios"
    },
    social: {
      instagram: "🔧 ¿Buscas un servicio de confianza en Bucaramanga? En OigaUsted encuentras profesionales verificados con reseñas reales. ¡Publica tu necesidad o ofrece tus servicios hoy! #OigaUsted #Bucaramanga #ServiciosLocales",
      facebook: "OigaUsted: la forma más fácil de encontrar servicios locales confiables en Bucaramanga. Plomería, electricidad, belleza, mudanzas y mucho más. Con reseñas reales y contacto directo. ¡Únete gratis!",
      x: "En Bucaramanga y necesitas un servicio confiable? OigaUsted te conecta con los mejores locales en minutos. Prueba gratis → oigagig.com",
      whatsapp: "Hola! En OigaUsted encuentras servicios locales de confianza en Bucaramanga. ¿Qué necesitas hoy? Visita oigagig.com",
      general: "OigaUsted — Servicios locales de confianza en Colombia. Conecta con profesionales verificados."
    },
    adCopies: [
      { headline: "Servicios locales que sí cumplen", body: "Profesionales con reseñas reales en Bucaramanga. Rápido y confiable.", cta: "Buscar ahora" },
      { headline: "Tu próximo plomero de confianza", body: "Elige entre los mejores evaluados de la zona.", cta: "Ver opciones" },
    ],
    visualPrompts: [
      "Photorealistic photo of a friendly Colombian handyman smiling in a Bucaramanga neighborhood home, natural daylight, warm colors, modern Colombian home interior, trustworthy vibe",
      "Vibrant Colombian market scene with diverse people using a mobile app, modern lifestyle, Bucaramanga architecture in background, friendly and professional atmosphere"
    ],
    hashtags: ["#OigaUsted", "#ServiciosLocales", "#Bucaramanga", "#EmprendedoresColombia", "#Confianza"],
    bestTimes: "Martes a jueves entre 9am-11am y 6pm-8pm (hora Colombia). Alto engagement en redes y mejor apertura de email.",
    strategyNotes: "• Enfócate en el dolor del usuario (necesidad urgente de un servicio).\n• Usa testimonios y números de gigs activos.\n• Mide clics al /gigs y registros nuevos.",
    complianceTips: "Incluye opción clara de baja. No uses lenguaje engañoso. Sé transparente con los beneficios."
  };
}

function normalizeCampaignResponse(raw: any, goal: string, channels: string[], variations: number, isSpanish: boolean) {
  const base = createFallbackCampaign(goal, channels, "cercano", isSpanish);

  return {
    campaignName: raw.campaignName || base.campaignName,
    objective: raw.objective || goal,
    recommendedSegment: raw.recommendedSegment || base.recommendedSegment,
    segmentReason: raw.segmentReason || base.segmentReason,
    email: raw.email || base.email,
    social: raw.social || base.social,
    adCopies: Array.isArray(raw.adCopies) && raw.adCopies.length > 0 
      ? raw.adCopies.slice(0, variations) 
      : base.adCopies,
    visualPrompts: Array.isArray(raw.visualPrompts) && raw.visualPrompts.length > 0 
      ? raw.visualPrompts 
      : base.visualPrompts,
    hashtags: Array.isArray(raw.hashtags) && raw.hashtags.length > 0 
      ? raw.hashtags 
      : base.hashtags,
    bestTimes: raw.bestTimes || base.bestTimes,
    strategyNotes: raw.strategyNotes || base.strategyNotes,
    complianceTips: raw.complianceTips || base.complianceTips,
  };
}
