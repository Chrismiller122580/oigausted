'use client';

import { useSession } from 'next-auth/react';
import { UserX, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Global banner shown whenever an admin is impersonating another user.
 * Visible on top of buyer/seller/admin/public layouts.
 * Clicking "Stop" restores the original admin identity via session.update().
 */
export default function ImpersonationBanner() {
  const { data: session, update, status } = useSession();

  if (status !== 'authenticated') return null;

  const user = session?.user as any;
  if (!user?.impersonatorId) return null;

  const displayName = user.name || user.email || 'this user';
  const roleLabel = user.role ? `(${user.role})` : '';

  const handleStopImpersonation = async () => {
    try {
      await update({ stopImpersonation: true });
    } catch (e) {
      // Even if update has a hiccup, a reload will pick up the cleared token state on next jwt resolution
    }
    // Full reload ensures all server components, server actions, and cached sessions see the real admin again.
    window.location.reload();
  };

  return (
    <div className="sticky top-0 z-[60] w-full bg-amber-500 text-amber-950 shadow-md">
      <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between gap-3 text-sm font-medium">
        <div className="flex items-center gap-2 min-w-0">
          <AlertTriangle className="h-4 w-4 flex-shrink-0" />
          <span className="truncate">
            <strong>IMPERSONATION ACTIVE</strong> — You are viewing &amp; acting as{' '}
            <span className="font-semibold underline decoration-amber-800/60">{displayName}</span>{' '}
            {roleLabel}
          </span>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <Button
            onClick={handleStopImpersonation}
            size="sm"
            variant="outline"
            className="border-amber-800 text-amber-950 hover:bg-amber-600 hover:text-white h-8 px-3 text-xs font-semibold"
          >
            <UserX className="mr-1.5 h-3.5 w-3.5" />
            Stop impersonating &amp; return to admin
          </Button>
        </div>
      </div>
    </div>
  );
}
