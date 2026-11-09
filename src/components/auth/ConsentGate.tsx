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

    if (
      pathname.startsWith('/consent') ||
      pathname.startsWith('/login') ||
      pathname.startsWith('/signup') ||
      pathname.startsWith('/api/') ||
      pathname.startsWith('/privacy') ||
      pathname.startsWith('/terms') ||
      pathname.startsWith('/forgot-password') ||
      pathname.startsWith('/reset-password')
    ) {
      return;
    }

    let cancelled = false;

    (async () => {
      for (let attempt = 0; attempt < 3; attempt++) {
        if (cancelled) return;
        try {
          const res = await fetch('/api/auth/consent', {
            method: 'GET',
            cache: 'no-store',
            credentials: 'include',
          });
          if (cancelled) return;
          if (!res.ok) {
            if (attempt < 2) {
              await new Promise((r) => setTimeout(r, 400));
              continue;
            }
            router.replace(`/consent?callbackUrl=${encodeURIComponent(pathname)}`);
            return;
          }
          const data = await res.json();
          if (data?.needsConsent && !cancelled) {
            const callback = encodeURIComponent(pathname + (window.location.search || ''));
            router.replace(`/consent?callbackUrl=${callback}`);
          }
          return;
        } catch {
          if (attempt < 2) {
            await new Promise((r) => setTimeout(r, 400));
            continue;
          }
          if (!cancelled) {
            router.replace(`/consent?callbackUrl=${encodeURIComponent(pathname)}`);
          }
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [status, session, pathname, router]);

  return null;
}
