'use client';

import { useCallback, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { syncAdminStatsToNativeWidget } from '@/lib/admin-widget-bridge';
import { isCapacitorNative } from '@/lib/capacitor-native';
import { Capacitor } from '@capacitor/core';

function canSyncWidget(role?: string | null, staffRole?: string | null): boolean {
  return role === 'admin' || staffRole === 'admin_assistant';
}

/**
 * Headless sync: pushes admin stats to the Android home-screen widget.
 * Runs for full admins and admin-assistant staff inside the mobile app.
 */
export default function AdminWidgetSync() {
  const { data: session, status } = useSession();

  const pushStats = useCallback(async () => {
    if (!isCapacitorNative() || Capacitor.getPlatform() !== 'android') return;
    if (!canSyncWidget(session?.user?.role, session?.user?.staffRole)) return;

    try {
      const res = await fetch('/api/admin/widget-stats', { credentials: 'include' });
      if (!res.ok) {
        console.warn('[AdminWidget] stats fetch failed:', res.status);
        return;
      }
      const data = await res.json();
      if (typeof data?.users !== 'number') {
        console.warn('[AdminWidget] invalid stats payload');
        return;
      }
      await syncAdminStatsToNativeWidget(data);
    } catch (err) {
      console.warn('[AdminWidget] sync failed:', err);
    }
  }, [session?.user?.role, session?.user?.staffRole]);

  useEffect(() => {
    if (status !== 'authenticated') return;
    if (!canSyncWidget(session?.user?.role, session?.user?.staffRole)) return;

    void pushStats();
    const interval = setInterval(() => void pushStats(), 15000);
    return () => clearInterval(interval);
  }, [status, session?.user?.role, session?.user?.staffRole, pushStats]);

  useEffect(() => {
    if (!isCapacitorNative() || status !== 'authenticated') return;

    let remove: (() => void) | undefined;

    void import('@capacitor/app').then(({ App }) => {
      void App.addListener('appStateChange', ({ isActive }) => {
        if (isActive) void pushStats();
      }).then((handle) => {
        remove = () => void handle.remove();
      });
    });

    return () => remove?.();
  }, [status, pushStats]);

  return null;
}