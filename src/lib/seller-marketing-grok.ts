import { devLog } from '@/lib/utils';
import { BRAND_PLATFORM_URL } from '@/lib/seller-marketing-brand';
import {
  normalizeSellerGeneratedContent,
  createSellerFallbackContent,
  type SellerGeneratedContent,
} from '@/lib/seller-marketing-types';
import type { SellerMarketingContext } from '@/lib/seller-marketing-context';
import { buildGigUrl } from '@/lib/seller-marketing-context';

const GROK_MODEL = 'grok-3-mini';

export type SellerGenerateInput = {
  goal: string;
  prompt?: string;
  tone?: string;
  ctx: SellerMarketingContext;
  baseUrl: string;
};

function buildGigBlock(ctx: SellerMarketingContext, baseUrl: string): string {
  const lines = ctx.gigs.slice(0, 5).map((g) => {
    const url = buildGigUrl(baseUrl, g.id);
    return `- ${g.title} ($${Math.round(g.price).toLocaleString('es-CO')} COP) → ${url}`;
  });
  const selected = ctx.selectedGig
    ? `\nServicio principal a promocionar: ${ctx.selectedGig.title} → ${buildGigUrl(baseUrl, ctx.selectedGig.id)}`
    : '';
  return `${lines.join('\n')}${selected}`;
}

export async function generateSellerMarketingContent(
  input: SellerGenerateInput,
): Promise<{ content: SellerGeneratedContent; fallback: boolean }> {
  const { goal, prompt = '', tone = 'cercano y confiable', ctx, baseUrl } = input;
  const businessName = ctx.businessName;
  const storeUrl = ctx.storeUrl;

  const apiKey = process.env.GROK_API_KEY || process.env.XAI_API_KEY;
  if (!apiKey) {
    const fallback = createSellerFallbackContent(
      goal,
      businessName,
      storeUrl,
      ctx.selectedGig?.title,
    );
    return { content: fallback, fallback: true };
  }

  const systemPrompt = `Eres un experto en marketing para vendedores de servicios locales en Colombia en OigaGig.

El vendedor promociona SU PROPIO negocio (no la plataforma genérica).
- Negocio: ${businessName}
- Ciudad: ${ctx.city || 'Colombia'}
- Reseñas: ${ctx.reviewCount} (${ctx.rating.toFixed(1)} estrellas)
- Tienda pública OBLIGATORIA: ${storeUrl}
- Plataforma OBLIGATORIA en cada texto: ${BRAND_PLATFORM_URL}
- Bio: ${ctx.bio || 'Sin bio'}

Servicios activos:
${buildGigBlock(ctx, baseUrl)}

REGLAS ESTRICTAS:
- Español colombiano natural, tono: ${tone}
- Cada campo social DEBE incluir ${storeUrl} y ${BRAND_PLATFORM_URL}
- No inventar descuentos ni urgencia falsa
- No incluir teléfono ni email del vendedor
- Enfócate en confianza, servicio local y reservar en OigaGig

Responde SOLO JSON válido (sin markdown):
{
  "objective": "string",
  "social": {
    "instagram": "string (post feed con emojis y hashtags)",
    "whatsapp": "string (mensaje directo y accionable)"
  },
  "hashtags": ["#OigaGig", "..."],
  "visualPrompts": ["prompt en inglés para imagen con logo OigaGig"],
  "bestTimes": "string",
  "postingTips": "string"
}

Objetivo: ${goal}
Instrucciones extra: ${prompt || 'Ninguna'}`;

  try {
    const response = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: GROK_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          {
            role: 'user',
            content: 'Genera el contenido de marketing para este vendedor siguiendo el JSON indicado.',
          },
        ],
        temperature: 0.85,
        max_tokens: 1600,
      }),
    });

    if (!response.ok) {
      throw new Error('Grok failed');
    }

    const data = await response.json();
    let content = data.choices?.[0]?.message?.content || '';
    content = content.replace(/```json\s?/gi, '').replace(/```\s?$/g, '').trim();
    const parsed = JSON.parse(content) as Record<string, unknown>;
    return {
      content: normalizeSellerGeneratedContent(parsed, goal),
      fallback: false,
    };
  } catch (error) {
    devLog('Seller marketing Grok error:', error);
    const fallback = createSellerFallbackContent(
      goal,
      businessName,
      storeUrl,
      ctx.selectedGig?.title,
    );
    return { content: fallback, fallback: true };
  }
}