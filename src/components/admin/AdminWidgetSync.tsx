'use client';

import { useCallback, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { syncAdminStatsToNativeWidget } from '@/lib/admin-widget-bridge';
import { isCapacitorNative } from '@/lib/capacitor-native';
import { Capacitor } from '@capacitor/core';

/**
 * Headless sync: pushes admin stats to the Android home-screen widget.
 * No UI — runs whenever an admin has the app open on any /admin/* page.
 */
export default function AdminWidgetSync() {
  const { data: session, status } = useSession();

  const pushStats = useCallback(async () => {
    if (!isCapacitorNative() || Capacitor.getPlatform() !== 'android') return;
    if (session?.user?.role !== 'admin') return;

    try {
      const res = await fetch('/api/admin/stats', { credentials: 'include' });
      if (!res.ok) return;
      const data = await res.json();
      if (typeof data?.users !== 'number') return;
      await syncAdminStatsToNativeWidget(data);
    } catch (err) {
      console.warn('[AdminWidget] sync failed:', err);
    }
  }, [session?.user?.role]);

  useEffect(() => {
    if (status !== 'authenticated') return;
    void pushStats();

    const interval = setInterval(() => void pushStats(), 15000);
    return () => clearInterval(interval);
  }, [status, pushStats]);

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