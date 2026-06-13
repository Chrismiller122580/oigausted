import { NextRequest, NextResponse } from 'next/server';
// @ts-ignore
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { devLog } from '@/lib/utils';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const isAdmin = (session?.user as any)?.role === 'admin';
  if (!isAdmin) {
    return NextResponse.json({ error: 'Admin only' }, { status: 403 });
  }

  const pub = process.env.NEXT_PUBLIC_WOMPI_PUBLIC_KEY || '';
  const integ = process.env.WOMPI_INTEGRITY_KEY || process.env.WOMPI_INTEGRITY_SECRET || '';
  const events = process.env.WOMPI_EVENTS_KEY || process.env.WOMPI_EVENTS_SECRET || '';
  const priv = process.env.WOMPI_PRIVATE_KEY || '';

  const pubLooks = pub.match(/pub_(test|prod)/i)?.[1] || 'unknown';
  const integLooks = integ.match(/(test|prod)_integrity/i)?.[1] || (integ ? 'unknown' : 'missing');
  const eventsLooks = events.match(/(test|prod)_events/i)?.[1] || (events ? 'unknown' : 'missing');
  const privLooks = priv.match(/prv_(test|prod)/i)?.[1] || (priv ? 'unknown' : 'missing');

  const keyMismatch = integ && pub ? (/prod/i.test(pub) !== /prod/i.test(integ)) : false;

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
    query,
    recommendations: [] as string[],
  };

  if (!pub) summary.recommendations.push('Set NEXT_PUBLIC_WOMPI_PUBLIC_KEY (pub_test_ or pub_prod_)');
  if (!integ) summary.recommendations.push('Set WOMPI_INTEGRITY_KEY (the "Llave de integridad" matching the public key)');
  if (keyMismatch) summary.recommendations.push('INTEGRITY_KEY environment does not match PUBLIC key (test vs prod). This is the #1 cause of "La firma es inválida".');
  if (!priv) summary.recommendations.push('Add WOMPI_PRIVATE_KEY (prv_...) for reliable transaction lookups in the order debugger "Consultar".');
  if (query.attempted && !query.ok) summary.recommendations.push('Wompi API query failed — verify the private (or public) key is valid for the chosen environment (sandbox vs production) and that the key belongs to the merchant of the public key.');
  if (query.ok) summary.recommendations.push('Query to Wompi API succeeded — keys look usable for status checks.');

  devLog('[Wompi][test] self-test result', { pubLooks, integLooks, queryOk: query.ok, mismatch: keyMismatch });

  return NextResponse.json({ success: true, summary });
}
