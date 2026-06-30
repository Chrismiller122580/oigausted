import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions, isAdmin } from '@/lib/auth';
import { getAppBaseUrl } from '@/lib/app-url';
import { MARKETING_BRAND_LOGO_PATH, BRAND_PLATFORM_URL } from '@/lib/seller-marketing-brand';
import { getSellerMarketingAccess } from '@/lib/seller-marketing-access';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
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
  const businessName = (searchParams.get('businessName') || 'Mi negocio').slice(0, 60);
  const storePathParam = searchParams.get('storePath');
  const storePath = storePathParam
    ? `/${storePathParam.replace(/^\//, '')}`
    : access.storePath;
  const baseUrl = getAppBaseUrl(req);
  const storeUrl = `${baseUrl}${storePath}`;
  const storeDisplay = storeUrl.replace(/^https?:\/\//, '');

  const width = format === 'story' ? 1080 : 1080;
  const height = format === 'story' ? 1920 : 1080;
  const logoUrl = `${baseUrl}${MARKETING_BRAND_LOGO_PATH}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(storeUrl)}`;

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
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logoUrl} width={320} height={140} alt="Oiga Gig" style={{ objectFit: 'contain' }} />
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
              }}
            >
              🏪 Mi tienda: {storeDisplay}
            </div>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qrUrl} width={180} height={180} alt="QR tienda" style={{ borderRadius: 12 }} />
        </div>
      </div>
    ),
    { width, height },
  );
}