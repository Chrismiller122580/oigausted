'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

type Ticket = {
  id: string;
  subject: string;
  message: string;
  category: string | null;
  priority: string;
  status: string;
  adminReply: string | null;
  createdAt: string;
  user: { id: string; name: string | null; email: string; role: string };
};

export function DisputesPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Ticket | null>(null);
  const [replyText, setReplyText] = useState('');
  const [newStatus, setNewStatus] = useState('');
  const [updating, setUpdating] = useState(false);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/support/tickets?category=payment');
      const data = await res.json();
      setTickets(data.tickets || []);
    } catch {
      toast.error('Error loading payment disputes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const openTicket = (ticket: Ticket) => {
    setSelected(ticket);
    setReplyText(ticket.adminReply || '');
    setNewStatus(ticket.status);
  };

  const updateTicket = async () => {
    if (!selected) return;
    setUpdating(true);
    try {
      const res = await fetch('/api/admin/support/tickets', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticketId: selected.id,
          status: newStatus || selected.status,
          adminReply: replyText.trim() || null,
        }),
      });
      if (!res.ok) throw new Error('Update failed');
      toast.success('Dispute updated');
      setSelected(null);
      fetchTickets();
    } catch {
      toast.error('Could not update dispute');
    } finally {
      setUpdating(false);
    }
  };

  const statusColor = (status: string) => {
    if (status === 'open') return 'bg-blue-500/20 text-blue-600';
    if (status === 'in_progress') return 'bg-yellow-500/20 text-yellow-700';
    if (status === 'resolved') return 'bg-green-500/20 text-green-600';
    return 'bg-muted text-muted-foreground';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Payment Disputes</h1>
          <p className="text-muted-foreground mt-2">
            Support tickets in the payments & Wompi category · {tickets.length} total
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchTickets} disabled={loading}>
          <RefreshCw size={14} className={`mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {loading ? (
        <p className="text-muted-foreground">Loading disputes…</p>
      ) : tickets.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No open payment disputes.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-3">
            {tickets.map((ticket) => (
              <button
                key={ticket.id}
                type="button"
                onClick={() => openTicket(ticket)}
                className={`w-full text-left rounded-xl border p-4 transition hover:bg-muted/40 ${
                  selected?.id === ticket.id ? 'border-orange-500 bg-orange-50/50 dark:bg-orange-950/20' : 'border-border'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="font-medium">{ticket.subject}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${statusColor(ticket.status)}`}>
                    {ticket.status}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{ticket.message}</p>
                <p className="text-xs text-muted-foreground mt-2">
                  {ticket.user.email} · {new Date(ticket.createdAt).toLocaleDateString('es-CO')}
                </p>
              </button>
            ))}
          </div>

          {selected && (
            <Card className="h-fit sticky top-20">
              <CardContent className="p-6 space-y-4">
                <div>
                  <h2 className="font-semibold text-lg">{selected.subject}</h2>
                  <p className="text-sm text-muted-foreground mt-1">{selected.user.email}</p>
                </div>
                <p className="text-sm whitespace-pre-wrap bg-muted/40 rounded-lg p-3">{selected.message}</p>
                <div>
                  <Label htmlFor="dispute-status">Status</Label>
                  <select
                    id="dispute-status"
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="mt-1 w-full bg-card border border-border rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="open">Open</option>
                    <option value="in_progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="dispute-reply">Reply to user</Label>
                  <Textarea
                    id="dispute-reply"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    className="mt-1 min-h-[120px]"
                    placeholder="Your response to the user..."
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={updateTicket} disabled={updating}>
                    {updating ? 'Saving…' : 'Save'}
                  </Button>
                  <Button variant="outline" onClick={() => setSelected(null)}>
                    Close
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}