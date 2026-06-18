'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  RefreshCw,
  ExternalLink,
  Activity,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Globe,
  Zap,
  BarChart2,
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  ShoppingCart,
  Minus,
} from 'lucide-react';
import type {
  AdminAnalyticsPayload,
  DailyTrendPoint,
  FunnelStep,
  SummaryKpi,
} from '@/lib/admin-analytics';

function statusBadge(status: 'active' | 'configured' | 'missing') {
  if (status === 'active') {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
        <CheckCircle2 className="h-3.5 w-3.5" /> Active
      </span>
    );
  }
  if (status === 'configured') {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 dark:text-blue-400">
        <CheckCircle2 className="h-3.5 w-3.5" /> Configured
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600 dark:text-amber-400">
      <AlertCircle className="h-3.5 w-3.5" /> Not configured
    </span>
  );
}

function formatValue(value: number, format: SummaryKpi['format']): string {
  if (format === 'currency') return `$${Math.round(value).toLocaleString('es-CO')}`;
  if (format === 'percent') return `${value.toFixed(1)}%`;
  return value.toLocaleString('es-CO');
}

function ChangeBadge({ value }: { value: number | null }) {
  if (value == null) {
    return <span className="text-xs text-muted-foreground inline-flex items-center gap-0.5"><Minus className="h-3 w-3" /> n/a</span>;
  }
  const positive = value >= 0;
  const Icon = positive ? TrendingUp : TrendingDown;
  return (
    <span
      className={`text-xs font-medium inline-flex items-center gap-0.5 ${
        positive ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'
      }`}
    >
      <Icon className="h-3 w-3" />
      {positive ? '+' : ''}
      {value}%
    </span>
  );
}

function MiniBarChart({
  data,
  dataKey,
  color,
  label,
}: {
  data: DailyTrendPoint[];
  dataKey: keyof Pick<DailyTrendPoint, 'signups' | 'sellers' | 'gigs' | 'orders' | 'completedOrders' | 'revenue'>;
  color: string;
  label: string;
}) {
  const max = Math.max(...data.map((d) => d[dataKey] as number), 1);

  return (
    <Card className="bg-card border-border">
      <CardContent className="p-5">
        <h3 className="text-sm font-medium text-muted-foreground mb-1">{label}</h3>
        <p className="text-2xl font-bold tabular-nums mb-4">
          {dataKey === 'revenue'
            ? `$${Math.round(data.reduce((s, d) => s + d.revenue, 0)).toLocaleString('es-CO')}`
            : data.reduce((s, d) => s + (d[dataKey] as number), 0).toLocaleString('es-CO')}
          <span className="text-xs font-normal text-muted-foreground ml-2">30d total</span>
        </p>
        <div className="flex items-end gap-0.5 h-28">
          {data.map((d) => {
            const val = d[dataKey] as number;
            const h = max > 0 ? (val / max) * 100 : 0;
            const display =
              dataKey === 'revenue'
                ? `$${Math.round(val).toLocaleString('es-CO')}`
                : String(val);
            return (
              <div
                key={`${label}-${d.date}`}
                className={`flex-1 ${color} rounded-t-sm min-h-[2px] transition-all opacity-80 hover:opacity-100`}
                style={{ height: `${Math.max(h, val > 0 ? 8 : 2)}%` }}
                title={`${d.date}: ${display}`}
              />
            );
          })}
        </div>
        <div className="flex justify-between text-[10px] text-muted-foreground mt-2">
          <span>{data[0]?.date.slice(5)}</span>
          <span>{data[data.length - 1]?.date.slice(5)}</span>
        </div>
      </CardContent>
    </Card>
  );
}

