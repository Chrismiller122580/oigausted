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
} from 'lucide-react';
import type { AdminAnalyticsPayload, FunnelStep } from '@/lib/admin-analytics';

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

function FunnelBar({ step, maxCount }: { step: FunnelStep; maxCount: number }) {
  const width = maxCount > 0 ? Math.max((step.count / maxCount) * 100, 4) : 4;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-4 text-sm">
        <div>
          <p className="font-medium">{step.label}</p>
          <p className="text-xs text-muted-foreground font-mono">{step.eventName}</p>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold tabular-nums">{step.count.toLocaleString('es-CO')}</p>
          {step.conversionFromPrevious != null && (
            <p className="text-xs text-muted-foreground">{step.conversionFromPrevious}% from prev</p>
          )}
        </div>
      </div>
      <div className="h-3 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-orange-500 to-orange-400 transition-all"
          style={{ width: `${width}%` }}
        />
      </div>
      <div className="flex gap-4 text-xs text-muted-foreground">
        <span>7d: {step.last7d.toLocaleString('es-CO')}</span>
        <span>30d: {step.last30d.toLocaleString('es-CO')}</span>
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
  const maxDailyOrders = data?.dailyTrends?.length
    ? Math.max(...data.dailyTrends.map((d) => d.orders))
    : 1;
  const maxDailySignups = data?.dailyTrends?.length
    ? Math.max(...data.dailyTrends.map((d) => d.signups))
    : 1;

  return (
    <div className="bg-background text-foreground">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-5xl font-bold tracking-tight">Analytics</h1>
            <p className="text-muted-foreground mt-2 text-lg">
              Web analytics integrations, funnel metrics, and growth trends
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
                      <p className="text-sm text-muted-foreground mb-3 flex-1">
                        {integration.description}
                      </p>
                      {integration.detail && (
                        <p className="text-xs text-muted-foreground mb-3">{integration.detail}</p>
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
              <p className="text-xs text-muted-foreground mt-3">
                Traffic and performance data live in Vercel and Google dashboards. Funnel counts below
                are derived from platform database records and mirror the custom events fired on the site.
              </p>
            </section>

            {/* Funnel */}
            <section className="mb-10">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <Activity className="h-5 w-5 text-blue-500" />
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
            </section>

            {/* Daily trends */}
            <section className="mb-10">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <BarChart2 className="h-5 w-5 text-emerald-500" />
                Last 30 days
              </h2>
              <div className="grid lg:grid-cols-2 gap-4">
                <Card className="bg-card border-border">
                  <CardContent className="p-5">
                    <h3 className="text-sm font-medium text-muted-foreground mb-4">Signups per day</h3>
                    <div className="flex items-end gap-1 h-32">
                      {data.dailyTrends.map((d) => {
                        const h = maxDailySignups > 0 ? (d.signups / maxDailySignups) * 100 : 0;
                        return (
                          <div
                            key={`signup-${d.date}`}
                            className="flex-1 bg-blue-500/80 rounded-t-sm min-h-[2px] transition-all hover:bg-blue-400"
                            style={{ height: `${Math.max(h, d.signups > 0 ? 8 : 2)}%` }}
                            title={`${d.date}: ${d.signups} signups`}
                          />
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-card border-border">
                  <CardContent className="p-5">
                    <h3 className="text-sm font-medium text-muted-foreground mb-4">Orders per day</h3>
                    <div className="flex items-end gap-1 h-32">
                      {data.dailyTrends.map((d) => {
                        const h = maxDailyOrders > 0 ? (d.orders / maxDailyOrders) * 100 : 0;
                        return (
                          <div
                            key={`order-${d.date}`}
                            className="flex-1 bg-orange-500/80 rounded-t-sm min-h-[2px] transition-all hover:bg-orange-400"
                            style={{ height: `${Math.max(h, d.orders > 0 ? 8 : 2)}%` }}
                            title={`${d.date}: ${d.orders} orders (${d.completedOrders} completed)`}
                          />
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </section>

            {/* Tracked events reference */}
            <section>
              <h2 className="text-xl font-semibold mb-4">Tracked events</h2>
              <Card className="bg-card border-border overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-muted/40">
                        <th className="text-left p-4 font-medium">Event</th>
                        <th className="text-left p-4 font-medium">Description</th>
                        <th className="text-left p-4 font-medium">Source page</th>
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
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
              <p className="text-xs text-muted-foreground mt-3">
                Events fire to Vercel Analytics on every occurrence. GA4 receives them only when the user
                accepts analytics cookies and{' '}
                <code className="text-xs">NEXT_PUBLIC_GA_MEASUREMENT_ID</code> is set.
              </p>
            </section>
          </>
        )}
      </div>
    </div>
  );
}