import { NextRequest, NextResponse } from 'next/server';
 import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma, getPlatformConfig } from '@/lib/prisma';
import crypto from 'crypto';
import { devLog } from '@/lib/utils';
import type { WompiCheckoutConfig } from '@/types/wompi';
import { getAppBaseUrl } from '@/lib/app-url';
import { OrderStatusLabel, prismaStatusToLabel } from '@/lib/order-status';

const WOMPI_PUBLIC_KEY = process.env.NEXT_PUBLIC_WOMPI_PUBLIC_KEY;
const WOMPI_INTEGRITY_KEY = process.env.WOMPI_INTEGRITY_KEY || process.env.WOMPI_INTEGRITY_SECRET;

// Helpful startup log (appears in Vercel function logs). Critical for diagnosing signature errors.
const pubLooks = (WOMPI_PUBLIC_KEY || '').match(/pub_(test|prod)/i)?.[1] || 'unknown';
const integLooks = (WOMPI_INTEGRITY_KEY || '').match(/(test|prod)_integrity/i)?.[1] || 'unknown/missing';
console.log('[Wompi] Keys loaded — PUBLIC:', pubLooks, 'INTEGRITY:', integLooks, 'hasKey?', !!WOMPI_INTEGRITY_KEY, 'prefix:', (WOMPI_INTEGRITY_KEY || '').slice(0, 12) + '...');
if (WOMPI_INTEGRITY_KEY && WOMPI_PUBLIC_KEY) {
  const pProd = /prod/i.test(WOMPI_PUBLIC_KEY);
  const iProd = /prod/i.test(WOMPI_INTEGRITY_KEY);
  if (pProd !== iProd) console.warn('[Wompi] ⚠️  KEY ENVIRONMENT MISMATCH at startup (pub vs integrity). This will cause "La firma es inválida".');
}

if (process.env.NODE_ENV === 'production' && WOMPI_PUBLIC_KEY?.includes('test')) {
  console.warn('⚠️  WARNING: Using Wompi SANDBOX keys in production! Real payments will not be processed.');
}

// Exact integrity per user-provided snippet (plain SHA256 of concatenated string, key appended, hardcoded COP)
function generateIntegritySignature(
  amountInCents: number,
  reference: string
): string | null {
  if (!WOMPI_INTEGRITY_KEY) {
    return null;
  }

  const integrityString = `${reference}${amountInCents}COP${WOMPI_INTEGRITY_KEY}`;
  const integritySignature = crypto
    .createHash('sha256')
    .update(integrityString)
    .digest('hex');

  return integritySignature;
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
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

    if (prismaStatusToLabel(order.status) !== OrderStatusLabel.Pending) {
      return NextResponse.json(
        { error: 'Este pedido ya no está pendiente de pago' },
        { status: 400 }
      );
    }

    // Respect admin toggle for real payments
    const platformConfig = await getPlatformConfig();
    const realPaymentsEnabled = platformConfig.wompiRealPaymentsEnabled ?? false;

    if (!realPaymentsEnabled) {
      return NextResponse.json({ 
        error: 'Pagos reales desactivados en Admin → Settings (wompiRealPaymentsEnabled).',
        testMode: true 
      }, { status: 403 });
    }

    if (!WOMPI_PUBLIC_KEY) {
      return NextResponse.json({ error: 'Wompi no está configurado (falta NEXT_PUBLIC_WOMPI_PUBLIC_KEY).' }, { status: 500 });
    }

    let amountInCents = Math.round((order.price || 0) * 100);
    if (!Number.isFinite(amountInCents) || amountInCents <= 0) {
      amountInCents = 0; // Will surface clearly in debug + Wompi will reject; prevents "NaN" in signed string (which breaks signature)
    }
    const reference = `order_${order.id}`;

    const integritySignature = generateIntegritySignature(amountInCents, reference);

    // Key environment consistency check (helps debug "firma inválida" when pub key and integrity secret don't match)
    const pubKey = WOMPI_PUBLIC_KEY || '';
    const integKey = WOMPI_INTEGRITY_KEY || '';
    const pubLooksProd = /prod/i.test(pubKey);
    const integLooksProd = /prod/i.test(integKey);
    const keyMismatchWarning = integKey && (pubLooksProd !== integLooksProd)
      ? `MISMATCH: NEXT_PUBLIC_WOMPI_PUBLIC_KEY looks ${pubLooksProd ? 'PROD' : 'TEST/sandbox'} but WOMPI_INTEGRITY_KEY looks ${integLooksProd ? 'PROD' : 'TEST/sandbox'}. The integrity secret MUST match the environment of the public key exactly (get the right "Llave de integridad" from https://comercios.wompi.co for this specific public key).`
      : null;

    // Rebuild the exact string used for hash (for debug only; never leak secret in prod responses)
    const integrityStringForDebug = WOMPI_INTEGRITY_KEY
      ? `${reference}${amountInCents}COP***`
      : `${reference}${amountInCents}COPMISSING`;
    const fullIntegrityString = (process.env.NODE_ENV !== 'production' && WOMPI_INTEGRITY_KEY)
      ? `${reference}${amountInCents}COP${WOMPI_INTEGRITY_KEY}`
      : null;

    // Always log the exact data being sent for debugging (safe info only)
    devLog('[Wompi][Prepare] Checkout data prepared for widget', {
      orderId: order.id,
      reference,
      amountInCents,
      hasIntegrity: !!integritySignature,
      realPaymentsEnabled,
      publicKeyPrefix: WOMPI_PUBLIC_KEY?.slice(0, 12),
      integrityStringPreview: integrityStringForDebug,
    });

    // Build the debug object in the exact shape requested by the snippet.
    // full integrityString (containing secret) is only included for non-production.
    const debug = {
      integrityString: fullIntegrityString, // undefined / omitted in prod
      integritySignature,
    };

    if (keyMismatchWarning) {
      console.warn('[Wompi][Prepare] ' + keyMismatchWarning);
    }

    // Return the clean top-level shape the latest client snippets expect,
    // plus compat fields (hasIntegritySignature + checkoutData) so orders page
    // and any older client code keep working without  "no integrity" false positives.
    const checkoutData: WompiCheckoutConfig = {
      publicKey: process.env.NEXT_PUBLIC_WOMPI_PUBLIC_KEY || '',
      currency: 'COP',
      amountInCents,
      reference,
      // Wompi "Return to Commerce" uses this URL after payment (must match the gig/order context).
      redirectUrl: `${getAppBaseUrl(req)}/orders/${order.id}?from=wompi&gigId=${order.gigId}`,
      customerData: {
        email: order.buyer?.email || session?.user?.email || '',
        fullName: order.buyer?.name || session?.user?.name || '',
      },
      ...(integritySignature ? { signature: { integrity: integritySignature } } : {}),
    };

    return NextResponse.json({
      reference,
      amountInCents,
      publicKey: checkoutData.publicKey,
      integrity: integritySignature,
      currency: checkoutData.currency,
      redirectUrl: checkoutData.redirectUrl,
      customerData: checkoutData.customerData,
      hasIntegritySignature: !!integritySignature,
      debug,
      checkoutData,
    });

  } catch (error: unknown) {
    console.error('Wompi checkout error:', error);
    const details = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: 'Failed to prepare Wompi checkout', details },
      { status: 500 }
    );
  }
}
