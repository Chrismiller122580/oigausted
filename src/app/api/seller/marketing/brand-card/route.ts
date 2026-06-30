import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions, isAdmin } from '@/lib/auth';
import { getAppBaseUrl } from '@/lib/app-url';
import { publicSellerSegment } from '@/lib/seller-profile';
import { getSellerMarketingAccess } from '@/lib/seller-marketing-access';
import { generateMarketingBrandCardSvg } from '@/lib/seller-marketing-brand-server';

export const runtime = 'nodejs';

function resolveStoreDisplay(
  req: NextRequest,
  session: {
    id: string;
    slug?: string | null;
    businessName?: string | null;
    name?: string | null;
  },
  accessStoreUrl?: string,
): string {
  if (accessStoreUrl) {
    return accessStoreUrl.replace(/^https?:\/\//, '');
  }
  const baseUrl = getAppBaseUrl(req);
  const segment = publicSellerSegment(session);
  return `${baseUrl.replace(/^https?:\/\//, '')}/sellers/${segment}`;
}

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

    let accessStoreUrl = '';
    let allowed = true;

    try {
      const access = await getSellerMarketingAccess(uid, {
        isAdmin: isAdmin(session),
        req,
      });
      allowed = access.allowed;
      accessStoreUrl = access.storeUrl;
    } catch (accessError) {
      console.error('[brand-card] getSellerMarketingAccess failed:', accessError);
    }

    if (!allowed) {
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

    const storeDisplay = resolveStoreDisplay(
      req,
      {
        id: uid,
        slug: session.user.slug,
        businessName: session.user.businessName,
        name: session.user.name,
      },
      accessStoreUrl,
    );

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
    console.error('[brand-card] unhandled error:', error);
    return new Response('Error generating brand card', { status: 500 });
  }
}