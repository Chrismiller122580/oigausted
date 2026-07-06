'use client';

import { useCallback, useEffect, useState } from 'react';

export interface AdminStatsSnapshot {
  users?: number;
  sellers?: number;
  gigs?: number;
  activeGigs?: number;
  orders?: number;
  completedOrders?: number;
  totalRevenue?: number;
  platformRevenue?: number;
  onlineUsers?: number;
}

export function useAdminStats(pollMs = 10000) {
  const [stats, setStats] = useState<AdminStatsSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchStats = useCallback(async (background = false) => {
    if (!background) setLoading(true);
    try {
      const res = await fetch('/api/admin/stats');
      if (!res.ok) return;
      const data = await res.json();
      setStats(data);
      setLastUpdated(new Date());
      return data as AdminStatsSnapshot;
    } catch {
      return null;
    } finally {
      if (!background) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    if (!pollMs) return;
    const iv = setInterval(() => fetchStats(true), pollMs);
    return () => clearInterval(iv);
  }, [fetchStats, pollMs]);

  return { stats, loading, lastUpdated, refresh: () => fetchStats() };
}