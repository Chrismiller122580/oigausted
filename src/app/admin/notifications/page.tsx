'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

interface NotificationStats {
  total: number;
  unread: number;
  last24h: number;
  last7d: number;
  byCategory: Array<{ category: string; count: number }>;
  recent: Array<{
    id: string;
    user: string;
    userName?: string;
    title: string;
    message: string;
    category: string;
    createdAt: string;
    read: boolean;
    link: string | null;
    emailStatus?: string;
    pushStatus?: string;
  }>;
}

export default function AdminNotificationsDashboard() {
  // Send form state
  const [userId, setUserId] = useState('');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [category, setCategory] = useState('system');
  const [sending, setSending] = useState(false);

  // Analytics state
  const [stats, setStats] = useState<NotificationStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  // === Notification Logs (Option 3) ===
  const [logs, setLogs] = useState<NotificationStats['recent']>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [logsTotal, setLogsTotal] = useState(0);
  const [logsOffset, setLogsOffset] = useState(0);
  const [hasMoreLogs, setHasMoreLogs] = useState(false);

  // Filters
  const [logSearch, setLogSearch] = useState('');
  const [logCategory, setLogCategory] = useState('');
  const [logEmailStatus, setLogEmailStatus] = useState('');
  const [logPushStatus, setLogPushStatus] = useState('');
  const [logRead, setLogRead] = useState('');
  const [logDateFrom, setLogDateFrom] = useState('');
  const [logDateTo, setLogDateTo] = useState('');

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/admin/notifications/stats');
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (e) {
      console.error('Failed to load notification stats');
    } finally {
      setLoadingStats(false);
    }
  };

  const fetchLogs = async (reset = false) => {
    setLoadingLogs(true);
    try {
      const params = new URLSearchParams();
      if (logSearch) params.set('search', logSearch);
      if (logCategory) params.set('category', logCategory);
      if (logEmailStatus) params.set('emailStatus', logEmailStatus);
      if (logPushStatus) params.set('pushStatus', logPushStatus);
      if (logRead) params.set('read', logRead);
      if (logDateFrom) params.set('dateFrom', logDateFrom);
      if (logDateTo) params.set('dateTo', logDateTo);
      params.set('limit', '30');
      params.set('offset', reset ? '0' : logsOffset.toString());

      const res = await fetch(`/api/admin/notifications/logs?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        if (reset) {
          setLogs(data.logs);
          setLogsOffset(30);
        } else {
          setLogs(prev => [...prev, ...data.logs]);
          setLogsOffset(prev => prev + 30);
        }
        setLogsTotal(data.total);
        setHasMoreLogs(data.hasMore);
      }
    } catch (e) {
      console.error('Failed to load logs');
    } finally {
      setLoadingLogs(false);
    }
  };

  // Auto-refresh logs when filters change (with debounce feel via effect)
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchLogs(true);
    }, 350);
    return () => clearTimeout(timer);
  }, [logSearch, logCategory, logEmailStatus, logPushStatus, logRead, logDateFrom, logDateTo]);

  useEffect(() => {
    fetchStats();
  }, []);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || !title || !message) {
      toast.error('Todos los campos son obligatorios');
      return;
    }

    setSending(true);
    try {
      const res = await fetch('/api/admin/send-notification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, title, message, category, type: 'in_app' }),
      });

      if (res.ok) {
        toast.success('Notification sent successfully');
        setTitle('');
        setMessage('');
        // Refresh analytics after sending
        fetchStats();
      } else {
        toast.error('Error sending notification');
      }
    } catch (e) {
      toast.error('Connection error');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Notifications Center</h1>
        <p className="text-muted-foreground">Analytics + Manual notification sending</p>
      </div>

      {/* Analytics Overview */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Notification Statistics</h2>
        
        {loadingStats ? (
          <div className="text-muted-foreground">Cargando estadísticas...</div>
        ) : stats ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-card p-4 rounded-xl border">
              <div className="text-sm text-muted-foreground">Total Sent</div>
              <div className="text-3xl font-bold">{stats.total.toLocaleString()}</div>
            </div>
            <div className="bg-card p-4 rounded-xl border">
              <div className="text-sm text-muted-foreground">Unread</div>
              <div className="text-3xl font-bold text-orange-600">{stats.unread.toLocaleString()}</div>
            </div>
            <div className="bg-card p-4 rounded-xl border">
              <div className="text-sm text-muted-foreground">Last 24h</div>
              <div className="text-3xl font-bold">{stats.last24h.toLocaleString()}</div>
            </div>
            <div className="bg-card p-4 rounded-xl border">
              <div className="text-sm text-muted-foreground">Last 7 days</div>
              <div className="text-3xl font-bold">{stats.last7d.toLocaleString()}</div>
            </div>
          </div>
        ) : null}

        {/* Category Breakdown */}
        {stats?.byCategory && stats.byCategory.length > 0 && (
          <div className="mb-6">
            <h3 className="font-medium mb-2">By Category</h3>
            <div className="flex flex-wrap gap-2">
              {stats.byCategory.map((cat) => (
                <div key={cat.category} className="px-3 py-1 bg-muted rounded-full text-sm">
                  {cat.category}: <span className="font-semibold">{cat.count}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Notifications Table */}
        {stats?.recent && stats.recent.length > 0 && (
          <div>
            <h3 className="font-medium mb-3">Recent Notifications</h3>
            <div className="overflow-x-auto border rounded-xl">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left p-3">User</th>
                    <th className="text-left p-3">Title</th>
                    <th className="text-left p-3">Category</th>
                    <th className="text-left p-3">Date</th>
                    <th className="text-left p-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recent.map((n) => (
                    <tr key={n.id} className="border-t hover:bg-muted/30">
                      <td className="p-3 font-medium">{n.user}</td>
                      <td className="p-3">{n.title}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded bg-orange-100 dark:bg-orange-900 text-xs">
                          {n.category}
                        </span>
                      </td>
                      <td className="p-3 text-muted-foreground">
                        {new Date(n.createdAt).toLocaleDateString('es-CO', { 
                          month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
                        })}
                      </td>
                      <td className="p-3">
                        {n.read ? (
                          <span className="text-green-600 text-xs">Read</span>
                        ) : (
                          <span className="text-orange-600 text-xs font-medium">Unread</span>
                        )}
                        {n.emailStatus && (
                          <span className="ml-2 text-[10px] px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded">
                            Email: {n.emailStatus}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Manual Send Tool */}
      <div className="max-w-2xl">
        <h2 className="text-xl font-semibold mb-4">Send Manual Notification</h2>
        <p className="text-muted-foreground mb-4 text-sm">
          Send notifications (in-app + automatic email). Ideal for support and testing.
        </p>

        <form onSubmit={handleSend} className="space-y-5 bg-card p-6 rounded-2xl border">
          <div>
            <label className="text-sm font-medium">User ID</label>
            <Input 
              value={userId} 
              onChange={(e) => setUserId(e.target.value)} 
              placeholder="User ID" 
              required 
            />
          </div>

          <div>
            <label className="text-sm font-medium">Category</label>
            <select 
              value={category} 
              onChange={(e) => setCategory(e.target.value)}
              className="w-full border rounded-md p-2 bg-background"
            >
              <option value="system">System</option>
              <option value="order">Order</option>
              <option value="gig">Gig</option>
              <option value="payment">Payment</option>
              <option value="review">Review</option>
              <option value="message">Message</option>
            </select>
          </div>

          <div>
            <label className="text-sm font-medium">Title</label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
          </div>

          <div>
            <label className="text-sm font-medium">Message</label>
            <Textarea 
              value={message} 
              onChange={(e) => setMessage(e.target.value)} 
              rows={4} 
              required 
            />
          </div>

          <Button type="submit" disabled={sending} className="w-full">
            {sending ? 'Sending...' : 'Send Notification'}
          </Button>
        </form>

        <p className="text-xs text-muted-foreground mt-4">
          Notifications sent here respect user preferences (including quiet hours).
        </p>

        {/* Digest Trigger Tools */}
        <div className="mt-8 pt-6 border-t">
          <h3 className="font-semibold mb-2">Digest Tools</h3>
          <p className="text-sm text-muted-foreground mb-3">
            Send summaries manually (useful for tests or off-schedule sends).
          </p>
          <div className="flex gap-3">
            <Button 
              variant="outline"
              onClick={async () => {
                const res = await fetch('/api/notifications/digest?frequency=daily', { method: 'POST' });
                if (res.ok) {
                  const data = await res.json();
                  toast.success(`Daily digest sent to ${data.digestsSent || 0} users`);
                } else {
                  toast.error('Error sending digest');
                }
              }}
            >
              Send Daily Digest Now
            </Button>
            <Button 
              variant="outline"
              onClick={async () => {
                const res = await fetch('/api/notifications/digest?frequency=weekly', { method: 'POST' });
                if (res.ok) {
                  const data = await res.json();
                  toast.success(`Weekly digest sent to ${data.digestsSent || 0} users`);
                } else {
                  toast.error('Error sending digest');
                }
              }}
            >
              Send Weekly Digest Now
            </Button>
          </div>
        </div>
      </div>

      {/* === Notification Logs (Dedicated Admin View) === */}
      <div className="mt-10">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold">Notification Logs</h2>
            <p className="text-sm text-muted-foreground">Full delivery history with advanced filters • {logsTotal} total records</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => fetchLogs(true)} disabled={loadingLogs}>
            Refresh
          </Button>
        </div>

        {/* Filters */}
        <div className="bg-card border rounded-2xl p-4 mb-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-3">
          <Input 
            placeholder="Search title, message or user..." 
            value={logSearch} 
            onChange={(e) => setLogSearch(e.target.value)} 
          />
          <select 
            value={logCategory} 
            onChange={(e) => setLogCategory(e.target.value)}
            className="border rounded-md p-2 bg-background text-sm"
          >
            <option value="">All Categories</option>
            <option value="order">Order</option>
            <option value="gig">Gig</option>
            <option value="payment">Payment</option>
            <option value="review">Review</option>
            <option value="message">Message</option>
            <option value="system">System</option>
          </select>
          <select 
            value={logEmailStatus} 
            onChange={(e) => setLogEmailStatus(e.target.value)}
            className="border rounded-md p-2 bg-background text-sm"
          >
            <option value="">Any Email Status</option>
            <option value="sent">Sent</option>
            <option value="delivered">Delivered</option>
            <option value="opened">Opened</option>
            <option value="clicked">Clicked</option>
            <option value="bounced">Bounced</option>
            <option value="failed">Failed</option>
          </select>
          <select 
            value={logPushStatus} 
            onChange={(e) => setLogPushStatus(e.target.value)}
            className="border rounded-md p-2 bg-background text-sm"
          >
            <option value="">Any Push Status</option>
            <option value="delivered">Delivered</option>
            <option value="clicked">Clicked</option>
            <option value="failed">Failed</option>
          </select>
          <select 
            value={logRead} 
            onChange={(e) => setLogRead(e.target.value)}
            className="border rounded-md p-2 bg-background text-sm"
          >
            <option value="">All Read States</option>
            <option value="true">Read</option>
            <option value="false">Unread</option>
          </select>
          <Input type="date" value={logDateFrom} onChange={(e) => setLogDateFrom(e.target.value)} placeholder="From" />
          <Input type="date" value={logDateTo} onChange={(e) => setLogDateTo(e.target.value)} placeholder="To" />
        </div>

        {/* Logs Table */}
        <div className="border rounded-2xl overflow-hidden bg-card">
          <table className="w-full text-sm">
            <thead className="bg-muted/60">
              <tr>
                <th className="text-left p-3 font-medium">User</th>
                <th className="text-left p-3 font-medium">Title</th>
                <th className="text-left p-3 font-medium">Category</th>
                <th className="text-left p-3 font-medium">Created</th>
                <th className="text-left p-3 font-medium">Email</th>
                <th className="text-left p-3 font-medium">Push</th>
                <th className="text-left p-3 font-medium">Read</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 && !loadingLogs && (
                <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">No logs match your filters.</td></tr>
              )}
              {logs.map((log) => (
                <tr key={log.id} className="border-t hover:bg-muted/30 transition-colors">
                  <td className="p-3 font-medium text-xs">{log.userName ?? log.user}</td>
                  <td className="p-3 max-w-[280px]">
                    <div className="truncate font-medium">{log.title}</div>
                    <div className="text-xs text-muted-foreground truncate">{log.message}</div>
                  </td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 text-xs rounded bg-muted text-muted-foreground">{log.category}</span>
                  </td>
                  <td className="p-3 text-xs text-muted-foreground">
                    {new Date(log.createdAt).toLocaleDateString('es-CO', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="p-3">
                    {log.emailStatus ? (
                      <span className={`text-xs px-2 py-0.5 rounded-full ${log.emailStatus === 'opened' || log.emailStatus === 'clicked' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                        {log.emailStatus}
                      </span>
                    ) : <span className="text-muted-foreground text-xs">—</span>}
                  </td>
                  <td className="p-3">
                    {log.pushStatus ? (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">{log.pushStatus}</span>
                    ) : <span className="text-muted-foreground text-xs">—</span>}
                  </td>
                  <td className="p-3">
                    {log.read ? <span className="text-green-600 text-xs">✓</span> : <span className="text-orange-500 text-xs">○</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {hasMoreLogs && (
          <div className="flex justify-center mt-4">
            <Button variant="outline" onClick={() => fetchLogs(false)} disabled={loadingLogs}>
              {loadingLogs ? 'Loading...' : 'Load more logs'}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
