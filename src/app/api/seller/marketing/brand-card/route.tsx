import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions, isAdmin } from '@/lib/auth';
import { getSellerMarketingAccess } from '@/lib/seller-marketing-access';
import { generateMarketingBrandCardSvg } from '@/lib/seller-marketing-brand-server';
import { devLog } from '@/lib/utils';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const uid = session?.user?.id;
    if (!uid) {
      return new Response('Unauthorized', { status: 401 });
    }

    if (session?.user?.role !== 'seller' && session?.user?.role !== 'admin') {
      return new Response('Forbidden', { status: 403 });
    }

    const access = await getSellerMarketingAccess(uid, {
      isAdmin: isAdmin(session),
      req,
    });

    if (!access.allowed) {
      return new Response('Forbidden', { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const format = searchParams.get('format') === 'story' ? 'story' : 'feed';
    const headline = (searchParams.get('headline') || 'Mis servicios').slice(0, 80);
    const businessName = (
      searchParams.get('businessName') ||
      session.user.businessName ||
      session.user.name ||
      'Mi negocio'
    ).slice(0, 60);

    const storeDisplay = access.storeUrl.replace(/^https?:\/\//, '');
    const svg = generateMarketingBrandCardSvg({
      format,
      businessName,
      headline,
      storeDisplay,
    });

    return new Response(svg, {
      status: 200,
      headers: {
        'Content-Type': 'image/svg+xml; charset=utf-8',
        'Cache-Control': 'private, max-age=300',
      },
    });
  } catch (error) {
    devLog('brand-card SVG generation failed:', error);
    return new Response('Error generating brand card', { status: 500 });
  }
}