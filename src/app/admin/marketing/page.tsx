'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

interface AudienceUser {
  id: string;
  name: string | null;
  email: string | null;
  role: string;
  businessName: string | null;
  city: string | null;
  isActive: boolean;
  createdAt: string;
}

interface Campaign {
  id: string;
  subject: string;
  segment: string;
  recipientCount: number;
  sentBy: string;
  createdAt: string;
}

const SEGMENTS = [
  { value: 'all', label: 'All active users' },
  { value: 'buyers', label: 'Buyers only' },
  { value: 'sellers', label: 'Sellers only' },
  { value: 'active', label: 'Active accounts only' },
  { value: 'inactive', label: 'Inactive accounts' },
];

export default function AdminMarketingPage() {
  // Compose state
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [segment, setSegment] = useState('all');
  const [cityFilter, setCityFilter] = useState('');
  const [sending, setSending] = useState(false);
  const [lastResult, setLastResult] = useState<any>(null);

  // Audience / mailing list
  const [audience, setAudience] = useState<AudienceUser[]>([]);
  const [audienceTotal, setAudienceTotal] = useState(0);
  const [audienceReachable, setAudienceReachable] = useState(0);
  const [audienceLoading, setAudienceLoading] = useState(false);
  const [audienceSearch, setAudienceSearch] = useState('');

  // History
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [campaignsTotal, setCampaignsTotal] = useState(0);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Dry run preview
  const [dryRunResult, setDryRunResult] = useState<any>(null);

  const fetchAudience = async (reset = true) => {
    setAudienceLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('segment', segment);
      if (cityFilter) params.set('city', cityFilter);
      if (audienceSearch) params.set('search', audienceSearch);
      params.set('limit', '80');

      const res = await fetch(`/api/admin/marketing/audience?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setAudience(data.sample || []);
        setAudienceTotal(data.total || 0);
        setAudienceReachable(data.reachable || 0);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setAudienceLoading(false);
    }
  };

  const fetchHistory = async () => {
    setHistoryLoading(true);
    try {
      const res = await fetch('/api/admin/marketing/campaigns?limit=30');
      if (res.ok) {
        const data = await res.json();
        setCampaigns(data.campaigns || []);
        setCampaignsTotal(data.total || 0);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setHistoryLoading(false);
    }
  };

  // Refresh audience when filters change
  useEffect(() => {
    const t = setTimeout(() => {
      fetchAudience(true);
    }, 300);
    return () => clearTimeout(t);
  }, [segment, cityFilter, audienceSearch]);

  useEffect(() => {
    fetchHistory();
  }, []);

  const runDryRun = async () => {
    if (!subject.trim() || !message.trim()) {
      toast.error('Add a subject and message first');
      return;
    }
    try {
      const res = await fetch('/api/admin/marketing/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: subject.trim(),
          message: message.trim(),
          segment,
          city: cityFilter || undefined,
          dryRun: true,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setDryRunResult(data);
        toast.success(`Dry run: ${data.recipientCount} recipients would receive this`);
      } else {
        toast.error(data.error || 'Dry run failed');
      }
    } catch (e) {
      toast.error('Request failed');
    }
  };

  const sendTest = async () => {
    if (!subject.trim() || !message.trim()) {
      toast.error('Subject and message required');
      return;
    }
    setSending(true);
    try {
      const res = await fetch('/api/admin/marketing/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: subject.trim(),
          message: message.trim(),
          testOnly: true,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || 'Test email sent to you');
        setLastResult(data);
        fetchHistory();
      } else {
        toast.error(data.error || 'Test send failed');
      }
    } catch (e) {
      toast.error('Send failed');
    } finally {
      setSending(false);
    }
  };

  const sendBroadcast = async () => {
    if (!subject.trim() || !message.trim()) {
      toast.error('Subject and message are required');
      return;
    }

    const targetCount = dryRunResult?.recipientCount ?? audienceReachable ?? audienceTotal;

    if (!confirm(`Send this message to approximately ${targetCount} users?\n\nSegment: ${segment}${cityFilter ? ' • City: ' + cityFilter : ''}\n\nThis action is logged and respects user email + marketing preferences.`)) {
      return;
    }

    setSending(true);
    try {
      const res = await fetch('/api/admin/marketing/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: subject.trim(),
          message: message.trim(),
          segment,
          city: cityFilter || undefined,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || `Broadcast sent to ${data.sent} users`);
        setLastResult(data);
        setSubject('');
        setMessage('');
        setDryRunResult(null);
        fetchHistory();
        fetchAudience(true);
      } else {
        toast.error(data.error || 'Broadcast failed');
      }
    } catch (e) {
      toast.error('Network error while sending');
    } finally {
      setSending(false);
    }
  };

  const exportAudienceCSV = () => {
    if (audience.length === 0) {
      toast.error('No audience data to export');
      return;
    }
    const headers = ['ID', 'Name', 'Email', 'Role', 'Business', 'City', 'Active', 'Joined'];
    const rows = audience.map(u => [
      u.id,
      u.name || '',
      u.email || '',
      u.role,
      u.businessName || '',
      u.city || '',
      u.isActive ? 'yes' : 'no',
      new Date(u.createdAt).toISOString().slice(0, 10),
    ]);

    let csv = headers.join(',') + '\n';
    rows.forEach(r => {
      csv += r.map(f => `"${String(f).replace(/"/g, '""')}"`).join(',') + '\n';
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `marketing-audience-${segment}${cityFilter ? '-' + cityFilter : ''}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Exported audience CSV');
  };

  const presetMessage = (type: string) => {
    if (type === 'update') {
      setSubject('Actualización importante en OigaUsted');
      setMessage('Hola,\n\nEstamos realizando mejoras en la plataforma para ofrecerte una mejor experiencia.\n\nLos principales cambios incluyen:\n• Mejor rendimiento en búsqueda y carga de gigs\n• Nueva sección de notificaciones\n• Correcciones en el flujo de pagos\n\nGracias por ser parte de OigaUsted. Si tienes preguntas, responde a este correo o visita nuestro centro de soporte.\n\n— El equipo de OigaUsted');
    }
    if (type === 'promo') {
      setSubject('¡Promoción especial esta semana en OigaUsted!');
      setMessage('Hola,\n\nEsta semana tenemos una promoción para usuarios activos:\n\n• 10% de descuento en tu próxima comisión de servicio (aplica para órdenes completadas esta semana).\n\nExplora nuevos gigs o publica los tuyos con mayor visibilidad.\n\n¡No dejes pasar esta oportunidad!\n\n— OigaUsted');
    }
    if (type === 'info') {
      setSubject('Actualización de información de tu cuenta');
      setMessage('Hola,\n\nTe recordamos que puedes actualizar tu información de perfil, número de WhatsApp y datos de negocio en cualquier momento desde tu configuración de cuenta.\n\nMantener tus datos actualizados ayuda a que compradores y vendedores puedan contactarte fácilmente.\n\nSi necesitas ayuda, escríbenos a support@support.oigagig.com.\n\n— Equipo OigaUsted');
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-10">
      <div>
        <div className="flex items-center gap-3">
          <MegaphoneIcon className="h-8 w-8 text-orange-500" />
          <h1 className="text-4xl font-bold">Marketing &amp; Communications</h1>
        </div>
        <p className="text-muted-foreground mt-2 text-lg">
          Send system updates, promotions, and account notices to users. All sends are audited and respect user email + marketing preferences.
        </p>
      </div>

      {/* COMPOSE */}
      <div className="bg-card border border-border rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-semibold">Compose Broadcast</h2>
            <p className="text-sm text-muted-foreground">Emails + in-app notifications (category: marketing)</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => presetMessage('update')}>System update</Button>
            <Button variant="outline" size="sm" onClick={() => presetMessage('promo')}>Promo</Button>
            <Button variant="outline" size="sm" onClick={() => presetMessage('info')}>Account info</Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Segment</label>
              <select
                value={segment}
                onChange={(e) => setSegment(e.target.value)}
                className="w-full border border-border bg-background rounded-lg px-3 py-2 text-sm"
              >
                {SEGMENTS.map(s => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
              <p className="text-[11px] text-muted-foreground mt-1">Only users with email + marketingEmails enabled will receive (plus active filter for most segments).</p>
            </div>

            <div>
              <label className="text-sm font-medium mb-1.5 block">City filter (optional)</label>
              <Input 
                placeholder="e.g. Bucaramanga" 
                value={cityFilter} 
                onChange={(e) => setCityFilter(e.target.value)} 
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-1.5 block">Subject</label>
              <Input 
                placeholder="Actualización del sistema - Noviembre 2026" 
                value={subject} 
                onChange={(e) => setSubject(e.target.value)} 
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-1.5 block">Message (plain text is fine — will be wrapped in branded email)</label>
              <Textarea 
                value={message} 
                onChange={(e) => setMessage(e.target.value)} 
                rows={10} 
                placeholder="Write the body of the email / notification here..." 
              />
              <p className="text-[11px] text-muted-foreground mt-1">Keep it concise. Users can opt out of marketing via their notification settings.</p>
            </div>

            <div className="flex flex-wrap gap-3 pt-2">
              <Button onClick={runDryRun} variant="outline" disabled={sending || !subject || !message}>
                Dry Run (preview count)
              </Button>
              <Button onClick={sendTest} variant="outline" disabled={sending || !subject || !message}>
                Send Test to Me
              </Button>
              <Button onClick={sendBroadcast} disabled={sending || !subject || !message} className="bg-orange-600 hover:bg-orange-700">
                {sending ? 'Sending...' : 'Send Broadcast'}
              </Button>
            </div>

            {dryRunResult && (
              <div className="text-xs bg-muted/60 rounded p-3 border">
                Dry run result: <strong>{dryRunResult.recipientCount}</strong> recipients would be reached for segment <code>{dryRunResult.segment}</code>.
                {dryRunResult.sample?.length > 0 && (
                  <div className="mt-1 text-muted-foreground">Sample: {dryRunResult.sample.map((s:any)=>s.email).join(', ')}</div>
                )}
              </div>
            )}
            {lastResult && (
              <div className="text-xs text-green-600">Last action: {lastResult.message || 'Completed'}</div>
            )}
          </div>

          {/* Live audience summary on the right */}
          <div className="border border-border rounded-xl p-4 bg-background">
            <div className="text-sm font-medium mb-2">Current audience (live)</div>
            <div className="text-4xl font-semibold tabular-nums">{audienceReachable.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground">reachable (email + marketing on)</div>
            <div className="mt-1 text-sm text-muted-foreground">Total matching segment: {audienceTotal.toLocaleString()}</div>

            <div className="mt-4 text-xs">
              <div className="font-medium mb-1">Quick tips</div>
              <ul className="list-disc pl-4 space-y-0.5 text-muted-foreground">
                <li>Users without a NotificationPreference row are treated as opted-in (defensive default).</li>
                <li>Marketing blasts bypass quiet hours (intentional admin communication).</li>
                <li>Everything is logged in Audit and creates a MarketingCampaign record.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* MAILING LIST / AUDIENCE */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-xl font-semibold">Mailing List / Audience</h2>
            <p className="text-sm text-muted-foreground">{audienceTotal} matching • {audienceReachable} reachable for email</p>
          </div>
          <div className="flex items-center gap-2">
            <Input
              placeholder="Search name, email, business..."
              value={audienceSearch}
              onChange={(e) => setAudienceSearch(e.target.value)}
              className="w-64"
            />
            <Button variant="outline" size="sm" onClick={exportAudienceCSV}>Export CSV</Button>
            <Button variant="outline" size="sm" onClick={() => fetchAudience(true)} disabled={audienceLoading}>
              Refresh
            </Button>
          </div>
        </div>

        <div className="border border-border rounded-2xl overflow-hidden bg-card">
          <table className="w-full text-sm">
            <thead className="bg-muted/60 border-b">
              <tr>
                <th className="text-left p-3 font-medium">User</th>
                <th className="text-left p-3 font-medium">Email</th>
                <th className="text-left p-3 font-medium">Role</th>
                <th className="text-left p-3 font-medium">Business / City</th>
                <th className="text-left p-3 font-medium">Joined</th>
              </tr>
            </thead>
            <tbody>
              {audience.length === 0 && !audienceLoading && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-muted-foreground">No users match the current filters.</td>
                </tr>
              )}
              {audience.map((u) => (
                <tr key={u.id} className="border-b last:border-0 hover:bg-muted/30">
                  <td className="p-3">
                    <div className="font-medium">{u.name || '—'}</div>
                    <div className="text-[10px] text-muted-foreground font-mono">{u.id.slice(0, 8)}…</div>
                  </td>
                  <td className="p-3 text-foreground">{u.email}</td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 text-xs rounded bg-muted">{u.role}</span>
                  </td>
                  <td className="p-3 text-xs">
                    {u.businessName || '—'} {u.city ? `· ${u.city}` : ''}
                  </td>
                  <td className="p-3 text-xs text-muted-foreground">
                    {new Date(u.createdAt).toLocaleDateString('es-CO')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-[11px] text-muted-foreground mt-2">Showing up to 80 recent matches. Use the filters above or export for the full list.</p>
      </div>

      {/* HISTORY */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-semibold">Campaign History <span className="text-sm font-normal text-muted-foreground">({campaignsTotal})</span></h2>
          <Button variant="outline" size="sm" onClick={fetchHistory} disabled={historyLoading}>Refresh</Button>
        </div>

        <div className="border border-border rounded-2xl overflow-hidden bg-card">
          <table className="w-full text-sm">
            <thead className="bg-muted/60 border-b">
              <tr>
                <th className="text-left p-3 font-medium">Date</th>
                <th className="text-left p-3 font-medium">Subject</th>
                <th className="text-left p-3 font-medium">Segment</th>
                <th className="text-right p-3 font-medium">Recipients</th>
                <th className="text-left p-3 font-medium">Sent by</th>
              </tr>
            </thead>
            <tbody>
              {campaigns.length === 0 && !historyLoading && (
                <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">No campaigns sent yet.</td></tr>
              )}
              {campaigns.map((c) => (
                <tr key={c.id} className="border-b last:border-0 hover:bg-muted/30">
                  <td className="p-3 text-xs text-muted-foreground whitespace-nowrap">
                    {new Date(c.createdAt).toLocaleDateString('es-CO', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="p-3 font-medium">{c.subject}</td>
                  <td className="p-3">
                    <code className="text-xs px-1.5 py-0.5 bg-muted rounded">{c.segment}</code>
                  </td>
                  <td className="p-3 text-right font-semibold tabular-nums">{c.recipientCount.toLocaleString()}</td>
                  <td className="p-3 text-sm text-muted-foreground">{c.sentBy}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="text-xs text-muted-foreground pb-8">
        All marketing sends create an AuditLog entry (ADMIN_MARKETING_BROADCAST) and a MarketingCampaign record. Users control marketingEmails in their notification settings.
      </div>
    </div>
  );
}

// Small inline icon to avoid extra import surface
function MegaphoneIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.875 9.168-5" />
    </svg>
  );
}
