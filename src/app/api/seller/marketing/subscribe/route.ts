import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import crypto from 'crypto';
import { authOptions } from '@/lib/auth';
import { getPlatformConfig } from '@/lib/prisma';
import { getAppBaseUrl } from '@/lib/app-url';
import { ensureMarketingSubscription } from '@/lib/seller-marketing-access';
import { prisma } from '@/lib/prisma';
import type { WompiCheckoutConfig } from '@/types/wompi';

const WOMPI_PUBLIC_KEY = process.env.NEXT_PUBLIC_WOMPI_PUBLIC_KEY;
const WOMPI_INTEGRITY_KEY =
  process.env.WOMPI_INTEGRITY_KEY || process.env.WOMPI_INTEGRITY_SECRET;

function generateIntegritySignature(amountInCents: number, reference: string): string | null {
  if (!WOMPI_INTEGRITY_KEY) return null;
  const integrityString = `${reference}${amountInCents}COP${WOMPI_INTEGRITY_KEY}`;
  return crypto.createHash('sha256').update(integrityString).digest('hex');
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const uid = session?.user?.id;
  if (!uid) {
    return NextResponse.json({ error: 'Debes iniciar sesión' }, { status: 401 });
  }

  if (session?.user?.role !== 'seller' && session?.user?.role !== 'admin') {
    return NextResponse.json({ error: 'Solo vendedores pueden acceder' }, { status: 403 });
  }

  const config = await getPlatformConfig();
  const realPaymentsEnabled = config.wompiRealPaymentsEnabled ?? false;

  if (!realPaymentsEnabled) {
    return NextResponse.json(
      {
        error:
          'Pagos Pro no disponibles. Activa pagos reales en Admin → Settings o contacta soporte.',
        testMode: true,
      },
      { status: 403 },
    );
  }

  if (!WOMPI_PUBLIC_KEY) {
    return NextResponse.json({ error: 'Wompi no configurado.' }, { status: 500 });
  }

  const priceCOP = config.marketingStudioProPriceCOP ?? 29900;
  const amountInCents = Math.round(priceCOP * 100);
  const reference = `MKT-${uid.slice(0, 8)}-${Date.now()}`;

  try {
    await prisma.sellerMarketingSubscription.upsert({
      where: { userId: uid },
      create: { userId: uid, wompiReference: reference },
      update: { wompiReference: reference },
    });
  } catch {
    await ensureMarketingSubscription(uid);
  }

  const integritySignature = generateIntegritySignature(amountInCents, reference);
  const baseUrl = getAppBaseUrl(req);

  const checkoutData: WompiCheckoutConfig = {
    publicKey: WOMPI_PUBLIC_KEY,
    currency: 'COP',
    amountInCents,
    reference,
    redirectUrl: `${baseUrl}/seller/marketing?upgraded=1`,
    customerData: {
      email: session.user?.email || '',
      fullName: session.user?.name || '',
    },
    ...(integritySignature ? { signature: { integrity: integritySignature } } : {}),
  };

  return NextResponse.json({
    reference,
    amountInCents,
    priceCOP,
    publicKey: checkoutData.publicKey,
    integrity: integritySignature,
    currency: 'COP',
    redirectUrl: checkoutData.redirectUrl,
    customerData: checkoutData.customerData,
    checkoutData,
  });
}