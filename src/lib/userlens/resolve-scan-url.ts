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