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
  if (process.env.USERLENS_SCAN_MODE === 'psi') return 'psi';
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
        'PageSpeed Insights mode (set USERLENS_SCAN_MODE=playwright for full Playwright scans). Public URLs only.',
    };
  }

  const onVercel = process.env.VERCEL === '1';
  return {
    supported: true,
    mode,
    hint: onVercel
      ? 'Full browser scan on Vercel via Playwright + @sparticuz/chromium. Scan public URLs like https://oigagig.com.'
      : 'Full browser scan with Playwright, Lighthouse, and axe-core.',
  };
}

export function classifyUserLensScanError(err: unknown): {
  status: number;
  message: string;
} {
  const message = err instanceof Error ? err.message : 'Scan failed';
  const lower = message.toLowerCase();

  if (lower.includes('cloud scans require a public url')) {
    return {
      status: 400,
      message:
        'Cloud scans require a public URL (e.g. https://oigagig.com). Localhost and private networks are not reachable from Vercel.',
    };
  }

  const isEnvironmentLimited =
    lower.includes("executable doesn't exist") ||
    lower.includes('browsers.json') ||
    lower.includes('failed to load external module playwright') ||
    lower.includes('browserType.launch') ||
    lower.includes('spawn enoent') ||
    lower.includes('failed to launch') ||
    lower.includes('no browser binary found') ||
    lower.includes('playwright browsers are not installed') ||
    lower.includes('task timed out after') ||
    lower.includes('timed out after 60 seconds') ||
    lower.includes('function_invocation_timeout') ||
    (lower.includes('timeout') && lower.includes('exceeded'));

  if (isEnvironmentLimited) {
    const onVercel = process.env.VERCEL === '1';
    const isChromiumPackFailure =
      lower.includes('failed to load chromium from') ||
      lower.includes('cannot resolve chromium-pack.tar');

    let hint =
      'Locally run: npm install (installs Chromium via postinstall) or npx playwright install chromium';
    if (onVercel || isChromiumPackFailure) {
      hint =
        'On Vercel, redeploy after these changes. Build must run node scripts/chromium-pack.mjs. Scan public URLs only (e.g. https://oigagig.com). Optional env: CHROMIUM_PACK_URL=https://oigagig.com/chromium-pack.tar';
    }
    return {
      status: 503,
      message: `Browser launch failed on this server. ${hint}`,
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