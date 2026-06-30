import '@/lib/userlens/server-only';
import fs from 'fs';
import path from 'path';

export type UserLensScanMode = 'playwright' | 'psi' | 'remote';

export interface UserLensScanSupport {
  supported: boolean;
  mode: UserLensScanMode;
  reason?: string;
  hint?: string;
  runtime?: {
    vercel: boolean;
    arch: string;
    chromiumBinBundled: boolean;
    psiKeyConfigured?: boolean;
  };
}

export function getUserLensScanMode(): UserLensScanMode {
  if (process.env.USERLENS_REMOTE_SCANNER_URL?.trim()) return 'remote';
  if (process.env.USERLENS_SCAN_MODE === 'psi') return 'psi';
  return 'playwright';
}

export function getUserLensScanSupport(): UserLensScanSupport {
  const mode = getUserLensScanMode();
  const onVercel = process.env.VERCEL === '1';
  const chromiumBinBundled = getServerlessBinCandidates().some((candidate) => fs.existsSync(candidate));

  if (mode === 'remote') {
    return {
      supported: true,
      mode,
      hint: 'Full browser scan via remote scanner service.',
      runtime: { vercel: onVercel, arch: process.arch, chromiumBinBundled },
    };
  }

  if (mode === 'psi') {
    return {
      supported: true,
      mode,
      hint:
        'PageSpeed Insights mode (set USERLENS_SCAN_MODE=playwright for full Playwright scans). Public URLs only.',
      runtime: { vercel: onVercel, arch: process.arch, chromiumBinBundled },
    };
  }

  const psiKeyConfigured = !!(
    process.env.PAGESPEED_INSIGHTS_API_KEY?.trim() ||
    process.env.GOOGLE_PAGESPEED_API_KEY?.trim() ||
    process.env.PSI_API_KEY?.trim()
  );

  return {
    supported: true,
    mode,
    hint: onVercel
      ? psiKeyConfigured
        ? 'Hybrid Vercel scan: Playwright + axe + screenshot; Lighthouse via your PageSpeed API key with in-process fallback.'
        : 'Hybrid Vercel scan: Playwright + axe + screenshot; Lighthouse via in-process audit (add PAGESPEED_INSIGHTS_API_KEY in Vercel to avoid shared PSI quota).'
      : 'Full browser scan with Playwright, Lighthouse, and axe-core.',
    runtime: { vercel: onVercel, arch: process.arch, chromiumBinBundled, psiKeyConfigured },
  };
}

function getServerlessBinCandidates(): string[] {
  const cwd = process.cwd();
  return [
    path.join(cwd, 'node_modules/@sparticuz/chromium/bin'),
    '/var/task/node_modules/@sparticuz/chromium/bin',
  ];
}

export function classifyUserLensScanError(err: unknown): {
  status: number;
  message: string;
  detail: string;
} {
  const detail = err instanceof Error ? err.message : 'Scan failed';
  const lower = detail.toLowerCase();

  if (lower.includes('cloud scans require a public url')) {
    return {
      status: 400,
      detail,
      message:
        'Cloud scans require a public URL (e.g. https://oigagig.com). Localhost and private networks are not reachable from Vercel.',
    };
  }

  const isTimeout =
    lower.includes('function_invocation_timeout') ||
    lower.includes('task timed out after') ||
    lower.includes('timed out after 60 seconds') ||
    lower.includes('timed out after 120 seconds') ||
    lower.includes('timed out after 300 seconds') ||
    (lower.includes('timeout') &&
      lower.includes('exceeded') &&
      !lower.includes('browsertype.launch'));

  if (isTimeout) {
    return {
      status: 504,
      detail,
      message:
        'Scan timed out on Vercel. Warm starts are faster — try again, or scan a lighter public URL like https://oigagig.com.',
    };
  }

  const isBrowserLaunch =
    lower.includes('browsertype.launch') ||
    lower.includes('failed to launch') ||
    lower.includes("executable doesn't exist") ||
    lower.includes('the input directory') ||
    lower.includes('spawn enoent') ||
    lower.includes('no browser binary found') ||
    lower.includes('failed to load chromium') ||
    lower.includes('playwright browsers are not installed') ||
    lower.includes('userdata dir parameter');

  if (isBrowserLaunch) {
    const onVercel = process.env.VERCEL === '1';
    const launchTimedOut =
      lower.includes('browsertype.launch') &&
      lower.includes('timeout') &&
      lower.includes('exceeded');
    const hint = onVercel
      ? launchTimedOut
        ? 'Chromium cold start timed out on Vercel. Retry once (warm /tmp cache is faster), or set USERLENS_SCAN_MODE=psi for a no-browser Lighthouse-only scan.'
        : 'Vercel scan failed to start Chromium. Ensure the deployment includes @sparticuz/chromium/bin and scan public URLs only (https://oigagig.com).'
      : 'Locally run: npm install or npx playwright install chromium';

    return {
      status: 503,
      detail,
      message: `Browser launch failed on this server. ${hint}`,
    };
  }

  if (
    lower.includes('rate limit') ||
    lower.includes('quota exceeded') ||
    lower.includes('queries per day')
  ) {
    return { status: 503, detail, message: detail };
  }

  return { status: 500, detail, message: detail };
}