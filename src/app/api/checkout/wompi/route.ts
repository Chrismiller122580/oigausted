import { NextRequest, NextResponse } from 'next/server';
// @ts-ignore
 import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma, getPlatformConfig } from '@/lib/prisma';
import crypto from 'crypto';
import { devLog } from '@/lib/utils';

const WOMPI_PUBLIC_KEY = process.env.NEXT_PUBLIC_WOMPI_PUBLIC_KEY;
const WOMPI_INTEGRITY_KEY = process.env.WOMPI_INTEGRITY_KEY || process.env.WOMPI_INTEGRITY_SECRET;

if (process.env.NODE_ENV === 'production' && WOMPI_PUBLIC_KEY?.includes('test')) {
  console.warn('⚠️  WARNING: Using Wompi SANDBOX keys in production! Real payments will not be processed.');
}

function generateIntegritySignature(
  amountInCents: number,
  currency: string,
  reference: string
): string | null {
  if (!WOMPI_INTEGRITY_KEY) {
    return null;
  }

  // Official Wompi Colombia order (as per docs):
  // <reference><amountInCents><currency><integritySecret>
  // Never include the public key in the hash for the widget integrity signature.
  const stringToSign = `${reference}${amountInCents}${currency}${WOMPI_INTEGRITY_KEY}`;

  return crypto
    .createHmac('sha256', WOMPI_INTEGRITY_KEY)
    .update(stringToSign)
    .digest('hex');
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { orderId } = await req.json();

    if (!orderId) {
      return NextResponse.json({ error: 'orderId is required' }, { status: 400 });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      // Explicit to avoid missing DB columns like sellerPayoutAt
      select: {
        id: true,
        price: true,
        status: true,
        buyerId: true,
        sellerId: true,
        gigId: true,
        customFields: true,
        gig: {
          select: {
            id: true,
            title: true,
            description: true,
            price: true,
            category: true,
            completionTime: true,
            imageUrl: true,
            fields: true,
            addons: true,
            isActive: true,
            createdAt: true,
            sellerId: true,
            city: true,
            latitude: true,
            longitude: true,
            isRemote: true,
            seller: {
              select: {
                id: true,
                name: true,
                email: true,
                businessName: true,
                // slug omitted to avoid missing column in prod DB
                profilePicture: true,
                rating: true,
                reviewCount: true,
                latitude: true,
                longitude: true,
                serviceRadiusKm: true,
                city: true,
              }
            }
          }
        },
        buyer: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (order.buyerId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Respect admin toggle for real payments
    const platformConfig = await getPlatformConfig();
    const realPaymentsEnabled = (platformConfig as any)?.wompiRealPaymentsEnabled ?? false;

    if (!realPaymentsEnabled) {
      return NextResponse.json({ 
        error: 'Pagos reales desactivados en Admin → Settings (wompiRealPaymentsEnabled).',
        testMode: true 
      }, { status: 403 });
    }

    if (!WOMPI_PUBLIC_KEY) {
      return NextResponse.json({ error: 'Wompi no está configurado (falta NEXT_PUBLIC_WOMPI_PUBLIC_KEY).' }, { status: 500 });
    }

    const amountInCents = Math.round(order.price * 100);
    const reference = `order_${order.id}`;
    const currency = 'COP';

    const integritySignature = generateIntegritySignature(amountInCents, currency, reference);

    // Key environment consistency check (helps debug "firma inválida" when pub key and integrity secret don't match)
    const pubPrefix = (WOMPI_PUBLIC_KEY || '').slice(0, 8);
    const isProdPub = pubPrefix.includes('prod');
    const integKey = WOMPI_INTEGRITY_KEY || '';
    const integLooksTest = integKey.includes('test') || !integKey.includes('prod');
    const keyMismatchWarning = isProdPub && integLooksTest ? 'MISMATCH: publicKey is prod but INTEGRITY_KEY looks like test/sandbox or missing "prod". Use the prod_integrity_... secret from Wompi dashboard for this pub_prod_ key.' : null;

    const checkoutData: any = {
      publicKey: WOMPI_PUBLIC_KEY,
      currency,
      amountInCents,
      reference,
      redirectUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/orders/${order.id}`,
      customerData: {
        email: order.buyer?.email || session.user.email || '',
        fullName: order.buyer?.name || session.user.name || '',
      },
    };

    // Add integrity signature when the key is available (recommended for production)
    if (integritySignature) {
      checkoutData.signature = {
        integrity: integritySignature,
      };
    }

    // Always log the exact data being sent for debugging (safe info only)
    const stringToSignForDebug = `${reference}${amountInCents}${currency}${WOMPI_INTEGRITY_KEY ? '***' : 'MISSING'}`;
    devLog('[Wompi][Prepare] Checkout data prepared for widget', {
      orderId: order.id,
      reference,
      amountInCents,
      currency,
      hasIntegrity: !!integritySignature,
      realPaymentsEnabled,
      redirectUrl: checkoutData.redirectUrl,
      stringToSignPreview: stringToSignForDebug,
      publicKeyPrefix: WOMPI_PUBLIC_KEY?.slice(0, 12),
    });

    // Rich debug for the in-app Wompi Debugger so users can send exact data when signature errors happen.
    // We never expose the raw secret in production responses.
    const debugInfo: any = {
      amountInCents,
      reference,
      currency,
      publicKeyPrefix: WOMPI_PUBLIC_KEY?.slice(0, 12),
      hasIntegrity: !!integritySignature,
      // Safe preview of exactly what was fed into the HMAC (secret redacted)
      signedStringPreview: `${reference}${amountInCents}${currency}***`,
      integritySignaturePrefix: integritySignature ? integritySignature.slice(0, 10) + '...' + integritySignature.slice(-6) : null,
      keyEnvironmentCheck: keyMismatchWarning || 'keys appear consistent (prod/pub vs integrity)',
    };
    if (process.env.NODE_ENV !== 'production') {
      debugInfo.stringToSign = `${reference}${amountInCents}${currency}${WOMPI_INTEGRITY_KEY}`;
      debugInfo.fullIntegrity = integritySignature;
    }
    if (keyMismatchWarning) {
      debugInfo.keyMismatch = keyMismatchWarning;
      console.warn('[Wompi][Prepare] ' + keyMismatchWarning);
    }

    const response: any = {
      success: true,
      checkoutData,
      reference,
      hasIntegritySignature: !!integritySignature,
      debug: debugInfo,
    };
    if (keyMismatchWarning) {
      response.keyMismatchWarning = keyMismatchWarning;
    }
    return NextResponse.json(response);

  } catch (error: any) {
    console.error('Wompi checkout error:', error);
    return NextResponse.json(
      { error: 'Failed to prepare Wompi checkout', details: error.message },
      { status: 500 }
    );
  }
}
