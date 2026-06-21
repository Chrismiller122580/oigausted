import { NextRequest, NextResponse } from 'next/server';
import { requireAdminFromDb } from '@/lib/admin-auth';
import { authOptions } from '@/lib/auth';
import { devLog } from '@/lib/utils';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { logAuditEvent } from '@/lib/audit';
import { confirmWompiPayment } from '@/lib/server/confirm-wompi-payment';
import {
  getEventsKeyInfo,
  verifyWompiSignatureDetailed,
  type VerifyResult,
} from '@/lib/wompi-signature';
import type { WompiWebhookEvent } from '@/types/wompi';
import { OrderStatusLabel, labelToPrismaStatus } from '@/lib/order-status';

interface WompiTestRequestBody {
  sampleWebhookEvent?: WompiWebhookEvent;
  sampleEvent?: WompiWebhookEvent;
  sampleChecksum?: string;
  checksum?: string;
  replay?: boolean;
  force?: boolean;
  process?: boolean;
  testEventsKey?: string;
  customEventsKey?: string;
}

interface WompiQueryResult {
  attempted: boolean;
  base?: string;
  usedPrivate?: boolean;
  status?: number;
  ok?: boolean;
  dataEmpty?: boolean;
  sampleResponseKeys?: string[];
  error?: string;
  skipped?: string;
}

interface WompiEventVerification {
  attempted: boolean;
  usedChecksum?: string;
  matches?: boolean;
  reason?: string;
  signedPayload?: string;
  computed?: string;
  receivedChecksum?: string;
  eventEnvironment?: string | null;
  eventType?: string | null;
  reference?: string | null;
  transactionId?: string | null;
  keyEnvHint?: VerifyResult['keyEnvHint'];
  usedKeyAppendedVariant?: boolean;
  testedWithCustomKey?: string;
  error?: string;
  note?: string;
}

interface WompiReplayResult {
  attempted: boolean;
  orderId?: string | null;
  wompiTransactionId?: string | null;
  status?: string | null;
  action?: string;
  confirmResult?: unknown;
  success?: boolean;
  error?: string;
  message?: string;
}

interface WompiTestSummary {
  publicKeyPrefix: string;
  integrityKeyPrefix: string;
  eventsKeyPrefix: string;
  privateKeyPrefix: string;
  environments: { public: string; integrity: string; events: string; private: string };
  integrityPubMismatch: boolean;
  sampleSignature: string | null;
  sampleSignatureNote: string;
  sampleEventsSignature: string | null;
  sampleEventsSignatureNote: string;
  query: WompiQueryResult;
  recommendations: string[];
  eventVerification?: WompiEventVerification;
  eventsKeyInfo?: ReturnType<typeof getEventsKeyInfo>;
  replayResult?: WompiReplayResult;
}

function errMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

