import { Capacitor, registerPlugin } from '@capacitor/core';
import { isCapacitorNative } from '@/lib/capacitor-native';

export type AdminStatsSnapshot = {
  onlineUsers?: number;
  users?: number;
  orders?: number;
  completedOrders?: number;
  totalRevenue?: number;
};

export type AdminWidgetPayload = {
  onlineUsers: number;
  users: number;
  orders: number;
  completedOrders: number;
  totalRevenue: number;
  updatedAt: string;
};

interface AdminWidgetPlugin {
  updateStats(options: AdminWidgetPayload): Promise<void>;
}

const AdminWidget = registerPlugin<AdminWidgetPlugin>('AdminWidget');

export function buildAdminWidgetPayload(stats: AdminStatsSnapshot): AdminWidgetPayload {
  return {
    onlineUsers: stats.onlineUsers ?? 0,
    users: stats.users ?? 0,
    orders: stats.orders ?? 0,
    completedOrders: stats.completedOrders ?? 0,
    totalRevenue: stats.totalRevenue ?? 0,
    updatedAt: new Date().toISOString(),
  };
}

function isValidStats(stats: AdminStatsSnapshot): boolean {
  return typeof stats.users === 'number' || typeof stats.onlineUsers === 'number';
}

/** Push latest admin stats to the Android home-screen widget (no-op on web/iOS). */
export async function syncAdminStatsToNativeWidget(stats: AdminStatsSnapshot): Promise<void> {
  if (!isCapacitorNative() || Capacitor.getPlatform() !== 'android') return;
  if (!isValidStats(stats)) return;

  try {
    await AdminWidget.updateStats(buildAdminWidgetPayload(stats));
  } catch (err) {
    console.warn('[AdminWidget] native updateStats failed:', err);
  }
}