'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { Activity, DollarSign, Package, Users, Zap } from 'lucide-react';
import { useAdminStats } from '@/hooks/useAdminStats';
import { syncAdminStatsToNativeWidget } from '@/lib/admin-widget-bridge';

function formatRevenue(value: number) {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}k`;
  return `$${value.toLocaleString('es-CO')}`;
}

type StatTileProps = {
  href: string;
  label: string;
  value: string;
  icon: React.ReactNode;
  accent?: string;
};

function StatTile({ href, label, value, icon, accent = 'text-foreground' }: StatTileProps) {
  return (
    <Link
      href={href}
      className="flex min-w-[5.5rem] flex-col rounded-xl border border-border bg-card px-3 py-2 hover:border-orange-400/60 hover:bg-muted/50 transition shrink-0"
    >
      <div className="flex items-center gap-1 text-[10px] uppercase tracking-wide text-muted-foreground">
        {icon}
        <span>{label}</span>
      </div>
      <p className={`mt-1 text-lg font-bold tabular-nums leading-none ${accent}`}>{value}</p>
    </Link>
  );
}

export default function AdminStatsWidget() {
  const { stats, loading, lastUpdated } = useAdminStats(15000);

  useEffect(() => {
    if (!stats) return;
    void syncAdminStatsToNativeWidget(stats);
  }, [stats]);

  if (loading && !stats) {
    return (
      <div className="border-b border-border bg-muted/30 px-4 py-2.5">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Activity size={14} className="animate-pulse" />
          Cargando métricas…
        </div>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="border-b border-border bg-gradient-to-r from-muted/40 via-background to-muted/40 px-4 py-2.5">
      <div className="flex items-center justify-between gap-3 mb-2">
        <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
          <Activity size={13} className="text-emerald-500" />
          Panel en vivo
          {lastUpdated && (
            <span className="text-[10px] opacity-70">
              · {lastUpdated.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </p>
        <Link href="/admin" className="text-[10px] text-orange-600 hover:underline shrink-0">
          Ver dashboard →
        </Link>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-0.5 -mx-1 px-1 scrollbar-none">
        <StatTile
          href="/admin/users?online=true"
          label="Online"
          value={(stats.onlineUsers ?? 0).toLocaleString('es-CO')}
          icon={<Zap size={11} className="text-emerald-500" />}
          accent="text-emerald-500"
        />
        <StatTile
          href="/admin/users"
          label="Usuarios"
          value={(stats.users ?? 0).toLocaleString('es-CO')}
          icon={<Users size={11} />}
        />
        <StatTile
          href="/admin/orders"
          label="Pedidos"
          value={(stats.orders ?? 0).toLocaleString('es-CO')}
          icon={<Package size={11} />}
        />
        <StatTile
          href="/admin/earnings"
          label="Ingresos"
          value={formatRevenue(stats.totalRevenue ?? 0)}
          icon={<DollarSign size={11} className="text-amber-500" />}
          accent="text-amber-600 dark:text-amber-400"
        />
      </div>
    </div>
  );
}