'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { asAuditDetails } from '@/types/audit';
import { ScrollableTable } from '@/components/ui/scrollable-table';

interface AuditLog {
  id: string;
  action: string;
  targetType: string;
  targetId: string | null;
  details: Record<string, unknown> | string | null;
  ipAddress: string | null;
  createdAt: string;
  admin?: {
    id: string;
    name: string | null;
    email: string;
  } | null;
  performedBy?: {
    id: string;
    name: string | null;
    email: string;
    role: string;
  } | null;
}

export default function AdminAuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  // Seed initial filters from URL for deep links (e.g. from /admin/settings "Recent Payment Audit Logs" link)
  // Supports ?action=XXX, ?search=XXX (legacy), ?targetType=YYY, ?actor=ZZZ
  const [actionFilter, setActionFilter] = useState(() => {
    if (typeof window === 'undefined') return '';
    const sp = new URLSearchParams(window.location.search);
    return sp.get('action') || sp.get('search') || '';
  });
  const [targetTypeFilter, setTargetTypeFilter] = useState(() => {
    if (typeof window === 'undefined') return '';
    const sp = new URLSearchParams(window.location.search);
    return sp.get('targetType') || sp.get('target') || '';
  });
  const [actorFilter, setActorFilter] = useState(() => {
    if (typeof window === 'undefined') return '';
    const sp = new URLSearchParams(window.location.search);
    return sp.get('actor') || '';
  });
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchLogs = async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    try {
      const params = new URLSearchParams();
      if (actionFilter) params.append('action', actionFilter);
      if (targetTypeFilter) params.append('targetType', targetTypeFilter);
      if (actorFilter) params.append('actor', actorFilter); // supports email or id, resolved in API
      // Always request a decent number so new logs show up
      params.append('limit', '100');

      const res = await fetch(`/api/admin/audit?${params.toString()}`);
      const data = await res.json();
      setLogs(data.logs || []);
      setLastUpdated(new Date());
    } catch (e) {
      if (!isBackground) toast.error('Error loading audit records');
    } finally {
      if (!isBackground) setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchLogs();
  }, [actionFilter, targetTypeFilter, actorFilter]);

  // Auto-refresh so logs "update" live without manual browser reload (every 15s when enabled)
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      fetchLogs(true); // background refresh, no loading spinner
    }, 15000);
    return () => clearInterval(interval);
  }, [autoRefresh, actionFilter, targetTypeFilter, actorFilter]);

  const formatAction = (action: string) => {
    return action.replace(/_/g, ' ').toLowerCase();
  };

  return (
    <div className="bg-background text-foreground">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-5xl font-bold">Audit Log</h1>
          <p className="text-muted-foreground mt-1">
            Complete history of system changes (admins, users, webhooks and automatic events)
          </p>
        </div>

        <div className="flex flex-wrap gap-4 mb-6 items-center">
          <Input
            placeholder="Filter by action (e.g. USER or ROLE)"
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="max-w-xs"
          />
          <Input
            placeholder="Filter by type (e.g. User or Gig)"
            value={targetTypeFilter}
            onChange={(e) => setTargetTypeFilter(e.target.value)}
            className="max-w-xs"
          />
          <Input
            placeholder="Filter by actor (email or ID)"
            value={actorFilter}
            onChange={(e) => setActorFilter(e.target.value)}
            className="max-w-xs"
          />
          <Button variant="outline" onClick={() => { setActionFilter(''); setTargetTypeFilter(''); setActorFilter(''); }}>
            Clear Filters
          </Button>
          <Button variant="outline" onClick={() => fetchLogs(false)} disabled={loading}>
            Refresh
          </Button>
          <Button 
            variant={autoRefresh ? "default" : "outline"} 
            onClick={() => setAutoRefresh(!autoRefresh)}
            size="sm"
          >
            {autoRefresh ? '⏸ Pause auto' : '▶ Auto-refresh (15s)'}
          </Button>
          {lastUpdated && (
            <span className="text-xs text-muted-foreground ml-2">
              Updated: {lastUpdated.toLocaleTimeString('es-CO')}
            </span>
          )}
        </div>

        {/* Quick debug filters - useful for the recent config/maintenance/Wompi noise */}
        <div className="flex flex-wrap gap-2 mb-4">
          <Button size="sm" variant="secondary" onClick={() => { setActionFilter('PLATFORM_CONFIG_UPDATED'); setTargetTypeFilter(''); setActorFilter(''); }}>
            Recent Config Changes
          </Button>
          <Button size="sm" variant="secondary" onClick={() => { setActionFilter(''); setTargetTypeFilter('PlatformConfig'); setActorFilter(''); }}>
            All PlatformConfig
          </Button>
          <Button size="sm" variant="secondary" onClick={() => { setActionFilter('MAINTENANCE'); setTargetTypeFilter(''); setActorFilter(''); }}>
            Maintenance Events
          </Button>
          <Button size="sm" variant="secondary" onClick={() => { setActionFilter('WOMPI'); setTargetTypeFilter(''); setActorFilter(''); }}>
            Wompi Events
          </Button>
          <Button size="sm" variant="secondary" onClick={() => { setActionFilter(''); setTargetTypeFilter(''); setActorFilter(''); }}>
            All
          </Button>
        </div>

        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-12 text-center text-muted-foreground">Loading records...</div>
            ) : logs.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground">No records found.</div>
            ) : (
              <ScrollableTable>
                <table className="w-full text-sm">
                  <thead className="bg-muted">
                    <tr>
                      <th className="text-left p-4">Date</th>
                      <th className="text-left p-4">Actor</th>
                      <th className="text-left p-4">Action</th>
                      <th className="text-left p-4">Resource</th>
                      <th className="text-left p-4">Details</th>
                      <th className="text-left p-4">IP</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log) => (
                      <tr key={log.id} className="border-b hover:bg-muted/50">
                        <td className="p-4 text-xs text-muted-foreground">
                          {new Date(log.createdAt).toLocaleString('es-CO')}
                        </td>
                        <td className="p-4">
                          {log.performedBy ? (
                            <>
                              <div className="font-medium">{log.performedBy.name || log.performedBy.email}</div>
                              <div className="text-xs text-muted-foreground">{log.performedBy.email} <span className="font-mono">({log.performedBy.role})</span></div>
                            </>
                          ) : log.admin ? (
                            <>
                              <div className="font-medium">{log.admin.name || log.admin.email}</div>
                              <div className="text-xs text-muted-foreground">{log.admin.email} <span className="font-mono">(admin)</span></div>
                            </>
                          ) : (
                            <div className="text-muted-foreground italic">System / Webhook</div>
                          )}
                        </td>
                        <td className="p-4">
                          <span className="font-mono text-xs bg-muted px-2 py-0.5 rounded">
                            {formatAction(log.action)}
                          </span>
                        </td>
                        <td className="p-4 text-sm">
                          {log.targetType}
                          {log.targetId && (
                            <span className="block text-xs text-muted-foreground font-mono truncate max-w-[180px]">
                              {log.targetId}
                            </span>
                          )}
                        </td>
                        <td className="p-4">
                          {log.details && (
                            <details className="group">
                              <summary 
                                className="cursor-pointer text-xs bg-muted px-2 py-1 rounded hover:bg-muted/80 list-none flex items-center gap-1"
                                title="Click to expand full details. Click details text to copy."
                                onClick={(e) => {
                                  // Prevent default expand if clicking the summary area for copy? No, let details handle.
                                  // We'll add copy on the pre instead.
                                }}
                              >
                                <span>📋 Details</span>
                                <span className="text-[10px] opacity-60 group-open:hidden">(click to expand)</span>
                                <span className="text-[10px] opacity-60 hidden group-open:inline">(click again to collapse)</span>
                              </summary>
                              <div className="mt-1">
                                {log.action === 'PLATFORM_CONFIG_UPDATED' && asAuditDetails(log.details)?.changedFields && (
                                  <div className="mb-1 text-[10px]">
                                    <span className="font-semibold">Changed:</span> {(asAuditDetails(log.details)!.changedFields as string[]).join(', ')}
                                  </div>
                                )}
                                <pre 
                                  className="text-[10px] bg-muted p-2 rounded max-w-xs max-h-48 overflow-auto cursor-pointer hover:bg-muted/80 border border-muted-foreground/20"
                                  title="Click to copy full JSON"
                                  onClick={async (e) => {
                                    e.stopPropagation();
                                    const text = typeof log.details === 'string' ? log.details : JSON.stringify(log.details, null, 2);
                                    const { copyToClipboard } = await import('@/lib/share');
                                    const ok = await copyToClipboard(text);
                                    if (ok) toast.success('Full details copied to clipboard');
                                    else toast.error('Could not copy details');
                                  }}
                                >
                                  {typeof log.details === 'string' 
                                    ? log.details 
                                    : JSON.stringify(log.details, null, 2)}
                                </pre>
                              </div>
                            </details>
                          )}
                        </td>
                        <td className="p-4 text-xs text-muted-foreground font-mono">
                          {log.ipAddress || '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </ScrollableTable>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
