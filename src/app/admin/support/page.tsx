'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import Link from 'next/link';

interface Ticket {
  id: string;
  subject: string;
  message: string;
  category: string | null;
  priority: string;
  status: string;
  adminReply: string | null;
  createdAt: string;
  user: { id: string; name: string | null; email: string; role: string };
}

export default function AdminSupportPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [replyText, setReplyText] = useState('');
  const [newStatus, setNewStatus] = useState('');
  const [updating, setUpdating] = useState(false);

  const fetchTickets = async (statusFilter?: string) => {
    setLoading(true);
    try {
      const params = statusFilter ? `?status=${statusFilter}` : '';
      const res = await fetch(`/api/admin/support/tickets${params}`);
      const data = await res.json();
      setTickets(data.tickets || []);
    } catch (e) {
      toast.error('Error loading tickets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const openTicket = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setReplyText(ticket.adminReply || '');
    setNewStatus(ticket.status);
  };

  const closeDetail = () => {
    setSelectedTicket(null);
    setReplyText('');
    setNewStatus('');
  };

  const updateTicket = async () => {
    if (!selectedTicket) return;

    setUpdating(true);
    try {
      const res = await fetch('/api/admin/support/tickets', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticketId: selectedTicket.id,
          status: newStatus || selectedTicket.status,
          adminReply: replyText.trim() || null,
        }),
      });

      if (!res.ok) throw new Error('Update failed');

      toast.success('Ticket updated');
      closeDetail();
      fetchTickets(); // refresh list
    } catch (e) {
      toast.error('Could not update ticket');
    } finally {
      setUpdating(false);
    }
  };

  const getStatusColor = (status: string) => {
    if (status === 'open') return 'bg-blue-500';
    if (status === 'in_progress') return 'bg-yellow-500';
    if (status === 'resolved') return 'bg-green-500';
    return 'bg-muted-foreground';
  };

  const askGrokForHelp = (ticket: Ticket) => {
    // Navigate to grok-build with prefilled context about this ticket
    const context = `Support ticket ID: ${ticket.id}
User: ${ticket.user.email} (${ticket.user.role})
Subject: ${ticket.subject}
Message: ${ticket.message}
Current status: ${ticket.status}
Priority: ${ticket.priority}
Category: ${ticket.category || 'N/A'}

Please help draft a helpful reply or suggest how to resolve this.`;
    
    // Store in session or just navigate; for simplicity use URL param or just go to page
    // In real would use state or query, but for now alert + navigate
    sessionStorage.setItem('grokSupportContext', context);
    window.location.href = '/admin/grok-build?mode=support';
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-5xl font-bold">Support</h1>
            <p className="text-muted-foreground mt-1">Manage tickets submitted by users (buyers and sellers)</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => fetchTickets()}>Refresh</Button>
            <Button variant="outline" onClick={() => fetchTickets('open')}>Open Only</Button>
            <Link href="/admin/grok-build" className="inline-flex items-center px-4 py-2 border rounded text-sm hover:bg-muted">
              ✨ Open Grok Build
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">Loading tickets...</div>
        ) : tickets.length === 0 ? (
          <Card className="bg-card border-border p-8 text-center">No matching tickets.</Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* List */}
            <div className="space-y-4">
              {tickets.map(ticket => (
                <Card 
                  key={ticket.id} 
                  className={`bg-card border-border cursor-pointer hover:border-orange-500 ${selectedTicket?.id === ticket.id ? 'ring-2 ring-orange-500' : ''}`}
                  onClick={() => openTicket(ticket)}
                >
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-semibold">{ticket.subject}</p>
                        <p className="text-sm text-muted-foreground">{ticket.user.email} • {ticket.user.role}</p>
                      </div>
                      <div className="text-right text-xs">
                        <span className={`px-2 py-0.5 rounded text-white ${getStatusColor(ticket.status)}`}>{ticket.status}</span>
                        <div className="text-muted-foreground mt-1">{ticket.priority}</div>
                      </div>
                    </div>
                    <p className="text-sm line-clamp-2 text-muted-foreground">{ticket.message}</p>
                    <div className="mt-3 flex gap-2">
                      <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); askGrokForHelp(ticket); }}>
                        ✨ Ask Grok for help
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Detail / Editor */}
            <div>
              {selectedTicket ? (
                <Card className="bg-card border-border sticky top-8">
                  <CardContent className="p-6">
                    <div className="flex justify-between mb-4">
                      <h3 className="font-semibold text-lg">Ticket #{selectedTicket.id.slice(0,8)}</h3>
                      <Button variant="ghost" size="sm" onClick={closeDetail}>Close</Button>
                    </div>

                    <div className="mb-4 text-sm">
                      <strong>From:</strong> {selectedTicket.user.email} ({selectedTicket.user.role})<br />
                      <strong>Subject:</strong> {selectedTicket.subject}<br />
                      <strong>Category:</strong> {selectedTicket.category || 'N/A'} • <strong>Priority:</strong> {selectedTicket.priority}
                    </div>

                    <div className="mb-4">
                      <p className="text-xs text-muted-foreground mb-1">USER MESSAGE</p>
                      <div className="bg-muted p-3 rounded text-sm whitespace-pre-wrap">{selectedTicket.message}</div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <Label>Status</Label>
                        <select 
                          value={newStatus || selectedTicket.status} 
                          onChange={e => setNewStatus(e.target.value)}
                          className="w-full border rounded p-2 bg-background"
                        >
                          <option value="open">Open</option>
                          <option value="in_progress">In Progress</option>
                          <option value="resolved">Resolved</option>
                          <option value="closed">Closed</option>
                        </select>
                      </div>

                      <div>
                        <Label>Admin Reply / Notes</Label>
                        <Textarea 
                          value={replyText} 
                          onChange={e => setReplyText(e.target.value)} 
                          rows={5} 
                          placeholder="Write your reply here. It will notify the user."
                        />
                      </div>

                      <div className="flex gap-2">
                        <Button onClick={updateTicket} disabled={updating} className="flex-1">
                          {updating ? 'Saving...' : 'Save Changes & Notify'}
                        </Button>
                        <Button variant="outline" onClick={() => askGrokForHelp(selectedTicket)}>
                          ✨ Grok Help
                        </Button>
                      </div>
                    </div>

                    {selectedTicket.adminReply && (
                      <div className="mt-4 p-3 bg-muted rounded text-sm">
                        <p className="text-xs font-medium mb-1">Current reply:</p>
                        {selectedTicket.adminReply}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <div className="text-muted-foreground p-8 border border-dashed rounded text-center">
                  Select a ticket to view details and respond. <br />Use the "Grok Help" button for the assistant to help draft replies or diagnose issues.
                </div>
              )}
            </div>
          </div>
        )}

        <div className="mt-8 text-xs text-muted-foreground">
          Users can submit tickets from <Link href="/support" className="underline">/support</Link>. Changes here send automatic notifications.
        </div>
      </div>
    </div>
  );
}

