const CODESPACES_HOST_RE =
  /^(.+)-(\d+)\.(app\.github\.dev|githubpreview\.dev)$/i;

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

function isPrivateOrLocalHost(hostname: string): boolean {
  const host = hostname.toLowerCase();
  if (host === 'localhost' || host === '127.0.0.1' || host === '0.0.0.0' || host === '::1') {
    return true;
  }
  if (host.endsWith('.local')) return true;

  const ipv4 = host.match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/);
  if (!ipv4) return false;

  const a = Number(ipv4[1]);
  const b = Number(ipv4[2]);
  if (a === 10) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  return false;
}

/** Cloud scanners (PageSpeed Insights) can only reach publicly routable URLs. */
export function assertPublicScanUrl(input: string): void {
  const parsed = new URL(validateScanUrl(input));
  if (isPrivateOrLocalHost(parsed.hostname)) {
    throw new Error(
      'Cloud scans require a public URL (for example https://oigagig.com). Localhost and private networks are not reachable from Vercel.',
    );
  }
}

export interface ResolvedScanTarget {
  requestedUrl: string;
  scanUrl: string;
  rewritten: boolean;
}

/** Map Codespaces forwarded URLs to localhost so server-side Playwright can reach the dev server. */
export function resolveScanTarget(input: string): ResolvedScanTarget {
  const requestedUrl = input.trim();

  let parsed: URL;
  try {
    parsed = new URL(requestedUrl);
  } catch {
    return { requestedUrl, scanUrl: requestedUrl, rewritten: false };
  }

  const match = parsed.hostname.match(CODESPACES_HOST_RE);
  if (!match) {
    return { requestedUrl, scanUrl: requestedUrl, rewritten: false };
  }

  const port = match[2];
  const local = new URL(requestedUrl);
  local.protocol = 'http:';
  local.hostname = 'localhost';
  local.port = port;

  return {
    requestedUrl,
    scanUrl: local.toString(),
    rewritten: true,
  };
}

/** Default scan URL for the admin panel — localhost in Codespaces, otherwise the app origin. */
export function getDefaultScanUrl(origin: string): string {
  if (!origin) return 'http://localhost:3000';

  const withTrailingSlash = origin.endsWith('/') ? origin : `${origin}/`;
  const resolved = resolveScanTarget(withTrailingSlash);
  if (resolved.rewritten) return resolved.scanUrl;

  return origin;
}