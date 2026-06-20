'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import {
  ScanSearch,
  RefreshCw,
  Monitor,
  Smartphone,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  Clock,
  Eye,
} from 'lucide-react';
import type {
  LighthouseCategory,
  UserLensScanResult,
  UserLensViewport,
} from '@/types/userlens';
import { getDefaultScanUrl } from '@/lib/userlens/resolve-scan-url';

const CATEGORIES: Array<{ id: LighthouseCategory; label: string }> = [
  { id: 'performance', label: 'Performance' },
  { id: 'accessibility', label: 'Accessibility' },
  { id: 'best-practices', label: 'Best Practices' },
  { id: 'seo', label: 'SEO' },
];

const HISTORY_KEY = 'admin-userlens-history';

function scoreColor(score: number | null): string {
  if (score == null) return 'text-muted-foreground';
  if (score >= 90) return 'text-emerald-600 dark:text-emerald-400';
  if (score >= 50) return 'text-amber-600 dark:text-amber-400';
  return 'text-red-500';
}

function scoreRingColor(score: number | null): string {
  if (score == null) return 'border-muted';
  if (score >= 90) return 'border-emerald-500';
  if (score >= 50) return 'border-amber-500';
  return 'border-red-500';
}

function impactBadgeClass(impact: string | null): string {
  switch (impact) {
    case 'critical':
      return 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300';
    case 'serious':
      return 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300';
    case 'moderate':
      return 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300';
    default:
      return 'bg-muted text-muted-foreground';
  }
}

function ScoreCard({ title, score }: { title: string; score: number | null }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className={`flex h-20 w-20 items-center justify-center rounded-full border-4 ${scoreRingColor(score)}`}
      >
        <span className={`text-2xl font-bold tabular-nums ${scoreColor(score)}`}>
          {score ?? '—'}
        </span>
      </div>
      <p className="text-sm font-medium text-center">{title}</p>
    </div>
  );
}

function readScanHistory(): string[] {
  try {
    const saved = localStorage.getItem(HISTORY_KEY);
    return saved ? (JSON.parse(saved) as string[]) : [];
  } catch {
    return [];
  }
}

function subscribeNoop() {
  return () => {};
}

function useClientOrigin(): string {
  return useSyncExternalStore(
    subscribeNoop,
    () => window.location.origin,
    () => '',
  );
}

