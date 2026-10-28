'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

/**
 * Runs inside SessionProvider. If the logged-in user has not yet given
 * express data-processing consent, redirect them to /consent.
 * Skips the consent page itself and auth pages to avoid loops.
 */
export default function ConsentGate() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (status !== 'authenticated' || !session?.user) return;
    if (!pathname) return;

    // Do not interrupt the consent page or pure auth screens
    if (
      pathname.startsWith('/consent') ||
      pathname.startsWith('/login') ||
      pathname.startsWith('/signup') ||
      pathname.startsWith('/api/') ||
      pathname.startsWith('/privacy') ||
      pathname.startsWith('/terms')
    ) {
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const res = await fetch('/api/auth/consent', { method: 'GET' });
        if (!res.ok || cancelled) return;
        const data = await res.json();
        if (data?.needsConsent && !cancelled) {
          const callback = encodeURIComponent(pathname + (window.location.search || ''));
          router.replace(`/consent?callbackUrl=${callback}`);
        }
      } catch {
        // Non-blocking: do not trap the user if the check fails
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [status, session, pathname, router]);

  return null;
}
