'use client';

import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';

/** True when the current user is in the analytics panel (read-only marketing). */
export function useAnalyticsViewOnly(): boolean {
  const pathname = usePathname();
  const { data: session } = useSession();
  return (
    pathname.startsWith('/analytics') ||
    session?.user?.staffRole === 'analytics'
  );
}