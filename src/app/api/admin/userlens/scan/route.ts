import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { logAuditEvent } from '@/lib/audit';
import { saveUserLensReport } from '@/lib/userlens/reports-store';
import { validateScanUrl } from '@/lib/userlens/resolve-scan-url';
import {
  classifyUserLensScanError,
  getUserLensScanMode,
  getUserLensScanSupport,
} from '@/lib/userlens/runtime';
import type { LighthouseCategory, UserLensScanRequest, UserLensViewport } from '@/types/userlens';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const VALID_CATEGORIES: LighthouseCategory[] = [
  'performance',
  'accessibility',
  'best-practices',
  'seo',
];

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return NextResponse.json(getUserLensScanSupport());
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: UserLensScanRequest;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (!body?.url || typeof body.url !== 'string') {
    return NextResponse.json({ error: 'url is required' }, { status: 400 });
  }

  try {
    validateScanUrl(body.url);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Invalid URL';
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const viewport: UserLensViewport = body.viewport === 'mobile' ? 'mobile' : 'desktop';
  const categories = Array.isArray(body.categories)
    ? body.categories.filter((c): c is LighthouseCategory =>
        VALID_CATEGORIES.includes(c as LighthouseCategory),
      )
    : VALID_CATEGORIES;

  const scanMode = getUserLensScanMode();
  const scanRequest = {
    url: body.url,
    viewport,
    categories: categories.length ? categories : VALID_CATEGORIES,
    forceRefresh: body.forceRefresh === true,
  };

  try {
    let result;
    let fromCache = false;
    let reportId: string | null = null;
    let fixItemCount = 0;

    if (scanMode === 'remote') {
      const { runRemoteUserLensScan } = await import('@/lib/userlens/remote-scanner');
      result = await runRemoteUserLensScan(scanRequest);
    } else if (scanMode === 'psi') {
      const { runUserLensPsiScan } = await import('@/lib/userlens/psi-scanner');
      const outcome = await runUserLensPsiScan(scanRequest);
      result = outcome.result;
      fromCache = outcome.fromCache;
      reportId = outcome.reportId ?? null;
      fixItemCount = outcome.fixItemCount ?? 0;
    } else {
      const { runUserLensScan } = await import('@/lib/userlens/scanner');
      result = await runUserLensScan(scanRequest);
    }

    if (!fromCache) {
      try {
        const saved = await saveUserLensReport(result, session.user.id);
        reportId = saved.reportId;
        fixItemCount = saved.fixItemCount;
      } catch (saveErr) {
        console.error('UserLens: failed to persist report', saveErr);
      }
    }

    await logAuditEvent({
      performedById: session.user.id,
      action: 'USERLENS_SCAN',
      targetType: 'url',
      targetId: result.url,
      details: {
        reportId,
        fixItemCount,
        scanMode,
        finalUrl: result.finalUrl,
        viewport: result.viewport,
        loadTimeMs: result.loadTimeMs,
        axeViolations: result.axe.violationCount,
        lighthouseScores:
          result.lighthouse?.categories.map((c) => ({
            id: c.id,
            score: c.score,
          })) ?? null,
        warnings: result.warnings,
      },
      ipAddress: req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null,
      userAgent: req.headers.get('user-agent'),
    });

    return NextResponse.json({ ...result, reportId, fixItemCount, scanMode, fromCache });
  } catch (err) {
    console.error('UserLens scan failed:', err);
    const { status, message } = classifyUserLensScanError(err);

    return NextResponse.json({ error: message }, { status });
  }
}