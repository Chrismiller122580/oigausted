import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions, isAdmin } from '@/lib/auth';
import { getAppBaseUrl } from '@/lib/app-url';
import { loadSellerMarketingContext } from '@/lib/seller-marketing-context';
import {
  assertCanGenerate,
  recordGeneration,
} from '@/lib/seller-marketing-access';
import { generateSellerMarketingContent } from '@/lib/seller-marketing-grok';
import { applySocialBranding } from '@/lib/seller-marketing-brand';
import { buildGigUrl } from '@/lib/seller-marketing-context';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const uid = session?.user?.id;
  if (!uid) {
    return NextResponse.json({ error: 'Debes iniciar sesión' }, { status: 401 });
  }

  const role = session?.user?.role;
  if (role !== 'seller' && role !== 'admin') {
    return NextResponse.json({ error: 'Solo vendedores pueden acceder' }, { status: 403 });
  }

  let body: { goal?: string; prompt?: string; tone?: string; gigId?: string } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 });
  }

  const goal = body.goal?.trim();
  const gigId = body.gigId?.trim();

  if (!gigId) {
    return NextResponse.json({ error: 'Selecciona un servicio a promocionar' }, { status: 400 });
  }

  if (!goal) {
    return NextResponse.json({ error: 'El objetivo es obligatorio' }, { status: 400 });
  }

  try {
    const access = await assertCanGenerate(uid, {
      isAdmin: isAdmin(session),
      req,
    });

    const ctx = await loadSellerMarketingContext(uid, gigId, req);
    if (!ctx) {
      return NextResponse.json({ error: 'Perfil no encontrado' }, { status: 404 });
    }

    const ownsGig = ctx.gigs.some((g) => g.id === gigId) || ctx.selectedGig?.id === gigId;
    if (!ownsGig) {
      return NextResponse.json({ error: 'Gig no válido' }, { status: 403 });
    }

    const baseUrl = getAppBaseUrl(req);
    const { content, fallback } = await generateSellerMarketingContent({
      goal,
      prompt: body.prompt,
      tone: body.tone,
      ctx,
      baseUrl,
    });

    const brandedSocial = applySocialBranding(content.social, ctx.storeUrl);
    const brandedContent = { ...content, social: brandedSocial };

    await recordGeneration(uid, {
      gigId: ctx.selectedGig?.id,
      channel: 'instagram,whatsapp',
    });

    const headline = ctx.selectedGig?.title || ctx.businessName;
    const brandCardQuery = new URLSearchParams({
      headline,
      businessName: ctx.businessName,
      storePath: ctx.storePath.replace(/^\//, ''),
    });

    return NextResponse.json({
      success: true,
      content: brandedContent,
      storeUrl: ctx.storeUrl,
      storePath: ctx.storePath,
      gigUrl: ctx.selectedGig ? buildGigUrl(baseUrl, ctx.selectedGig.id) : undefined,
      brandCardUrls: {
        feed: `/api/seller/marketing/brand-card?format=feed&${brandCardQuery}`,
        story: `/api/seller/marketing/brand-card?format=story&${brandCardQuery}`,
      },
      usage: {
        used: access.usedThisMonth + 1,
        limit: access.limit,
        tier: access.effectiveTier,
      },
      fallback,
    });
  } catch (error: unknown) {
    const err = error as Error & { status?: number; code?: string };
    const status = err.status ?? 500;
    return NextResponse.json(
      {
        error: err.message || 'Error generando contenido',
        code: err.code,
      },
      { status },
    );
  }
}