function FunnelBar({ step, maxCount }: { step: FunnelStep; maxCount: number }) {
  const width = maxCount > 0 ? Math.max((step.count / maxCount) * 100, 4) : 4;

  return (
    <div className="space-y-2">
      <div className="flex items-start justify-between gap-4 text-sm">
        <div>
          <p className="font-medium">{step.label}</p>
          <p className="text-xs text-muted-foreground font-mono">{step.eventName}</p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-lg font-bold tabular-nums">{step.count.toLocaleString('es-CO')}</p>
          {step.conversionFromPrevious != null && (
            <p className="text-xs text-emerald-600 dark:text-emerald-400">
              {step.conversionFromPrevious}% step conv.
            </p>
          )}
          {step.overallFromSignup != null && step.id !== 'signup' && (
            <p className="text-xs text-muted-foreground">{step.overallFromSignup}% of signups</p>
          )}
        </div>
      </div>
      <div className="h-3 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-orange-500 to-orange-400 transition-all"
          style={{ width: `${width}%` }}
        />
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span>7d: {step.last7d.toLocaleString('es-CO')}</span>
        <span>30d: {step.last30d.toLocaleString('es-CO')}</span>
        {step.dropOffFromPrevious != null && (
          <span className="text-red-500/80">Drop-off: {step.dropOffFromPrevious}%</span>
        )}
      </div>
    </div>
  );
}

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<AdminAnalyticsPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/analytics');
      if (!res.ok) throw new Error('Error loading analytics');
      const json = await res.json();
      setData(json);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error loading analytics');
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const maxFunnel = data?.funnel?.length ? Math.max(...data.funnel.map((s) => s.count)) : 1;
  const maxWeeklyRevenue = data?.weeklyTrends?.length
    ? Math.max(...data.weeklyTrends.map((w) => w.revenue))
    : 1;

  return (
    <div className="bg-background text-foreground">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-5xl font-bold tracking-tight">Analytics</h1>
            <p className="text-muted-foreground mt-2 text-lg">
              Integrations, conversion funnel, growth trends, and platform health
            </p>
            {data?.siteUrl && (
              <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1.5">
                <Globe className="h-3.5 w-3.5" />
                {data.siteUrl}
                {data.generatedAt && (
                  <span className="ml-2">
                    · Updated {new Date(data.generatedAt).toLocaleString('es-CO')}
                  </span>
                )}
              </p>
            )}
          </div>
          <Button onClick={fetchAnalytics} disabled={loading} variant="outline" className="gap-2">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="animate-spin w-8 h-8 border-4 border-orange-600 border-t-transparent rounded-full mx-auto mb-4" />
              <p className="text-muted-foreground">Loading analytics...</p>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-destructive/10 border border-destructive text-destructive p-6 rounded-2xl mb-8">
            {error}
          </div>
        )}

        {!loading && data && (
          <>
            {/* Summary KPIs */}
            <section className="mb-10">
              <h2 className="text-xl font-semibold mb-4">Key metrics</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
                {data.summary.map((kpi) => (
                  <Card key={kpi.id} className="bg-card border-border">
                    <CardContent className="p-4">
                      <p className="text-xs text-muted-foreground mb-1">{kpi.label}</p>
                      <p className="text-2xl font-bold tabular-nums">
                        {formatValue(kpi.value, kpi.format)}
                      </p>
                      {kpi.hint && (
                        <p className="text-[10px] text-muted-foreground mt-1">{kpi.hint}</p>
                      )}
                      <div className="mt-3 pt-3 border-t border-border space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">7d</span>
                          <span className="font-medium tabular-nums">
                            {formatValue(kpi.periods.last7d, kpi.format)}
                          </span>
                        </div>
                        <div className="flex justify-between text-xs items-center">
                          <span className="text-muted-foreground">vs prev 7d</span>
                          <ChangeBadge value={kpi.periods.change7d} />
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">30d</span>
                          <span className="font-medium tabular-nums">
                            {formatValue(kpi.periods.last30d, kpi.format)}
                          </span>
                        </div>
                        <div className="flex justify-between text-xs items-center">
                          <span className="text-muted-foreground">vs prev 30d</span>
                          <ChangeBadge value={kpi.periods.change30d} />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>

            {/* Conversion rates + user breakdown */}
            <section className="mb-10 grid lg:grid-cols-2 gap-4">
              <Card className="bg-card border-border">
                <CardContent className="p-5">
                  <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Activity className="h-5 w-5 text-blue-500" />
                    Conversion rates
                  </h2>
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { label: 'Signup → completed', value: data.revenue.signupToCompletedRate },
                      { label: 'Checkout → payment', value: data.revenue.checkoutToPaymentRate },
                      { label: 'Payment → completed', value: data.revenue.paymentToCompletedRate },
                      { label: 'Order cancellation', value: data.revenue.cancellationRate },
                    ].map((item) => (
                      <div key={item.label} className="rounded-xl bg-muted/40 p-3">
                        <p className="text-xs text-muted-foreground">{item.label}</p>
                        <p className="text-xl font-bold tabular-nums mt-1">
                          {item.value != null ? `${item.value}%` : '—'}
                        </p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 pt-4 border-t border-border grid grid-cols-3 gap-3 text-sm">
                    <div>
                      <p className="text-muted-foreground text-xs">Revenue 7d</p>
                      <p className="font-bold tabular-nums">
                        ${Math.round(data.revenue.revenue7d).toLocaleString('es-CO')}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Revenue 30d</p>
                      <p className="font-bold tabular-nums">
                        ${Math.round(data.revenue.revenue30d).toLocaleString('es-CO')}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">AOV (7d)</p>
                      <p className="font-bold tabular-nums">
                        ${Math.round(data.revenue.avgOrderValue7d).toLocaleString('es-CO')}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card border-border">
                <CardContent className="p-5">
                  <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Users className="h-5 w-5 text-violet-500" />
                    User breakdown
                  </h2>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    {[
                      { label: 'Buyers', value: data.userBreakdown.buyers },
                      { label: 'Sellers', value: data.userBreakdown.sellers },
                      { label: 'Admins', value: data.userBreakdown.admins },
                      { label: 'Sellers with gigs', value: data.userBreakdown.sellersWithGigs },
                      { label: 'Buyers with orders', value: data.userBreakdown.buyersWithOrders },
                      { label: 'Repeat buyers', value: data.userBreakdown.repeatBuyers },
                    ].map((item) => (
                      <div key={item.label} className="flex justify-between py-1.5 border-b border-border/60">
                        <span className="text-muted-foreground">{item.label}</span>
                        <span className="font-semibold tabular-nums">{item.value.toLocaleString('es-CO')}</span>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-4">
                    Repeat buyer rate:{' '}
                    <span className="font-medium text-foreground">
                      {data.userBreakdown.repeatBuyerRate != null
                        ? `${data.userBreakdown.repeatBuyerRate}%`
                        : '—'}
                    </span>
                  </p>
                </CardContent>
              </Card>
            </section>

            {/* Order status */}
            <section className="mb-10">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <ShoppingCart className="h-5 w-5 text-orange-500" />
                Order status breakdown
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                {data.orderStatus.map((s) => (
                  <Card key={s.status} className="bg-card border-border">
                    <CardContent className="p-4">
                      <p className="text-xs text-muted-foreground">{s.label}</p>
                      <p className="text-2xl font-bold tabular-nums mt-1">{s.count.toLocaleString('es-CO')}</p>
                      <p className="text-xs text-muted-foreground mt-1">{s.share}% of all orders</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>

            {/* Integrations */}
            <section className="mb-10">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Zap className="h-5 w-5 text-orange-500" />
                Integrations
              </h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {data.integrations.map((integration) => (
                  <Card key={integration.id} className="bg-card border-border">
                    <CardContent className="p-5 flex flex-col h-full">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="font-semibold">{integration.name}</h3>
                        {statusBadge(integration.status)}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{integration.description}</p>
                      {integration.detail && (
                        <p className="text-xs font-mono text-muted-foreground mb-2 break-all">
                          {integration.detail}
                        </p>
                      )}
                      {integration.notes && (
                        <ul className="text-xs text-muted-foreground space-y-1 mb-3 flex-1">
                          {integration.notes.map((note) => (
                            <li key={note} className="flex gap-1.5">
                              <span className="text-orange-500">·</span>
                              {note}
                            </li>
                          ))}
                        </ul>
                      )}
                      {integration.dashboardUrl && (
                        <a
                          href={integration.dashboardUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-sm text-orange-600 hover:text-orange-500 font-medium"
                        >
                          Open dashboard
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>

            {/* Funnel + drop-offs */}
            <section className="mb-10 grid lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold flex items-center gap-2">
                    <BarChart2 className="h-5 w-5 text-blue-500" />
                    Conversion funnel
                  </h2>
                  <Link
                    href="/admin/reports"
                    className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
                  >
                    Revenue reports
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
                <Card className="bg-card border-border">
                  <CardContent className="p-6 space-y-6">
                    {data.funnel.map((step, i) => (
                      <div key={step.id}>
                        {i > 0 && (
                          <div className="flex justify-center py-1 text-muted-foreground">
                            <ArrowRight className="h-4 w-4 rotate-90" />
                          </div>
                        )}
                        <FunnelBar step={step} maxCount={maxFunnel} />
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>

              <div>
                <h2 className="text-xl font-semibold mb-4">Step drop-offs</h2>
                <Card className="bg-card border-border">
                  <CardContent className="p-0 overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border bg-muted/40 text-xs">
                          <th className="text-left p-3 font-medium">Transition</th>
                          <th className="text-right p-3 font-medium">Lost</th>
                          <th className="text-right p-3 font-medium">Drop</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.funnelDropOffs.map((d) => (
                          <tr key={`${d.fromLabel}-${d.toLabel}`} className="border-b border-border last:border-0">
                            <td className="p-3">
                              <span className="text-muted-foreground">{d.fromLabel}</span>
                              <ArrowRight className="inline h-3 w-3 mx-1" />
                              <span>{d.toLabel}</span>
                            </td>
                            <td className="p-3 text-right tabular-nums text-red-500">
                              {d.lost.toLocaleString('es-CO')}
                            </td>
                            <td className="p-3 text-right tabular-nums">
                              {d.dropOffRate != null ? `${d.dropOffRate}%` : '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </CardContent>
                </Card>
              </div>
            </section>

            {/* Top categories */}
            {data.topCategories.length > 0 && (
              <section className="mb-10">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-green-500" />
                  Top categories (completed orders)
                </h2>
                <Card className="bg-card border-border overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border bg-muted/40">
                          <th className="text-left p-4 font-medium">Category</th>
                          <th className="text-right p-4 font-medium">Orders</th>
                          <th className="text-right p-4 font-medium">Share</th>
                          <th className="text-right p-4 font-medium">Revenue</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.topCategories.map((cat) => (
                          <tr key={cat.category} className="border-b border-border last:border-0">
                            <td className="p-4 font-medium">{cat.category}</td>
                            <td className="p-4 text-right tabular-nums">{cat.orders.toLocaleString('es-CO')}</td>
                            <td className="p-4 text-right tabular-nums">{cat.share}%</td>
                            <td className="p-4 text-right tabular-nums font-medium">
                              ${Math.round(cat.revenue).toLocaleString('es-CO')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </section>
            )}

            {/* Daily trends */}
            <section className="mb-10">
              <h2 className="text-xl font-semibold mb-4">Daily trends (30 days)</h2>
              <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
                <MiniBarChart data={data.dailyTrends} dataKey="signups" color="bg-blue-500" label="Signups" />
                <MiniBarChart data={data.dailyTrends} dataKey="sellers" color="bg-violet-500" label="New sellers" />
                <MiniBarChart data={data.dailyTrends} dataKey="gigs" color="bg-cyan-500" label="Gigs created" />
                <MiniBarChart data={data.dailyTrends} dataKey="orders" color="bg-orange-500" label="Orders" />
                <MiniBarChart data={data.dailyTrends} dataKey="completedOrders" color="bg-emerald-500" label="Completed" />
                <MiniBarChart data={data.dailyTrends} dataKey="revenue" color="bg-green-600" label="Revenue" />
              </div>
            </section>

            {/* Weekly trends */}
            <section className="mb-10">
              <h2 className="text-xl font-semibold mb-4">Weekly rollup</h2>
              <Card className="bg-card border-border overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-muted/40">
                        <th className="text-left p-4 font-medium">Week starting</th>
                        <th className="text-right p-4 font-medium">Signups</th>
                        <th className="text-right p-4 font-medium">Orders</th>
                        <th className="text-right p-4 font-medium">Completed</th>
                        <th className="text-right p-4 font-medium">Revenue</th>
                        <th className="p-4 font-medium w-40">Revenue bar</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.weeklyTrends.map((week) => (
                        <tr key={week.weekStart} className="border-b border-border last:border-0">
                          <td className="p-4 font-mono text-xs">{week.weekStart}</td>
                          <td className="p-4 text-right tabular-nums">{week.signups}</td>
                          <td className="p-4 text-right tabular-nums">{week.orders}</td>
                          <td className="p-4 text-right tabular-nums">{week.completedOrders}</td>
                          <td className="p-4 text-right tabular-nums font-medium">
                            ${Math.round(week.revenue).toLocaleString('es-CO')}
                          </td>
                          <td className="p-4">
                            <div className="h-2 rounded-full bg-muted overflow-hidden">
                              <div
                                className="h-full bg-green-500 rounded-full"
                                style={{
                                  width: `${Math.max((week.revenue / maxWeeklyRevenue) * 100, week.revenue > 0 ? 4 : 0)}%`,
                                }}
                              />
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </section>

            {/* Recent activity */}
            <section className="mb-10 grid lg:grid-cols-2 gap-4">
              <div>
                <h2 className="text-xl font-semibold mb-4">Recent signups</h2>
                <Card className="bg-card border-border overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border bg-muted/40 text-xs">
                          <th className="text-left p-3 font-medium">User</th>
                          <th className="text-left p-3 font-medium">Role</th>
                          <th className="text-right p-3 font-medium">When</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.recentSignups.map((u) => (
                          <tr key={u.id} className="border-b border-border last:border-0">
                            <td className="p-3">
                              <p className="font-medium truncate max-w-[180px]">{u.name || u.email || '—'}</p>
                              {u.email && u.name && (
                                <p className="text-xs text-muted-foreground truncate max-w-[180px]">{u.email}</p>
                              )}
                            </td>
                            <td className="p-3 capitalize text-muted-foreground">{u.role}</td>
                            <td className="p-3 text-right text-xs text-muted-foreground whitespace-nowrap">
                              {new Date(u.createdAt).toLocaleString('es-CO')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </div>

              <div>
                <h2 className="text-xl font-semibold mb-4">Recent orders</h2>
                <Card className="bg-card border-border overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border bg-muted/40 text-xs">
                          <th className="text-left p-3 font-medium">Gig / buyer</th>
                          <th className="text-left p-3 font-medium">Status</th>
                          <th className="text-right p-3 font-medium">Price</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.recentOrders.map((o) => (
                          <tr key={o.id} className="border-b border-border last:border-0">
                            <td className="p-3">
                              <p className="font-medium truncate max-w-[180px]">{o.gigTitle || '—'}</p>
                              <p className="text-xs text-muted-foreground">{o.buyerName || '—'}</p>
                            </td>
                            <td className="p-3 text-muted-foreground">{o.status}</td>
                            <td className="p-3 text-right tabular-nums font-medium">
                              ${Math.round(o.price).toLocaleString('es-CO')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </div>
            </section>

            {/* Tracked events */}
            <section>
              <h2 className="text-xl font-semibold mb-4">Tracked events</h2>
              <Card className="bg-card border-border overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-muted/40">
                        <th className="text-left p-4 font-medium">Event</th>
                        <th className="text-left p-4 font-medium">Description</th>
                        <th className="text-left p-4 font-medium">Source</th>
                        <th className="text-left p-4 font-medium">Destinations</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.trackedEvents.map((event) => (
                        <tr key={event.name} className="border-b border-border last:border-0">
                          <td className="p-4 font-mono text-orange-600 dark:text-orange-400">
                            {event.name}
                          </td>
                          <td className="p-4 text-muted-foreground">{event.description}</td>
                          <td className="p-4 font-mono text-xs">{event.source}</td>
                          <td className="p-4 text-xs text-muted-foreground">{event.destinations}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </section>
          </>
        )}
      </div>
    </div>
  );
}