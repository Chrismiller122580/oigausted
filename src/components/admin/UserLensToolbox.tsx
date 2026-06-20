'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import {
  CheckCircle2,
  XCircle,
  Clock,
  Wrench,
  RefreshCw,
  FileJson,
  ExternalLink,
  Ban,
  CheckCheck,
} from 'lucide-react';
import type { FixItemStatus, UserLensFixItemRecord } from '@/types/userlens';

const STATUS_FILTERS: Array<{ id: FixItemStatus | 'all'; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'pending', label: 'Pending' },
  { id: 'approved', label: 'Approved' },
  { id: 'rejected', label: 'Rejected' },
  { id: 'deferred', label: 'Deferred' },
  { id: 'fixed', label: 'Fixed' },
];

function statusBadge(status: FixItemStatus): string {
  switch (status) {
    case 'approved':
      return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300';
    case 'rejected':
      return 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300';
    case 'deferred':
      return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
    case 'fixed':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300';
    default:
      return 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300';
  }
}

function severityBadge(severity: string | null | undefined): string {
  switch (severity) {
    case 'critical':
      return 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300';
    case 'serious':
      return 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300';
    default:
      return 'bg-muted text-muted-foreground';
  }
}

export default function UserLensToolbox() {
  const [items, setItems] = useState<UserLensFixItemRecord[]>([]);
  const [filter, setFilter] = useState<FixItemStatus | 'all'>('pending');
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [actingId, setActingId] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [composerPath, setComposerPath] = useState('data/userlens/composer-queue.json');

  const loadItems = useCallback(async () => {
    setLoading(true);
    try {
      const qs = filter === 'all' ? '' : `?status=${filter}`;
      const res = await fetch(`/api/admin/userlens/fix-queue${qs}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load fix queue');
      setItems(data.items as UserLensFixItemRecord[]);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  const review = async (id: string, status: FixItemStatus) => {
    setActingId(id);
    try {
      const res = await fetch(`/api/admin/userlens/fix-queue/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, reviewNotes: notes[id] || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Update failed');
      toast.success(`Marked as ${status}`);
      await loadItems();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Update failed');
    } finally {
      setActingId(null);
    }
  };

  const syncComposerFile = async () => {
    setSyncing(true);
    try {
      const res = await fetch('/api/admin/userlens/composer-queue', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Sync failed');
      if (data.filePath) setComposerPath(data.filePath.replace(/^.*data\//, 'data/'));
      toast.success(`Composer queue synced (${data.fixQueueCount} items)`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Sync failed');
    } finally {
      setSyncing(false);
    }
  };

  const pendingCount = items.filter((i) => i.status === 'pending').length;
  const approvedCount = items.filter((i) => i.status === 'approved').length;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5 text-orange-600" />
            Composer fix queue
          </CardTitle>
          <CardDescription>
            Review scan findings, approve fixes for Cursor/Composer to implement later, or reject
            false positives. Approved + pending items sync to{' '}
            <code className="text-xs bg-muted px-1 py-0.5 rounded">{composerPath}</code>
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={loadItems} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={syncComposerFile} disabled={syncing}>
            <FileJson className={`h-4 w-4 mr-1 ${syncing ? 'animate-pulse' : ''}`} />
            Sync composer file
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <a href="/api/admin/userlens/composer-queue" target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4 mr-1" />
              View JSON
            </a>
          </Button>
          <span className="text-xs text-muted-foreground self-center ml-auto">
            {pendingCount} pending · {approvedCount} approved for Composer
          </span>
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-2">
        {STATUS_FILTERS.map((f) => (
          <Button
            key={f.id}
            size="sm"
            variant={filter === f.id ? 'default' : 'outline'}
            onClick={() => setFilter(f.id)}
          >
            {f.label}
          </Button>
        ))}
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground animate-pulse">Loading fix queue…</p>
      ) : items.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground text-sm">
            No items in this filter. Run a scan to populate the queue.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <Card key={item.id} className="border-border">
              <CardContent className="p-4 space-y-3">
                <div className="flex flex-wrap items-start gap-2 justify-between">
                  <div className="flex flex-wrap items-center gap-2 min-w-0">
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusBadge(item.status)}`}
                    >
                      {item.status}
                    </span>
                    {item.severity && (
                      <span
                        className={`text-xs font-medium px-2 py-0.5 rounded-full ${severityBadge(item.severity)}`}
                      >
                        {item.severity}
                      </span>
                    )}
                    <span className="text-xs text-muted-foreground uppercase tracking-wide">
                      {item.source}
                      {item.category ? ` · ${item.category}` : ''}
                    </span>
                  </div>
                  {item.reportFinalUrl && (
                    <a
                      href={item.reportFinalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-orange-600 hover:underline truncate max-w-[200px]"
                    >
                      {item.reportFinalUrl.replace(/^https?:\/\//, '')}
                    </a>
                  )}
                </div>

                <div>
                  <p className="font-medium text-sm">{item.title}</p>
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-3">{item.description}</p>
                  {item.targets.length > 0 && (
                    <ul className="mt-2 text-xs font-mono text-muted-foreground space-y-0.5">
                      {item.targets.slice(0, 3).map((t) => (
                        <li key={t} className="truncate" title={t}>
                          {t}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <textarea
                  placeholder="Review notes (optional) — shown in composer-queue.json"
                  className="w-full text-sm rounded-lg border border-border bg-background px-3 py-2 min-h-[60px]"
                  value={notes[item.id] ?? item.reviewNotes ?? ''}
                  onChange={(e) => setNotes((prev) => ({ ...prev, [item.id]: e.target.value }))}
                />

                <div className="flex flex-wrap gap-2">
                  {item.status !== 'approved' && (
                    <Button
                      size="sm"
                      className="bg-emerald-700 hover:bg-emerald-800 text-white"
                      disabled={actingId === item.id}
                      onClick={() => review(item.id, 'approved')}
                    >
                      <CheckCircle2 className="h-4 w-4 mr-1" />
                      Approve for Composer
                    </Button>
                  )}
                  {item.status !== 'fixed' && (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={actingId === item.id}
                      onClick={() => review(item.id, 'fixed')}
                    >
                      <CheckCheck className="h-4 w-4 mr-1" />
                      Mark fixed
                    </Button>
                  )}
                  {item.status !== 'deferred' && (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={actingId === item.id}
                      onClick={() => review(item.id, 'deferred')}
                    >
                      <Clock className="h-4 w-4 mr-1" />
                      Defer
                    </Button>
                  )}
                  {item.status !== 'rejected' && (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={actingId === item.id}
                      onClick={() => review(item.id, 'rejected')}
                    >
                      <Ban className="h-4 w-4 mr-1" />
                      Reject
                    </Button>
                  )}
                  {item.status !== 'pending' && (
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={actingId === item.id}
                      onClick={() => review(item.id, 'pending')}
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      Reset to pending
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}