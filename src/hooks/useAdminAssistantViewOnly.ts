'use client';

import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';

/** True when the current user is in the admin-assistant panel (read-only ops). */
export function useAdminAssistantViewOnly(): boolean {
  const pathname = usePathname();
  const { data: session } = useSession();
  return (
    pathname.startsWith('/admin-assistant') ||
    session?.user?.staffRole === 'admin_assistant'
  );
}