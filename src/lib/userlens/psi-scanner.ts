import '@/lib/userlens/server-only';
import type { LighthouseCategory, UserLensScanRequest, UserLensScanResult } from '@/types/userlens';
import { extractLighthouseCategories, extractLighthouseMetrics } from '@/lib/userlens/lighthouse-parse';
import { findCachedPsiScan } from '@/lib/userlens/reports-store';
import { assertPublicScanUrl, validateScanUrl } from '@/lib/userlens/resolve-scan-url';

const PSI_ENDPOINT = 'https://pagespeedonline.googleapis.com/pagespeedonline/v5/runPagespeed';
const PSI_TIMEOUT_MS = 55_000;
const DEFAULT_CACHE_HOURS = 12;
const STALE_CACHE_HOURS = 24 * 7;

const PSI_CATEGORY: Record<LighthouseCategory, string> = {
  performance: 'PERFORMANCE',
  accessibility: 'ACCESSIBILITY',
  'best-practices': 'BEST_PRACTICES',
  seo: 'SEO',
};

export interface UserLensPsiScanOutcome {
  result: UserLensScanResult;
  fromCache: boolean;
  reportId?: string;
  fixItemCount?: number;
}

function getPsiApiKey(): string | undefined {
  return (
    process.env.PAGESPEED_INSIGHTS_API_KEY?.trim() ||
    process.env.GOOGLE_PAGESPEED_API_KEY?.trim() ||
    process.env.PSI_API_KEY?.trim() ||
    undefined
  );
}

function getPsiCacheHours(): number {
  const raw = process.env.USERLENS_PSI_CACHE_HOURS?.trim();
  const parsed = raw ? Number(raw) : DEFAULT_CACHE_HOURS;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_CACHE_HOURS;
}

function isQuotaExceeded(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes('quota exceeded') ||
    lower.includes('rate limit') ||
    lower.includes('queries per day')
  );
}

function formatQuotaError(): string {
  const hasKey = !!getPsiApiKey();
  return hasKey
    ? 'Google PageSpeed Insights daily quota exceeded for your API key. Cached scans are returned when available; otherwise wait for the quota reset (midnight Pacific) or create a new GCP project + API key.'
    : 'Google PageSpeed Insights daily quota exceeded. Add your own PAGESPEED_INSIGHTS_API_KEY in Vercel (free GCP project), or wait for the quota reset (midnight Pacific). Cached scans are returned when available.';
}

function withCacheWarning(
  result: UserLensScanResult,
  message: string,
): UserLensScanResult {
  const warnings = result.warnings.filter(
    (warning) => !warning.startsWith('Returned cached scan') && !warning.startsWith('Google PSI daily quota'),
  );

  return {
    ...result,
    warnings: [message, ...warnings],
  };
}

async function fetchPsiScan(
  url: string,
  viewport: UserLensScanRequest['viewport'],
  categories: LighthouseCategory[],
): Promise<UserLensScanResult> {
  const resolvedViewport = viewport ?? 'desktop';
  const warnings: string[] = [
    'Cloud scan via Google PageSpeed Insights (Lighthouse). Screenshots and axe DOM analysis are not available in this mode.',
  ];

  const apiKey = getPsiApiKey();
  if (!apiKey) {
    warnings.push(
      'No PAGESPEED_INSIGHTS_API_KEY configured — sharing Google public quota, which is very limited.',
    );
  }

  const params = new URLSearchParams({ url, strategy: resolvedViewport });
  for (const category of categories) {
    params.append('category', PSI_CATEGORY[category]);
  }
  if (apiKey) params.set('key', apiKey);

  const startedAt = Date.now();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), PSI_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(`${PSI_ENDPOINT}?${params.toString()}`, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    });
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error('PageSpeed Insights timed out. Try again or scan fewer categories.');
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }

  const payload = (await response.json().catch(() => null)) as {
    error?: { message?: string };
    lighthouseResult?: Record<string, unknown>;
  } | null;

  if (!response.ok) {
    const apiMessage = payload?.error?.message || `PageSpeed Insights request failed (${response.status})`;
    if (response.status === 429 || isQuotaExceeded(apiMessage)) {
      throw new Error(formatQuotaError());
    }
    throw new Error(apiMessage);
  }

  const lhr = payload?.lighthouseResult;
  if (!lhr) {
    throw new Error('PageSpeed Insights returned no Lighthouse data for this URL.');
  }

  const finalUrl = String(lhr.finalUrl ?? lhr.finalDisplayedUrl ?? url);
  const title = String(lhr.finalDisplayedUrl ?? finalUrl);
  const timing = lhr.timing as { total?: number } | undefined;
  const loadTimeMs = timing?.total ?? Date.now() - startedAt;

  if (finalUrl !== url) {
    warnings.push(`Final URL after redirects: ${finalUrl}`);
  }

  return {
    url,
    finalUrl,
    title,
    viewport: resolvedViewport,
    scannedAt: new Date().toISOString(),
    loadTimeMs,
    screenshotBase64: null,
    lighthouse: {
      categories: extractLighthouseCategories(lhr, categories),
      metrics: extractLighthouseMetrics(lhr),
    },
    axe: {
      violationCount: 0,
      incompleteCount: 0,
      passes: 0,
      violations: [],
    },
    warnings,
  };
}

export async function runUserLensPsiScan(
  request: UserLensScanRequest,
): Promise<UserLensPsiScanOutcome> {
  const url = validateScanUrl(request.url);
  assertPublicScanUrl(url);

  const viewport = request.viewport ?? 'desktop';
  const categories = request.categories ?? [
    'performance',
    'accessibility',
    'best-practices',
    'seo',
  ];

  if (!request.forceRefresh) {
    const cached = await findCachedPsiScan(url, viewport, getPsiCacheHours());
    if (cached) {
      const scannedAt = new Date(cached.result.scannedAt).toLocaleString();
      return {
        fromCache: true,
        reportId: cached.reportId,
        fixItemCount: cached.fixItemCount,
        result: withCacheWarning(
          cached.result,
          `Returned cached scan from ${scannedAt} to conserve PageSpeed Insights quota.`,
        ),
      };
    }
  }

  try {
    const result = await fetchPsiScan(url, viewport, categories);
    return { fromCache: false, result };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Scan failed';
    if (!isQuotaExceeded(message)) throw err;

    const stale = await findCachedPsiScan(url, viewport, STALE_CACHE_HOURS);
    if (stale) {
      const scannedAt = new Date(stale.result.scannedAt).toLocaleString();
      return {
        fromCache: true,
        reportId: stale.reportId,
        fixItemCount: stale.fixItemCount,
        result: withCacheWarning(
          stale.result,
          `Google PSI daily quota exceeded — showing last saved scan from ${scannedAt}.`,
        ),
      };
    }

    throw new Error(message);
  }
}