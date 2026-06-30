import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions, isAdmin } from '@/lib/auth';
import { BRAND_PLATFORM_URL } from '@/lib/seller-marketing-brand';
import { getMarketingBrandLogoDataUrl } from '@/lib/seller-marketing-brand-server';
import { getSellerMarketingAccess } from '@/lib/seller-marketing-access';
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
    const logoDataUrl = getMarketingBrandLogoDataUrl();

    const width = 1080;
    const height = format === 'story' ? 1920 : 1080;

    return new ImageResponse(
      (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(135deg, #ea580c 0%, #dc2626 55%, #be123c 100%)',
            padding: format === 'story' ? '72px 56px' : '56px 48px',
            fontFamily: 'system-ui, sans-serif',
            color: 'white',
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 24,
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={logoDataUrl}
              width={320}
              height={140}
              alt="Oiga Gig"
              style={{ objectFit: 'contain' }}
            />
            <div
              style={{
                fontSize: format === 'story' ? 52 : 44,
                fontWeight: 800,
                textAlign: 'center',
                lineHeight: 1.15,
                maxWidth: 900,
              }}
            >
              {businessName}
            </div>
            <div
              style={{
                fontSize: format === 'story' ? 36 : 30,
                fontWeight: 600,
                textAlign: 'center',
                opacity: 0.95,
                maxWidth: 880,
              }}
            >
              {headline}
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
              gap: 32,
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, flex: 1 }}>
              <div
                style={{
                  background: 'rgba(0,0,0,0.25)',
                  borderRadius: 16,
                  padding: '16px 24px',
                  fontSize: 28,
                  fontWeight: 700,
                }}
              >
                {BRAND_PLATFORM_URL}
              </div>
              <div
                style={{
                  background: 'rgba(255,255,255,0.15)',
                  borderRadius: 16,
                  padding: '16px 24px',
                  fontSize: 22,
                  fontWeight: 600,
                  lineHeight: 1.3,
                }}
              >
                Mi tienda: {storeDisplay}
              </div>
            </div>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                width: 180,
                height: 180,
                background: 'white',
                borderRadius: 12,
                padding: 12,
                color: '#111827',
                fontSize: 11,
                fontWeight: 700,
                textAlign: 'center',
                lineHeight: 1.25,
              }}
            >
              Escanea o visita
              <div style={{ marginTop: 8, fontSize: 10, fontWeight: 600, color: '#ea580c' }}>
                {storeDisplay}
              </div>
            </div>
          </div>
        </div>
      ),
      { width, height },
    );
  } catch (error) {
    devLog('brand-card ImageResponse failed:', error);
    return new Response('Error generating brand card', { status: 500 });
  }
}