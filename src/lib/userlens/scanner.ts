import type {
  LighthouseCategory,
  UserLensScanRequest,
  UserLensScanResult,
  UserLensViewport,
  AxeViolation,
  LighthouseCategoryScore,
} from '@/types/userlens';
import { resolveScanTarget } from '@/lib/userlens/resolve-scan-url';

const SCAN_TIMEOUT_MS = 45_000;
const DEBUG_PORT = 9222;

let cachedAxeSource: string | null = null;

const CATEGORY_TITLES: Record<LighthouseCategory, string> = {
  performance: 'Performance',
  accessibility: 'Accessibility',
  'best-practices': 'Best Practices',
  seo: 'SEO',
};

const VIEWPORTS: Record<UserLensViewport, { width: number; height: number }> = {
  desktop: { width: 1280, height: 720 },
  mobile: { width: 390, height: 844 },
};

export function validateScanUrl(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) throw new Error('URL is required');

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    throw new Error('Invalid URL format');
  }

  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw new Error('Only http and https URLs are allowed');
  }

  return parsed.toString();
}

function addRedirectWarnings(requestedUrl: string, finalUrl: string, warnings: string[]) {
  try {
    const requested = new URL(requestedUrl);
    const final = new URL(finalUrl);

    const sameOrigin = requested.origin === final.origin;
    const samePath = requested.pathname === final.pathname;

    if (!sameOrigin || !samePath) {
      warnings.push(
        `Redirected from ${requested.host}${requested.pathname} → ${final.host}${final.pathname}. Lighthouse scores reflect the final page.`,
      );
    }

    if (
      /\/login(?:\?|$)/i.test(final.pathname) ||
      /github\.com\/login|accounts\.google\.com/i.test(final.host + final.pathname)
    ) {
      warnings.push(
        'Final URL is a login/auth page. To audit your app, scan a public URL like http://localhost:3000 (homepage) or a page that does not require sign-in.',
      );
    }
  } catch {
    // ignore malformed URLs in warning helper
  }
}

async function getAxeSource(): Promise<string> {
  if (cachedAxeSource) return cachedAxeSource;

  const mod = await import('axe-core');
  const axe = (mod as { default?: { source?: string } }).default ?? mod;
  const source = (axe as { source?: string }).source;
  if (!source) {
    throw new Error('axe-core did not expose injectable source');
  }

  cachedAxeSource = source;
  return source;
}

function extractLighthouseCategories(
  lhr: Record<string, unknown>,
  categories: LighthouseCategory[],
): LighthouseCategoryScore[] {
  const lhCategories = (lhr.categories ?? {}) as Record<
    string,
    { id: string; title: string; score: number | null }
  >;
  const audits = (lhr.audits ?? {}) as Record<
    string,
    {
      id: string;
      title: string;
      description: string;
      score: number | null;
      scoreDisplayMode?: string;
      displayValue?: string;
    }
  >;

  return categories.map((id) => {
    const cat = lhCategories[id] as
      | { title?: string; score?: number | null; auditRefs?: Array<{ id: string }> }
      | undefined;
    const auditIds = new Set((cat?.auditRefs ?? []).map((ref) => ref.id));
    const failedAudits = Object.values(audits)
      .filter((audit) => {
        if (!auditIds.has(audit.id) || audit.score == null) return false;
        if (audit.scoreDisplayMode === 'notApplicable' || audit.scoreDisplayMode === 'manual') {
          return false;
        }
        if (audit.scoreDisplayMode === 'binary') return audit.score === 0;
        return audit.score < 0.9;
      })
      .slice(0, 8)
      .map((audit) => ({
        id: audit.id,
        title: audit.title,
        description: audit.description,
        displayValue: audit.displayValue,
      }));

    return {
      id,
      title: CATEGORY_TITLES[id] ?? cat?.title ?? id,
      score: cat?.score != null ? Math.round(cat.score * 100) : null,
      failedAudits,
    };
  });
}

function extractMetrics(lhr: Record<string, unknown>) {
  const audits = (lhr.audits ?? {}) as Record<string, { displayValue?: string }>;
  return {
    firstContentfulPaint: audits['first-contentful-paint']?.displayValue,
    largestContentfulPaint: audits['largest-contentful-paint']?.displayValue,
    totalBlockingTime: audits['total-blocking-time']?.displayValue,
    cumulativeLayoutShift: audits['cumulative-layout-shift']?.displayValue,
    speedIndex: audits['speed-index']?.displayValue,
  };
}

