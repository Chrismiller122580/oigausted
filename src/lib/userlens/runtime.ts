import '@/lib/userlens/server-only';

export interface UserLensScanSupport {
  supported: boolean;
  reason?: string;
  hint?: string;
}

/** Playwright + Lighthouse require a full Chromium binary — not available on Vercel serverless. */
export function getUserLensScanSupport(): UserLensScanSupport {
  if (process.env.USERLENS_REMOTE_SCANNER_URL?.trim()) {
    return { supported: true };
  }

  if (process.env.VERCEL === '1') {
    return {
      supported: false,
      reason: 'UserLens scans cannot run on Vercel serverless functions.',
      hint:
        'Start the app locally or in Codespaces (`npm run dev`), open /admin/userlens, and scan https://oigagig.com or your forwarded Codespaces URL.',
    };
  }

  return { supported: true };
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
    const support = getUserLensScanSupport();
    return {
      status: 503,
      message: support.supported
        ? 'Playwright browsers are not installed on this server. Run: npx playwright install chromium'
        : [support.reason, support.hint].filter(Boolean).join(' '),
    };
  }

  return { status: 500, message };
}