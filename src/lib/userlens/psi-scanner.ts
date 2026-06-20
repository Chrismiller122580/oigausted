import '@/lib/userlens/server-only';
import type { LighthouseCategory, UserLensScanRequest, UserLensScanResult } from '@/types/userlens';
import { extractLighthouseCategories, extractLighthouseMetrics } from '@/lib/userlens/lighthouse-parse';
import { assertPublicScanUrl, validateScanUrl } from '@/lib/userlens/resolve-scan-url';

const PSI_ENDPOINT = 'https://pagespeedonline.googleapis.com/pagespeedonline/v5/runPagespeed';
const PSI_TIMEOUT_MS = 55_000;

const PSI_CATEGORY: Record<LighthouseCategory, string> = {
  performance: 'PERFORMANCE',
  accessibility: 'ACCESSIBILITY',
  'best-practices': 'BEST_PRACTICES',
  seo: 'SEO',
};

function getPsiApiKey(): string | undefined {
  return (
    process.env.PAGESPEED_INSIGHTS_API_KEY?.trim() ||
    process.env.GOOGLE_PAGESPEED_API_KEY?.trim() ||
    process.env.PSI_API_KEY?.trim() ||
    undefined
  );
}

export async function runUserLensPsiScan(
  request: UserLensScanRequest,
): Promise<UserLensScanResult> {
  const url = validateScanUrl(request.url);
  assertPublicScanUrl(url);

  const viewport = request.viewport ?? 'desktop';
  const categories = request.categories ?? [
    'performance',
    'accessibility',
    'best-practices',
    'seo',
  ];
  const warnings: string[] = [
    'Cloud scan via Google PageSpeed Insights (Lighthouse). Screenshots and axe DOM analysis are not available in this mode.',
  ];

  const apiKey = getPsiApiKey();
  if (!apiKey) {
    warnings.push(
      'No PAGESPEED_INSIGHTS_API_KEY configured — using the public quota, which may rate-limit heavy use.',
    );
  }

  const params = new URLSearchParams({ url, strategy: viewport });
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
    const apiMessage = payload?.error?.message;
    if (response.status === 429) {
      throw new Error(
        apiMessage ||
          'PageSpeed Insights rate limit reached. Add PAGESPEED_INSIGHTS_API_KEY in Vercel env vars.',
      );
    }
    throw new Error(apiMessage || `PageSpeed Insights request failed (${response.status})`);
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
    viewport,
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