export default function UserLensPanel({ embedded = false }: { embedded?: boolean }) {
  const clientOrigin = useClientOrigin();
  const [url, setUrl] = useState('');
  const [viewport, setViewport] = useState<UserLensViewport>('desktop');
  const [selectedCategories, setSelectedCategories] = useState<LighthouseCategory[]>(
    CATEGORIES.map((c) => c.id),
  );
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<UserLensScanResult | null>(null);
  const [history, setHistory] = useState<string[]>([]);
  const [scanSupport, setScanSupport] = useState<{
    supported: boolean;
    mode?: 'playwright' | 'psi' | 'remote';
    reason?: string;
    hint?: string;
  } | null>(null);

  const displayUrl = url || getDefaultScanUrl(clientOrigin);
  const scansDisabled = scanning || scanSupport?.supported === false;
  const isCloudScan = scanSupport?.mode === 'psi';

  useEffect(() => {
    setHistory(readScanHistory());
  }, []);

  useEffect(() => {
    let cancelled = false;

    fetch('/api/admin/userlens/scan')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && data && typeof data.supported === 'boolean') {
          setScanSupport(data);
        }
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, []);

  const saveHistory = (scannedUrl: string) => {
    const next = [scannedUrl, ...history.filter((h) => h !== scannedUrl)].slice(0, 8);
    setHistory(next);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
  };

  const toggleCategory = (id: LighthouseCategory) => {
    setSelectedCategories((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id],
    );
  };

  const runScan = async (targetUrl?: string) => {
    const scanUrl = (targetUrl ?? displayUrl).trim();
    if (!scanUrl) {
      toast.error('Enter a URL to scan');
      return;
    }
    if (selectedCategories.length === 0) {
      toast.error('Select at least one Lighthouse category');
      return;
    }

    setScanning(true);
    setResult(null);

    try {
      const res = await fetch('/api/admin/userlens/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: scanUrl,
          viewport,
          categories: selectedCategories,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        const detail = [data.error, data.hint].filter(Boolean).join(' ');
        throw new Error(detail || 'Scan failed');
      }

      const scanResult = data as UserLensScanResult & {
        reportId?: string;
        fixItemCount?: number;
      };
      setResult(scanResult);
      setUrl(scanUrl);
      saveHistory(scanUrl);
      const queued = scanResult.fixItemCount ?? 0;
      toast.success(
        queued > 0
          ? `Scan saved — ${queued} issue${queued === 1 ? '' : 's'} added to fix toolbox`
          : 'Scan saved — no new issues detected',
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Scan failed');
    } finally {
      setScanning(false);
    }
  };

  return (
    <div className={embedded ? 'space-y-6' : 'space-y-8 max-w-5xl'}>
      {!embedded && (
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-xl bg-orange-100 dark:bg-orange-900/30">
              <ScanSearch className="h-6 w-6 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">UserLens</h1>
              <p className="text-sm text-muted-foreground">
                UX audit tool — Lighthouse scores, axe accessibility, and screenshots
              </p>
            </div>
          </div>
        </div>
      )}

      {scanSupport?.supported === false && (
        <div className="flex gap-3 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-100">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
          <div className="space-y-1">
            <p className="font-medium">{scanSupport.reason}</p>
            {scanSupport.hint && <p className="text-amber-900/90 dark:text-amber-100/90">{scanSupport.hint}</p>}
          </div>
        </div>
      )}

      {isCloudScan && scanSupport?.hint && (
        <div className="flex gap-3 rounded-lg border border-sky-300 bg-sky-50 p-4 text-sm text-sky-950 dark:border-sky-800 dark:bg-sky-950/30 dark:text-sky-100">
          <ScanSearch className="mt-0.5 h-5 w-5 shrink-0" />
          <div className="space-y-1">
            <p className="font-medium">Cloud scan mode</p>
            <p className="text-sky-900/90 dark:text-sky-100/90">{scanSupport.hint}</p>
          </div>
        </div>
      )}

      <Card className="border-border">
        <CardHeader>
          <CardTitle>Run scan</CardTitle>
          <CardDescription>
            Admin-only UX audits. Production uses Google PageSpeed Insights; local/Codespaces use
            Playwright + Lighthouse + axe-core. Scan a public URL like{' '}
            <code className="text-xs">https://oigagig.com</code> from this panel.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="scan-url">URL</Label>
            <div className="flex flex-col sm:flex-row gap-2">
              <Input
                id="scan-url"
                type="url"
                placeholder="https://example.com"
                value={displayUrl}
                onChange={(e) => setUrl(e.target.value)}
                disabled={scansDisabled}
              />
              <Button onClick={() => runScan()} disabled={scansDisabled} className="shrink-0">
                {scanning ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Scanning…
                  </>
                ) : (
                  <>
                    <ScanSearch className="h-4 w-4 mr-2" />
                    Run scan
                  </>
                )}
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <span className="text-sm text-muted-foreground w-full sm:w-auto sm:mr-2">Viewport:</span>
            <Button
              type="button"
              size="sm"
              variant={viewport === 'desktop' ? 'default' : 'outline'}
              onClick={() => setViewport('desktop')}
              disabled={scansDisabled}
            >
              <Monitor className="h-4 w-4 mr-1" />
              Desktop
            </Button>
            <Button
              type="button"
              size="sm"
              variant={viewport === 'mobile' ? 'default' : 'outline'}
              onClick={() => setViewport('mobile')}
              disabled={scansDisabled}
            >
              <Smartphone className="h-4 w-4 mr-1" />
              Mobile
            </Button>
          </div>

          <div className="flex flex-wrap gap-3">
            <span className="text-sm text-muted-foreground w-full">Lighthouse categories:</span>
            {CATEGORIES.map((cat) => (
              <label
                key={cat.id}
                className="inline-flex items-center gap-2 text-sm cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selectedCategories.includes(cat.id)}
                  onChange={() => toggleCategory(cat.id)}
                  disabled={scansDisabled}
                  className="rounded border-border"
                />
                {cat.label}
              </label>
            ))}
          </div>

          {history.length > 0 && (
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-xs text-muted-foreground">Recent:</span>
              {history.map((h) => (
                <button
                  key={h}
                  type="button"
                  onClick={() => runScan(h)}
                  disabled={scansDisabled}
                  className="text-xs px-2 py-1 rounded-full bg-muted hover:bg-accent transition-colors truncate max-w-[200px]"
                  title={h}
                >
                  {h.replace(/^https?:\/\//, '')}
                </button>
              ))}
            </div>
          )}

          {scanning && (
            <p className="text-sm text-muted-foreground animate-pulse">
              Launching browser, loading page, running Lighthouse and axe… (may take 30–60s)
            </p>
          )}
        </CardContent>
      </Card>

      {result && (
        <>
          {result.warnings.length > 0 && (
            <div className="rounded-xl border border-amber-300/50 bg-amber-50 dark:bg-amber-950/20 p-4 space-y-1">
              {result.warnings.map((w) => (
                <p key={w} className="text-sm text-amber-800 dark:text-amber-200 flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                  {w}
                </p>
              ))}
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <Clock className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Load time</p>
                  <p className="font-semibold tabular-nums">{(result.loadTimeMs / 1000).toFixed(2)}s</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <Eye className="h-5 w-5 text-muted-foreground" />
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">Page title</p>
                  <p className="font-semibold truncate" title={result.title}>
                    {result.title || '—'}
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">axe violations</p>
                  <p className="font-semibold tabular-nums">{result.axe.violationCount}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">axe passes</p>
                  <p className="font-semibold tabular-nums">{result.axe.passes}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {result.lighthouse && (
            <Card>
              <CardHeader>
                <CardTitle>Lighthouse scores</CardTitle>
                <CardDescription className="space-y-1">
                  {result.scanUrl && result.scanUrl !== result.url && (
                    <span className="block text-amber-700 dark:text-amber-300">
                      Requested: {result.url} → scanned: {result.scanUrl}
                    </span>
                  )}
                  {result.url !== result.finalUrl && !result.scanUrl && (
                    <span className="block text-amber-700 dark:text-amber-300">
                      Requested: {result.url}
                    </span>
                  )}
                  <span className="inline-flex flex-wrap items-center gap-1">
                    <span className="text-muted-foreground">Scanned:</span>
                    <a
                      href={result.finalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 hover:underline break-all"
                    >
                      {result.finalUrl}
                      <ExternalLink className="h-3 w-3 shrink-0" />
                    </a>
                    <span>
                      · {result.viewport} · {new Date(result.scannedAt).toLocaleString()}
                    </span>
                  </span>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex flex-wrap justify-center gap-8">
                  {result.lighthouse.categories.map((cat) => (
                    <ScoreCard key={cat.id} title={cat.title} score={cat.score} />
                  ))}
                </div>

                {Object.values(result.lighthouse.metrics).some(Boolean) && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                    {result.lighthouse.metrics.firstContentfulPaint && (
                      <MetricPill label="FCP" value={result.lighthouse.metrics.firstContentfulPaint} />
                    )}
                    {result.lighthouse.metrics.largestContentfulPaint && (
                      <MetricPill label="LCP" value={result.lighthouse.metrics.largestContentfulPaint} />
                    )}
                    {result.lighthouse.metrics.totalBlockingTime && (
                      <MetricPill label="TBT" value={result.lighthouse.metrics.totalBlockingTime} />
                    )}
                    {result.lighthouse.metrics.cumulativeLayoutShift && (
                      <MetricPill label="CLS" value={result.lighthouse.metrics.cumulativeLayoutShift} />
                    )}
                    {result.lighthouse.metrics.speedIndex && (
                      <MetricPill label="Speed Index" value={result.lighthouse.metrics.speedIndex} />
                    )}
                  </div>
                )}

                {result.lighthouse.categories.some((c) => c.failedAudits.length > 0) && (
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium">Failed audits</h3>
                    {result.lighthouse.categories.map(
                      (cat) =>
                        cat.failedAudits.length > 0 && (
                          <div key={cat.id} className="space-y-2">
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                              {cat.title}
                            </p>
                            <ul className="space-y-2">
                              {cat.failedAudits.map((audit) => (
                                <li
                                  key={audit.id}
                                  className="rounded-lg border border-border bg-muted/30 p-3 text-sm"
                                >
                                  <p className="font-medium">{audit.title}</p>
                                  {audit.displayValue && (
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                      {audit.displayValue}
                                    </p>
                                  )}
                                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                    {audit.description}
                                  </p>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ),
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {result.screenshotBase64 && (
            <Card>
              <CardHeader>
                <CardTitle>Screenshot</CardTitle>
                <CardDescription>Viewport capture at scan time</CardDescription>
              </CardHeader>
              <CardContent>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`data:image/jpeg;base64,${result.screenshotBase64}`}
                  alt={`Screenshot of ${result.finalUrl}`}
                  className="rounded-lg border border-border max-w-full h-auto shadow-sm"
                />
              </CardContent>
            </Card>
          )}

          {result.axe.violations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Accessibility violations (axe)</CardTitle>
                <CardDescription>
                  {result.axe.violationCount} violations · {result.axe.incompleteCount} incomplete
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {result.axe.violations.map((v, index) => (
                  <div key={`${v.id}-${index}`} className="rounded-lg border border-border p-4 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`text-xs font-medium px-2 py-0.5 rounded-full ${impactBadgeClass(v.impact)}`}
                      >
                        {v.impact ?? 'unknown'}
                      </span>
                      <span className="font-medium text-sm">{v.help}</span>
                      <span className="text-xs text-muted-foreground">({v.nodes} nodes)</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{v.description}</p>
                    {v.targets.length > 0 && (
                      <ul className="text-xs font-mono text-muted-foreground space-y-1">
                        {v.targets.map((t) => (
                          <li key={t} className="truncate" title={t}>
                            {t}
                          </li>
                        ))}
                      </ul>
                    )}
                    {v.helpUrl && (
                      <a
                        href={v.helpUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-orange-600 dark:text-orange-400 hover:underline inline-flex items-center gap-1"
                      >
                        Learn more <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {result.axe.violationCount === 0 && (
            <Card>
              <CardContent className="p-6 flex items-center gap-3 text-emerald-700 dark:text-emerald-400">
                <CheckCircle2 className="h-5 w-5" />
                <span className="text-sm font-medium">No axe accessibility violations detected</span>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

function MetricPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-muted/50 border border-border px-3 py-2 text-center">
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="text-sm font-semibold tabular-nums">{value}</p>
    </div>
  );
}