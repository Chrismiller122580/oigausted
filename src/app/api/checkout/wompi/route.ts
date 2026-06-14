import { NextRequest, NextResponse } from 'next/server';
// @ts-ignore
 import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma, getPlatformConfig } from '@/lib/prisma';
import crypto from 'crypto';
import { devLog } from '@/lib/utils';

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

function generateIntegritySignature(
  amountInCents: number,
  currency: string,
  reference: string
): string | null {
  if (!WOMPI_INTEGRITY_KEY) {
    return null;
  }

  // Official Wompi Colombia (docs.wompi.co widget-checkout-web):
  // Concat exactly (no separators, no public key): <reference><amountInCents><currency><integritySecret>
  // Then HMAC-SHA256( integritySecret , thatString ).hex
  // IMPORTANT: amountInCents must be integer (cents), reference exact, currency "COP".
  // The secret used here must be the one associated with the *exact same* public key in the Wompi dashboard.
  // User's physical location, IP, or browser has zero impact on this hash.
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

    let amountInCents = Math.round((order.price || 0) * 100);
    if (!Number.isFinite(amountInCents) || amountInCents <= 0) {
      amountInCents = 0; // Will surface clearly in debug + Wompi will reject; prevents "NaN" in signed string (which breaks signature)
    }
    const reference = `order_${order.id}`;
    const currency = 'COP';

    const integritySignature = generateIntegritySignature(amountInCents, currency, reference);

    // Key environment consistency check (helps debug "firma inválida" when pub key and integrity secret don't match)
    // Most common cause of "La firma es inválida" in the Wompi widget.
    const pubKey = WOMPI_PUBLIC_KEY || '';
    const integKey = WOMPI_INTEGRITY_KEY || '';
    const pubLooksProd = /prod/i.test(pubKey);
    const integLooksProd = /prod/i.test(integKey);
    const keyMismatchWarning = integKey && (pubLooksProd !== integLooksProd)
      ? `MISMATCH: NEXT_PUBLIC_WOMPI_PUBLIC_KEY looks ${pubLooksProd ? 'PROD' : 'TEST/sandbox'} but WOMPI_INTEGRITY_KEY looks ${integLooksProd ? 'PROD' : 'TEST/sandbox'}. The integrity secret MUST match the environment of the public key exactly (get the right "Llave de integridad" from https://comercios.wompi.co for this specific public key).`
      : null;

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
      // Always remind: the INTEGRITY_KEY secret must be the one from Wompi dashboard "Llave de integridad" for the exact public key above.
      note: 'If you see "La firma es inválida" in Wompi: this is a cryptographic mismatch. 1) Confirm wompiRealPaymentsEnabled=true in Admin Settings. 2) In comercios.wompi.co get the EXACT "Llave de integridad" (not Events, not Private) that belongs to your current public key (pub_test_ vs pub_prod_). 3) Set it as WOMPI_INTEGRITY_KEY and redeploy. User location/IP or browser country has NO effect on the signature hash (it is computed server-side from ref + amountCents + COP + secret only).',
    };
    if (process.env.NODE_ENV !== 'production') {
      debugInfo.stringToSign = `${reference}${amountInCents}${currency}${WOMPI_INTEGRITY_KEY}`;
      debugInfo.fullIntegrity = integritySignature;
    }
    if (keyMismatchWarning) {
      debugInfo.keyMismatch = keyMismatchWarning;
      console.warn('[Wompi][Prepare] ' + keyMismatchWarning);
    }

    // Fix 3: Ensure Prepare Endpoint Returns Everything (top level for client forcing) + full for compat
    return NextResponse.json({
      reference,
      amountInCents: Math.round((order.price || 0) * 100),
      publicKey: process.env.NEXT_PUBLIC_WOMPI_PUBLIC_KEY,
      integrity: integritySignature,
      // previous for compat
      checkoutData,
      success: true,
      hasIntegritySignature: !!integritySignature,
      debug: debugInfo,
    });

  } catch (error: any) {
    console.error('Wompi checkout error:', error);
    return NextResponse.json(
      { error: 'Failed to prepare Wompi checkout', details: error.message },
      { status: 500 }
    );
  }
}
