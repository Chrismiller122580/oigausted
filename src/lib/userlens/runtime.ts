import '@/lib/userlens/server-only';

export type UserLensScanMode = 'playwright' | 'psi' | 'remote';

export interface UserLensScanSupport {
  supported: boolean;
  mode: UserLensScanMode;
  reason?: string;
  hint?: string;
}

export function getUserLensScanMode(): UserLensScanMode {
  if (process.env.USERLENS_REMOTE_SCANNER_URL?.trim()) return 'remote';
  if (process.env.VERCEL === '1') return 'psi';
  return 'playwright';
}

export function getUserLensScanSupport(): UserLensScanSupport {
  const mode = getUserLensScanMode();

  if (mode === 'remote') {
    return {
      supported: true,
      mode,
      hint: 'Full browser scan via remote scanner service.',
    };
  }

  if (mode === 'psi') {
    return {
      supported: true,
      mode,
      hint:
        'Cloud scan via Google PageSpeed Insights. Recent scans are cached to save quota. Add PAGESPEED_INSIGHTS_API_KEY in Vercel for your own GCP quota.',
    };
  }

  return {
    supported: true,
    mode,
    hint: 'Full browser scan with Playwright, Lighthouse, and axe-core.',
  };
}

export function classifyUserLensScanError(err: unknown): {
  status: number;
  message: string;
} {
  const message = err instanceof Error ? err.message : 'Scan failed';
  const lower = message.toLowerCase();

  const isEnvironmentLimited =
    lower.includes("executable doesn't exist") ||
    lower.includes('browsers.json') ||
    lower.includes('failed to load external module playwright') ||
    lower.includes('browserType.launch') ||
    lower.includes('spawn enoent') ||
    lower.includes('failed to launch') ||
    lower.includes('playwright browsers are not installed') ||
    lower.includes('task timed out after') ||
    lower.includes('timed out after 60 seconds') ||
    lower.includes('function_invocation_timeout') ||
    (lower.includes('timeout') && lower.includes('exceeded'));

  if (isEnvironmentLimited) {
    return {
      status: 503,
      message:
        'Playwright browsers are not installed on this server. Run: npx playwright install chromium',
    };
  }

  if (
    lower.includes('rate limit') ||
    lower.includes('quota exceeded') ||
    lower.includes('queries per day')
  ) {
    return { status: 503, message };
  }

  return { status: 500, message };
}