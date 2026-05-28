/**
 * Returns a safe callback URL for NextAuth signIn calls.
 *
 * In development (especially Codespaces, ngrok, StackBlitz, etc.),
 * this prefers the current browser origin. This protects against
 * stale or incorrect NEXTAUTH_URL values pulled from Vercel.
 *
 * In production, it returns a relative path and lets NextAuth + the
 * server's NEXTAUTH_URL handle the full redirect.
 */
export function getAuthCallbackUrl(fallbackPath = '/'): string {
  const path = fallbackPath.startsWith('/') ? fallbackPath : `/${fallbackPath}`;

  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    // Development: trust the current browser origin
    return `${window.location.origin}${path}`;
  }

  // Production / SSR: use relative path (NextAuth will use NEXTAUTH_URL from env)
  return path;
}