export async function POST(req: NextRequest) {
  const session = await requireAdminFromDb();
  if (!session) {
    return NextResponse.json({ error: 'Admin only' }, { status: 403 });
  }

  let sampleEvent: WompiWebhookEvent | null = null;
  let sampleChecksum = '';
  let replayRequested = false;
  let testEventsKey: string | undefined = undefined;
  let parsedRequestBody: WompiTestRequestBody = {};
  try {
    parsedRequestBody = await req.json().catch(() => ({})) as WompiTestRequestBody;
    if (parsedRequestBody && (parsedRequestBody.sampleWebhookEvent || parsedRequestBody.sampleEvent)) {
      sampleEvent = parsedRequestBody.sampleWebhookEvent || parsedRequestBody.sampleEvent || null;
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

  const eventsInfo = getEventsKeyInfo();
  const events = (process.env.WOMPI_EVENTS_KEY || process.env.WOMPI_EVENTS_SECRET || '');
  const eventsLooks = events ? (events.match(/(test|prod)_events/i)?.[1] || 'unknown') : 'missing';

  let sampleSig: string | null = null;
  let sampleNote = 'no integrity key';
  if (integ) {
    try {
      const sampleRef = 'order_test_123';
      const sampleCents = 12345;
      const sampleCur = 'COP';
      const toSign = `${sampleRef}${sampleCents}${sampleCur}${integ}`;
      sampleSig = crypto.createHash('sha256').update(toSign).digest('hex');
      sampleNote = 'computed successfully (SHA256 of ref + cents + COP + secret)';
    } catch (e: unknown) {
      sampleNote = 'SHA256 failed: ' + errMessage(e);
    }
  }

  let sampleEventsSig: string | null = null;
  let sampleEventsNote = 'no events key';
  if (events) {
    try {
      const sampleProps = ['transaction.id', 'transaction.status', 'transaction.amount_in_cents'];
      const sampleTx = { id: 'tx_test_999', status: 'APPROVED', amount_in_cents: 100000 };
      const sampleTimestamp = '1530291411';
      const signedPayload = sampleProps.map(p => {
        if (p === 'transaction.id') return sampleTx.id;
        if (p === 'transaction.status') return sampleTx.status;
        if (p === 'transaction.amount_in_cents') return String(sampleTx.amount_in_cents);
        return '';
      }).join('') + sampleTimestamp + events;
      sampleEventsSig = crypto.createHash('sha256').update(signedPayload).digest('hex');
      sampleEventsNote = `computed successfully (SHA256 of properties + timestamp + eventsKey)`;
    } catch (e: unknown) {
      sampleEventsNote = 'SHA256 failed: ' + errMessage(e);
    }
  }

  const query: WompiQueryResult = { attempted: false };
  const token = priv || pub;
  const isSandbox = /test|sandbox|_test_/i.test(pub);
  const base = isSandbox ? 'https://sandbox.wompi.co' : 'https://production.wompi.co';

  if (token) {
    query.attempted = true;
    query.base = base;
    query.usedPrivate = !!priv;
    try {
      const url = `${base}/v1/transactions?reference=${encodeURIComponent('order_wompi_selftest_' + Date.now())}`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      query.status = res.status;
      const body = await res.json().catch(() => ({})) as { data?: unknown[]; error?: { reason?: string; message?: string } | string };
      query.ok = res.ok;
      query.dataEmpty = Array.isArray(body?.data) ? body.data.length === 0 : !body?.data;
      query.sampleResponseKeys = body ? Object.keys(body).slice(0, 6) : [];
      if (!res.ok) {
        const errBody = body?.error;
        const errText = typeof errBody === 'object' && errBody
          ? (errBody.reason || errBody.message || 'unknown')
          : (errBody || await res.text().catch(() => 'unknown'));
        query.error = String(errText).slice(0, 200);
      }
    } catch (e: unknown) {
      query.error = errMessage(e);
    }
  } else {
    query.skipped = 'no token';
  }

  const summary: WompiTestSummary = {
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
    recommendations: [],
  };

  if (!pub) summary.recommendations.push('Set NEXT_PUBLIC_WOMPI_PUBLIC_KEY (pub_test_ or pub_prod_)');
  if (!integ) summary.recommendations.push('Set WOMPI_INTEGRITY_KEY (the "Llave de integridad" matching the public key)');
  if (keyMismatch) summary.recommendations.push('INTEGRITY_KEY environment does not match PUBLIC key (test vs prod). This is the #1 cause of "La firma es inválida".');
  if (!priv) summary.recommendations.push('Add WOMPI_PRIVATE_KEY (prv_...) for reliable transaction lookups in the order debugger "Consultar".');
  if (query.attempted && !query.ok) summary.recommendations.push('Wompi API query failed — verify the private (or public) key is valid for the chosen environment (sandbox vs production) and that the key belongs to the merchant of the public key.');
  if (query.ok) summary.recommendations.push('Query to Wompi API succeeded — keys look usable for status checks.');

  let eventVerification: WompiEventVerification = { attempted: false };
  if (sampleEvent && typeof sampleEvent === 'object') {
    eventVerification.attempted = true;
    eventVerification.usedChecksum = sampleChecksum ? (sampleChecksum.slice(0, 16) + '...') : (sampleEvent?.signature?.checksum ? (sampleEvent.signature.checksum.slice(0,16)+'...') : 'none-in-body');
    try {
      const eventsKeyForTest = testEventsKey || (process.env.WOMPI_EVENTS_KEY || process.env.WOMPI_EVENTS_SECRET || '');
      const detailed = verifyWompiSignatureDetailed(sampleEvent, sampleChecksum || sampleEvent?.signature?.checksum || '', eventsKeyForTest || undefined);
      eventVerification = {
        ...eventVerification,
        matches: detailed.ok,
        reason: detailed.ok ? 'ok (SHA256 of properties+timestamp+eventsKey)' : 'Checksum mismatch',
        signedPayload: detailed.signedPayload,
        computed: detailed.computedHex,
        receivedChecksum: detailed.receivedNormalized,
        eventEnvironment: sampleEvent?.environment || null,
        eventType: sampleEvent?.event || null,
        reference: sampleEvent?.data?.transaction?.reference || null,
        transactionId: sampleEvent?.data?.transaction?.id || null,
        keyEnvHint: detailed.keyEnvHint,
        usedKeyAppendedVariant: detailed.usedKeyAppendedVariant,
      };

      if (testEventsKey) {
        eventVerification.testedWithCustomKey = testEventsKey.slice(0, 12) + '...' + testEventsKey.slice(-4);
        if (eventVerification.matches) {
          summary.recommendations.push('CUSTOM KEY TEST: The provided testEventsKey SUCCESSFULLY validated the sample event. Use this exact value as WOMPI_EVENTS_KEY in Vercel Production and redeploy.');
        } else {
          summary.recommendations.push('CUSTOM KEY TEST: The provided testEventsKey did NOT validate the sample event (checksum mismatch). Try a different "Llave para eventos" from the Wompi dashboard for this public key.');
        }
      } else if (!eventVerification.matches) {
        summary.recommendations.push(`SAMPLE EVENT SIGNATURE FAILED — this real event does NOT validate with the current EVENTS_KEY for ${process.env.NEXT_PUBLIC_WOMPI_PUBLIC_KEY || 'this pub key'}. Paste this exact full event JSON as sampleEvent + try your candidate "Llave para eventos" as testEventsKey until matches:true. Then set that exact value in Vercel Production as WOMPI_EVENTS_KEY and redeploy. The basic tester samples are only dummies — real events are the only proof.`);
      } else {
        summary.recommendations.push('Sample event signature VERIFIED OK with the current EVENTS key (good).');
      }
    } catch (e: unknown) {
      eventVerification.error = errMessage(e);
    }
  } else if (sampleChecksum || sampleEvent) {
    eventVerification.note = 'sampleEvent must be a full webhook JSON body object; sampleChecksum optional (falls back to body.signature.checksum)';
  }

  if (sampleEvent) {
    summary.recommendations.push('TIP: To force-process this event (mark order Cancelled for ERROR/DECLINED, or confirm for APPROVED) even if signature currently fails, POST the same payload again with "replay": true (or "force": true). This is an admin-only recovery path.');
  }

  summary.eventVerification = eventVerification;
  summary.eventsKeyInfo = eventsInfo;

  if (!eventsInfo.present) {
    summary.recommendations.push('WOMPI_EVENTS_KEY is MISSING — webhooks from Wompi will be rejected with 401 "Invalid signature". Add the key (Llave para eventos) and redeploy.');
  }
  if (eventsInfo.isSandboxInProd) {
    summary.recommendations.push('Using SANDBOX events key in production — live Wompi prod events will fail signature verification.');
  }
  if (eventsInfo.present && eventsInfo.envHint !== 'prod' && process.env.NODE_ENV === 'production') {
    summary.recommendations.push('Events key does not look like prod_events_... while running in production. For live payments use the production "Llave para eventos".');
  }

  const replayResult: WompiReplayResult = { attempted: false };
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
        } else if (['DECLINED', 'ERROR', 'VOIDED'].includes(status || '')) {
          await prisma.order.update({
            where: { id: orderId },
            data: { status: labelToPrismaStatus(OrderStatusLabel.Cancelled), updatedAt: new Date() },
          }).catch(() => {});

          await logAuditEvent({
            performedById: session?.user?.id || null,
            action: `PAYMENT_${status}_REPLAY`,
            targetType: 'Order',
            targetId: orderId,
            details: {
              wompiTransactionId: txId ?? null,
              status: status ?? null,
              amount: tx?.amount_in_cents ? tx.amount_in_cents / 100 : null,
              reference: ref ?? null,
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
      } catch (e: unknown) {
        replayResult.error = errMessage(e);
        replayResult.success = false;
      }
    }

    if (replayResult.success) {
      summary.recommendations.push(`REPLAY DONE: order ${orderId} was processed for status ${status}. Check the order page and audit log.`);
    }
  }

  summary.replayResult = replayResult;

  devLog('[Wompi][test] self-test result', { pubLooks, integLooks, queryOk: query.ok, mismatch: keyMismatch, events: eventsInfo });

  return NextResponse.json({ success: true, summary });
}