import '@/lib/userlens/server-only';
import type { LighthouseCategory, UserLensScanResult, UserLensViewport } from '@/types/userlens';
import { USERLENS_DEBUG_PORT } from '@/lib/userlens/browser';
import { extractLighthouseCategories, extractLighthouseMetrics } from '@/lib/userlens/lighthouse-parse';
import { findCachedLighthouseScores } from '@/lib/userlens/reports-store';
import {
  fetchPsiLighthouseScores,
  hasPsiApiKey,
  isPsiQuotaExceeded,
} from '@/lib/userlens/psi-scanner';

const STALE_CACHE_HOURS = 24 * 7;

async function runInProcessLighthouse(
  pageUrl: string,
  viewport: UserLensViewport,
  categories: LighthouseCategory[],
): Promise<NonNullable<UserLensScanResult['lighthouse']>> {
  const lighthouse = (await import('lighthouse')).default;
  const runnerResult = await lighthouse(
    pageUrl,
    {
      port: USERLENS_DEBUG_PORT,
      output: 'json',
      logLevel: 'error',
      onlyCategories: categories,
      formFactor: viewport === 'mobile' ? 'mobile' : 'desktop',
      screenEmulation:
        viewport === 'mobile'
          ? { mobile: true, width: 390, height: 844, deviceScaleFactor: 2, disabled: false }
          : { mobile: false, width: 1280, height: 720, deviceScaleFactor: 1, disabled: false },
    },
    undefined,
  );

  if (!runnerResult?.lhr) {
    throw new Error('Lighthouse returned no results');
  }

  const lhr = runnerResult.lhr as unknown as Record<string, unknown>;
  return {
    categories: extractLighthouseCategories(lhr, categories),
    metrics: extractLighthouseMetrics(lhr),
  };
}

function quotaHelpMessage(): string {
  return hasPsiApiKey()
    ? 'PageSpeed Insights quota exceeded for your API key. Wait for midnight Pacific reset or use a new GCP project key.'
    : 'Add PAGESPEED_INSIGHTS_API_KEY in Vercel (free GCP project) to avoid shared Google quota limits.';
}

/**
 * Resolve Lighthouse scores on Vercel with fallbacks:
 * 1. In-process Lighthouse (no API quota) when no PSI key, else PSI first when key is set
 * 2. Alternate provider on failure
 * 3. Cached scores from recent UserLens reports (up to 7 days)
 */
export async function resolveServerlessLighthouseScores(
  lookupUrl: string,
  pageUrl: string,
  viewport: UserLensViewport,
  categories: LighthouseCategory[],
  warnings: string[],
): Promise<NonNullable<UserLensScanResult['lighthouse']> | null> {
  const attempts: Array<{ label: string; run: () => Promise<NonNullable<UserLensScanResult['lighthouse']>> }> = [
    {
      label: 'in-process Lighthouse',
      run: () => runInProcessLighthouse(pageUrl, viewport, categories),
    },
    {
      label: 'PageSpeed Insights',
      run: () => fetchPsiLighthouseScores(pageUrl, viewport, categories),
    },
  ];

  let lastError = '';

  for (const attempt of attempts) {
    try {
      return await attempt.run();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Lighthouse failed';
      lastError = message;
      if (isPsiQuotaExceeded(message)) {
        warnings.push(`Lighthouse (${attempt.label}): quota exceeded — trying fallback.`);
        continue;
      }
      warnings.push(`Lighthouse (${attempt.label}): ${message}`);
    }
  }

  const cached = await findCachedLighthouseScores(lookupUrl, viewport, STALE_CACHE_HOURS);
  if (cached) {
    const scannedAt = new Date(cached.scannedAt).toLocaleString();
    warnings.push(`Lighthouse scores from cached scan (${scannedAt}). ${quotaHelpMessage()}`);
    return cached.lighthouse;
  }

  warnings.push(`Lighthouse: ${lastError || 'All Lighthouse providers failed'}. ${quotaHelpMessage()}`);
  return null;
}

/** Local dev: in-process Lighthouse via Playwright debug port. */
export async function resolveLocalLighthouseScores(
  pageUrl: string,
  viewport: UserLensViewport,
  categories: LighthouseCategory[],
  warnings: string[],
): Promise<NonNullable<UserLensScanResult['lighthouse']> | null> {
  try {
    return await runInProcessLighthouse(pageUrl, viewport, categories);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Lighthouse audit failed';
    warnings.push(`Lighthouse: ${message}`);
    return null;
  }
}