function mapAxeViolations(raw: Array<Record<string, unknown>>): AxeViolation[] {
  return raw.map((v) => ({
    id: String(v.id ?? ''),
    impact: (v.impact as AxeViolation['impact']) ?? null,
    description: String(v.description ?? ''),
    help: String(v.help ?? ''),
    helpUrl: String(v.helpUrl ?? ''),
    nodes: Array.isArray(v.nodes) ? v.nodes.length : 0,
    targets: Array.isArray(v.nodes)
      ? (v.nodes as Array<{ target?: string[] }>)
          .map((n) => n.target?.join(' > ') ?? '')
          .filter(Boolean)
          .slice(0, 3)
      : [],
  }));
}

export async function runUserLensScan(
  request: UserLensScanRequest,
): Promise<UserLensScanResult> {
  const url = validateScanUrl(request.url);
  const { scanUrl, rewritten } = resolveScanTarget(url);
  const viewport = request.viewport ?? 'desktop';
  const categories = request.categories ?? [
    'performance',
    'accessibility',
    'best-practices',
    'seo',
  ];
  const warnings: string[] = [];

  if (rewritten) {
    warnings.push(
      `Codespaces URL rewritten for server-side scan: ${url} → ${scanUrl}. Playwright runs without your browser session, so public github.dev URLs redirect to GitHub login.`,
    );
  }

  const { chromium } = await import('playwright');
  const axeSource = await getAxeSource();

  const browser = await chromium.launch({
    headless: true,
    args: [`--remote-debugging-port=${DEBUG_PORT}`, '--no-sandbox'],
  });

  try {
    const context = await browser.newContext({
      viewport: VIEWPORTS[viewport],
      // Allow injecting axe-core on sites with strict CSP (e.g. github.com)
      bypassCSP: true,
      userAgent:
        viewport === 'mobile'
          ? 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
          : undefined,
    });

    // Skip first-visit overlays so audits measure page content, not modals/banners.
    await context.addInitScript(() => {
      localStorage.setItem('homepage-welcome-seen', '1');
      localStorage.setItem('analytics_consent', 'essential');
    });

    const page = await context.newPage();

    const navStart = Date.now();
    const response = await page.goto(scanUrl, {
      waitUntil: 'load',
      timeout: SCAN_TIMEOUT_MS,
    });
    await page.waitForTimeout(1000);
    const loadTimeMs = Date.now() - navStart;

    const finalUrl = page.url();
    const title = await page.title();
    addRedirectWarnings(scanUrl, finalUrl, warnings);

    let screenshotBase64: string | null = null;
    try {
      const buffer = await page.screenshot({ type: 'jpeg', quality: 72, fullPage: false });
      screenshotBase64 = buffer.toString('base64');
    } catch {
      warnings.push('Screenshot capture failed');
    }

    try {
      await page.addScriptTag({ content: axeSource });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'axe injection failed';
      warnings.push(`axe-core injection blocked: ${message}`);
    }

    const axeRaw = await page.evaluate(async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const axe = (window as any).axe;
      if (!axe?.run) return null;
      return axe.run(document, {
        runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] },
      });
    });

    const axeResults = axeRaw as {
      violations?: Array<Record<string, unknown>>;
      incomplete?: unknown[];
      passes?: unknown[];
    } | null;

    if (!axeResults) {
      warnings.push('axe-core did not load; accessibility scan skipped');
    }

    let lighthouseResult: UserLensScanResult['lighthouse'] = null;
    try {
      const lighthouse = (await import('lighthouse')).default;
      const runnerResult = await lighthouse(
        finalUrl,
        {
          port: DEBUG_PORT,
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

      if (runnerResult?.lhr) {
        const lhr = runnerResult.lhr as unknown as Record<string, unknown>;
        lighthouseResult = {
          categories: extractLighthouseCategories(lhr, categories),
          metrics: extractMetrics(lhr),
        };
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Lighthouse audit failed';
      warnings.push(`Lighthouse: ${message}`);
    }

    if (!response) {
      warnings.push('Page navigation returned no response');
    }

    return {
      url,
      ...(rewritten ? { scanUrl } : {}),
      finalUrl,
      title,
      viewport,
      scannedAt: new Date().toISOString(),
      loadTimeMs,
      screenshotBase64,
      lighthouse: lighthouseResult,
      axe: {
        violationCount: axeResults?.violations?.length ?? 0,
        incompleteCount: axeResults?.incomplete?.length ?? 0,
        passes: axeResults?.passes?.length ?? 0,
        violations: mapAxeViolations(axeResults?.violations ?? []),
      },
      warnings,
    };
  } finally {
    await browser.close();
  }
}