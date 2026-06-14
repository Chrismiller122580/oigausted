import { NextRequest, NextResponse } from 'next/server';
// @ts-ignore
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { devLog } from '@/lib/utils';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { logAuditEvent } from '@/lib/audit';
import { confirmWompiPayment } from '@/lib/server/confirm-wompi-payment';
import {
  getEventsKeyInfo,
  verifyWompiSignatureDetailed,
  resolveWompiProperty,
} from '@/lib/wompi-signature';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const isAdmin = (session?.user as any)?.role === 'admin';
  if (!isAdmin) {
    return NextResponse.json({ error: 'Admin only' }, { status: 403 });
  }

  // Optional sample for live webhook signature debugging (paste a failing X-Event-Checksum event here)
  let sampleEvent: any = null;
  let sampleChecksum = '';
  let replayRequested = false;
  let testEventsKey: string | undefined = undefined;
  let parsedRequestBody: any = {};
  try {
    parsedRequestBody = await req.json().catch(() => ({}));
    if (parsedRequestBody && (parsedRequestBody.sampleWebhookEvent || parsedRequestBody.sampleEvent)) {
      sampleEvent = parsedRequestBody.sampleWebhookEvent || parsedRequestBody.sampleEvent;
    }
    sampleChecksum = parsedRequestBody?.sampleChecksum || parsedRequestBody?.checksum || (sampleEvent?.signature?.checksum || '');
    replayRequested = !!(parsedRequestBody?.replay === true || parsedRequestBody?.force === true || parsedRequestBody?.process === true);
    testEventsKey = parsedRequestBody?.testEventsKey || parsedRequestBody?.customEventsKey || undefined;
  } catch {
    // no body or not json; proceed with env-only self test
  }

  const pub = process.env.NEXT_PUBLIC_WOMPI_PUBLIC_KEY || '';
  const integ = process.env.WOMPI_INTEGRITY_KEY || process.env.WOMPI_INTEGRITY_SECRET || '';
  const priv = process.env.WOMPI_PRIVATE_KEY || '';

  const pubLooks = pub.match(/pub_(test|prod)/i)?.[1] || 'unknown';
  const integLooks = integ.match(/(test|prod)_integrity/i)?.[1] || (integ ? 'unknown' : 'missing');
  const privLooks = priv.match(/prv_(test|prod)/i)?.[1] || (priv ? 'unknown' : 'missing');

  const keyMismatch = integ && pub ? (/prod/i.test(pub) !== /prod/i.test(integ)) : false;

  // Use the shared events key loader (centralized diagnostics + correct fallback)
  const eventsInfo = getEventsKeyInfo();
  const events = (process.env.WOMPI_EVENTS_KEY || process.env.WOMPI_EVENTS_SECRET || '');
  const eventsLooks = events ? (events.match(/(test|prod)_events/i)?.[1] || 'unknown') : 'missing';

  // Sample integrity signature computation (proves the key material is loadable and HMAC works)
  let sampleSig: string | null = null;
  let sampleNote = 'no integrity key';
  if (integ) {
    try {
      const sampleRef = 'order_test_123';
      const sampleCents = 12345;
      const sampleCur = 'COP';
      const toSign = `${sampleRef}${sampleCents}${sampleCur}${integ}`;
      sampleSig = crypto.createHmac('sha256', integ).update(toSign).digest('hex');
      sampleNote = 'computed successfully (exact concat: ref + cents + COP + secret)';
    } catch (e: any) {
      sampleNote = 'HMAC failed: ' + (e?.message || e);
    }
  }

  // Sample events/webhook signature computation (proves EVENTS_KEY material works for the exact algorithm used by /api/webhooks/wompi)
  let sampleEventsSig: string | null = null;
  let sampleEventsNote = 'no events key';
  if (events) {
    try {
      // Use the same property-based concat that the real webhook uses (matching the failing event style you reported)
      const sampleProps = ['transaction.id', 'transaction.status', 'transaction.amount_in_cents'];
      const sampleTx = { id: 'tx_test_999', status: 'APPROVED', amount_in_cents: 100000 };
      const sampleBodyForSig = { data: { transaction: sampleTx }, signature: { properties: sampleProps } };
      const signedPayload = sampleProps.map(p => {
        // simple inline resolve for the canary (same logic as shared module)
        if (p === 'transaction.id') return sampleTx.id;
        if (p === 'transaction.status') return sampleTx.status;
        if (p === 'transaction.amount_in_cents') return String(sampleTx.amount_in_cents);
        return '';
      }).join('');
      sampleEventsSig = crypto.createHmac('sha256', events).update(signedPayload).digest('hex');
      sampleEventsNote = `computed successfully (properties: ${sampleProps.join(', ')} → concat: ${signedPayload})`;
    } catch (e: any) {
      sampleEventsNote = 'HMAC failed: ' + (e?.message || e);
    }
  }

  // Try a real status query using the best available token (prefer private)
  let query: any = { attempted: false };
  const token = priv || pub;
  const isSandbox = /test|sandbox|_test_/i.test(pub);
  const base = isSandbox ? 'https://sandbox.wompi.co' : 'https://production.wompi.co';

  if (token) {
    query.attempted = true;
    query.base = base;
    query.usedPrivate = !!priv;
    try {
      // Use a reference that almost certainly won't exist — we just want 200 + no auth error
      const url = `${base}/v1/transactions?reference=${encodeURIComponent('order_wompi_selftest_' + Date.now())}`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
        // short timeout not directly supported in fetch; rely on platform
      });
      query.status = res.status;
      const body = await res.json().catch(() => ({}));
      query.ok = res.ok;
      query.dataEmpty = Array.isArray(body?.data) ? body.data.length === 0 : !body?.data;
      query.sampleResponseKeys = body ? Object.keys(body).slice(0, 6) : [];
      if (!res.ok) {
        query.error = (body?.error?.reason || body?.error?.message || body?.error || await res.text().catch(() => 'unknown')).toString().slice(0, 200);
      }
    } catch (e: any) {
      query.error = e?.message || String(e);
    }
  } else {
    query.skipped = 'no token';
  }

  const summary = {
    publicKeyPrefix: pub ? pub.slice(0, 12) + '...' : 'MISSING',
    integrityKeyPrefix: integ ? integ.slice(0, 12) + '...' : 'MISSING',
    eventsKeyPrefix: events ? events.slice(0, 12) + '...' : 'MISSING',
    privateKeyPrefix: priv ? priv.slice(0, 12) + '...' : 'MISSING (recommended for Consultar)',
    environments: { public: pubLooks, integrity: integLooks, events: eventsLooks, private: privLooks },
    integrityPubMismatch: keyMismatch,
    sampleSignature: sampleSig ? sampleSig.slice(0, 12) + '...' : null,
    sampleSignatureNote: sampleNote,
    sampleEventsSignature: sampleEventsSig ? sampleEventsSig.slice(0, 12) + '...' : null,
    sampleEventsSignatureNote: sampleEventsNote,
    query,
    recommendations: [] as string[],
  };

  if (!pub) summary.recommendations.push('Set NEXT_PUBLIC_WOMPI_PUBLIC_KEY (pub_test_ or pub_prod_)');
  if (!integ) summary.recommendations.push('Set WOMPI_INTEGRITY_KEY (the "Llave de integridad" matching the public key)');
  if (keyMismatch) summary.recommendations.push('INTEGRITY_KEY environment does not match PUBLIC key (test vs prod). This is the #1 cause of "La firma es inválida".');
  if (!priv) summary.recommendations.push('Add WOMPI_PRIVATE_KEY (prv_...) for reliable transaction lookups in the order debugger "Consultar".');
  if (query.attempted && !query.ok) summary.recommendations.push('Wompi API query failed — verify the private (or public) key is valid for the chosen environment (sandbox vs production) and that the key belongs to the merchant of the public key.');
  if (query.ok) summary.recommendations.push('Query to Wompi API succeeded — keys look usable for status checks.');

  // === Sample webhook event signature verification (for debugging 401 "Invalid signature" on /api/webhooks/wompi) ===
  let eventVerification: any = { attempted: false };
  if (sampleEvent && typeof sampleEvent === 'object') {
    eventVerification.attempted = true;
    eventVerification.usedChecksum = sampleChecksum ? (sampleChecksum.slice(0, 16) + '...') : (sampleEvent?.signature?.checksum ? (sampleEvent.signature.checksum.slice(0,16)+'...') : 'none-in-body');
    try {
      const detail = verifyWompiSignatureDetailed(sampleEvent, sampleChecksum || sampleEvent?.signature?.checksum || '', testEventsKey);
      const info = eventsInfo; // from shared
      const anyDetail = detail as any;
      eventVerification = {
        ...eventVerification,
        matches: detail.ok,
        reason: detail.reason,
        signedPayload: detail.signedPayload,
        properties: detail.properties,
        receivedNormalizedPrefix: detail.receivedNormalized ? detail.receivedNormalized.slice(0, 16) + '...' : '',
        computedHexPrefix: detail.computedHex ? detail.computedHex.slice(0, 16) + '...' : '',
        keyPresent: detail.keyPresent,
        keyEnvHint: detail.keyEnvHint,
        hexLenMatch: detail.receivedHexLen === detail.computedHexLen,
        eventEnvironment: sampleEvent?.environment || null,
        eventType: sampleEvent?.event || null,
        reference: sampleEvent?.data?.transaction?.reference || null,
        transactionId: sampleEvent?.data?.transaction?.id || null,
        // New diagnostics from updated verification logic (properties + timestamp variant support)
        usedTimestampVariant: anyDetail.usedTimestampVariant || false,
        altSignedPayloadWithTimestamp: anyDetail.altSignedPayloadWithTimestamp || undefined,
        altComputedHexPrefix: anyDetail.altComputedHex ? String(anyDetail.altComputedHex).slice(0, 16) + '...' : undefined,
      };

      if (testEventsKey) {
        eventVerification.testedWithCustomKey = testEventsKey.slice(0, 12) + '...' + testEventsKey.slice(-4);
        if (detail.ok) {
          summary.recommendations.push('CUSTOM KEY TEST: The provided testEventsKey SUCCESSFULLY validated the sample event. Use this exact value as WOMPI_EVENTS_KEY in Vercel Production and redeploy.');
        } else {
          summary.recommendations.push('CUSTOM KEY TEST: The provided testEventsKey did NOT validate the sample event (HMAC mismatch). Try a different "Llave para eventos" from the Wompi dashboard for this public key.');
        }
      } else if (!detail.ok) {
        summary.recommendations.push('SAMPLE EVENT SIGNATURE FAILED — this real event does NOT validate with the current EVENTS_KEY for pub_prod_SZdbUpSGERKCIGAcJOaIax7ySu4w9tAN. Paste this exact full event JSON as sampleEvent + try your candidate "Llave para eventos" as testEventsKey until matches:true. Then set that exact value in Vercel Production as WOMPI_EVENTS_KEY and redeploy. The basic tester samples are only dummies — real events are the only proof.');
      } else {
        summary.recommendations.push('Sample event signature VERIFIED OK with the current EVENTS key (good).');
      }
    } catch (e: any) {
      eventVerification.error = e?.message || String(e);
    }
  } else if (sampleChecksum || sampleEvent) {
    eventVerification.note = 'sampleEvent must be a full webhook JSON body object; sampleChecksum optional (falls back to body.signature.checksum)';
  }

  if (sampleEvent) {
    summary.recommendations.push('TIP: To force-process this event (mark order Cancelled for ERROR/DECLINED, or confirm for APPROVED) even if signature currently fails, POST the same payload again with "replay": true (or "force": true). This is an admin-only recovery path.');
  }

  // Attach to summary
  (summary as any).eventVerification = eventVerification;
  (summary as any).eventsKeyInfo = eventsInfo;

  if (!eventsInfo.present) {
    summary.recommendations.push('WOMPI_EVENTS_KEY is MISSING — webhooks from Wompi will be rejected with 401 "Invalid signature". Add the key (Llave para eventos) and redeploy.');
  }
  if (eventsInfo.isSandboxInProd) {
    summary.recommendations.push('Using SANDBOX events key in production — live Wompi prod events will fail signature verification.');
  }
  if (eventsInfo.present && eventsInfo.envHint !== 'prod' && process.env.NODE_ENV === 'production') {
    summary.recommendations.push('Events key does not look like prod_events_... while running in production. For live payments use the production "Llave para eventos".');
  }

  // === Replay / Force process the sample event (admin recovery tool) ===
  // Useful when the live webhook is returning 401 because the EVENTS_KEY is not yet correct,
  // or to re-apply side effects for a specific transaction (e.g. the one in this report).
  let replayResult: any = { attempted: false };
  const shouldReplay = !!(sampleEvent && replayRequested);
  if (shouldReplay) {
    replayResult.attempted = true;
    const tx = sampleEvent?.data?.transaction;
    const ref = tx?.reference || '';
    const orderId = ref.replace(/^order_/, '');
    const status = tx?.status;
    const txId = tx?.id;

    replayResult.orderId = orderId || null;
    replayResult.wompiTransactionId = txId || null;
    replayResult.status = status || null;

    if (!orderId) {
      replayResult.error = 'Could not extract orderId from reference (expected order_<uuid>)';
    } else {
      try {
        if (status === 'APPROVED') {
          const confirmRes = await confirmWompiPayment(orderId, {
            wompiTransactionId: txId,
            wompiStatus: status,
            amount: tx?.amount_in_cents ? tx.amount_in_cents / 100 : undefined,
            reference: ref,
          });
          replayResult.action = 'confirmed';
          replayResult.confirmResult = confirmRes;
          replayResult.success = confirmRes.success;
        } else if (['DECLINED', 'ERROR', 'VOIDED'].includes(status)) {
          await prisma.order.update({
            where: { id: orderId },
            data: { status: 'Cancelled', updatedAt: new Date() },
          }).catch(() => {});

          await logAuditEvent({
            performedById: (session?.user as any)?.id || null,
            action: `PAYMENT_${status}_REPLAY`,
            targetType: 'Order',
            targetId: orderId,
            details: {
              wompiTransactionId: txId,
              status,
              amount: tx?.amount_in_cents ? tx.amount_in_cents / 100 : undefined,
              reference: ref,
              replayedVia: 'admin/wompi/test',
              originalStatusMessage: tx?.status_message || null,
            },
          }).catch(() => {});

          replayResult.action = 'marked_cancelled';
          replayResult.success = true;
        } else {
          replayResult.action = 'acknowledged_no_change';
          replayResult.success = true;
        }

        replayResult.message = `Processed ${status} for order ${orderId} (replay)`;
      } catch (e: any) {
        replayResult.error = e?.message || String(e);
        replayResult.success = false;
      }
    }

    if (replayResult.success) {
      summary.recommendations.push(`REPLAY DONE: order ${orderId} was processed for status ${status}. Check the order page and audit log.`);
    }
  }

  (summary as any).replayResult = replayResult;

  devLog('[Wompi][test] self-test result', { pubLooks, integLooks, queryOk: query.ok, mismatch: keyMismatch, events: eventsInfo });

  return NextResponse.json({ success: true, summary });
}
