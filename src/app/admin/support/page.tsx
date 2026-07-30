'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import Link from 'next/link';
import { Lock, MessageSquare, Send } from 'lucide-react';
import { staffMessageDisplayName } from '@/lib/brand';

interface ThreadMessage {
  id: string;
  body: string;
  isInternal: boolean;
  isStaff: boolean;
  createdAt: string;
  author?: { id: string; name: string | null; email: string | null } | null;
}

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
  messages?: ThreadMessage[];
}

export default function AdminSupportPage() {
  const searchParams = useSearchParams();
  const deepLinkId = searchParams.get('id') || searchParams.get('ticketId');
  const deepLinkHandled = useRef<string | null>(null);

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<ThreadMessage[]>([]);
  const [replyText, setReplyText] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [updating, setUpdating] = useState(false);
  const [loadingThread, setLoadingThread] = useState(false);

  const openTicket = useCallback(async (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setReplyText('');
    setIsInternal(false);
    setNewStatus(ticket.status);
    setLoadingThread(true);
    try {
      const res = await fetch(
        `/api/admin/support/tickets?id=${encodeURIComponent(ticket.id)}`
      );
      if (res.ok) {
        const data = await res.json();
        if (data.ticket) {
          setSelectedTicket(data.ticket);
          setNewStatus(data.ticket.status);
          const msgs = data.ticket.messages || [];
          // Always surface origin user message + legacy reply if thread is incomplete
          setMessages(
            msgs.length > 0 ? ensureSupportThreadComplete(data.ticket, msgs) : buildLegacyThread(data.ticket)
          );
        }
      } else {
        setMessages(buildLegacyThread(ticket));
      }
    } catch {
      setMessages(buildLegacyThread(ticket));
    } finally {
      setLoadingThread(false);
    }
  }, []);

  const fetchTickets = useCallback(async (statusFilter?: string) => {
    setLoading(true);
    try {
      const params = statusFilter ? `?status=${statusFilter}` : '';
      const res = await fetch(`/api/admin/support/tickets${params}`);
      const data = await res.json();
      setTickets(data.tickets || []);
      return (data.tickets || []) as Ticket[];
    } catch {
      toast.error('Error loading tickets');
      return [] as Ticket[];
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchTickets();
  }, [fetchTickets]);

  useEffect(() => {
    if (!deepLinkId || loading) return;
    if (deepLinkHandled.current === deepLinkId) return;

    const openFromList = tickets.find((t) => t.id === deepLinkId);
    if (openFromList) {
      deepLinkHandled.current = deepLinkId;
      void openTicket(openFromList);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(
          `/api/admin/support/tickets?id=${encodeURIComponent(deepLinkId)}`
        );
        if (!res.ok || cancelled) return;
        const data = await res.json();
        if (data.ticket && !cancelled) {
          deepLinkHandled.current = deepLinkId;
          setTickets((prev) =>
            prev.some((t) => t.id === data.ticket.id)
              ? prev
              : [data.ticket as Ticket, ...prev]
          );
          await openTicket(data.ticket as Ticket);
        }
      } catch {
        // list still usable
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [deepLinkId, loading, tickets, openTicket]);

  const closeDetail = () => {
    setSelectedTicket(null);
    setMessages([]);
    setReplyText('');
    setNewStatus('');
    setIsInternal(false);
  };

  const updateTicket = async (opts?: { sendMessage?: boolean }) => {
    if (!selectedTicket) return;
    const sendMessage = opts?.sendMessage !== false;
    const text = replyText.trim();

    if (sendMessage && !text && newStatus === selectedTicket.status) {
      toast.error('Write a reply or change status');
      return;
    }

    setUpdating(true);
    try {
      const payload: Record<string, unknown> = {
        ticketId: selectedTicket.id,
        status: newStatus || selectedTicket.status,
      };
      if (sendMessage && text) {
        payload.body = text;
        payload.isInternal = isInternal;
      }

      const res = await fetch('/api/admin/support/tickets', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('Update failed');
      const data = await res.json();

      toast.success(
        isInternal && text
          ? 'Internal note saved'
          : text
            ? 'Reply sent & user notified'
            : 'Ticket updated'
      );

      if (data.ticket) {
        setSelectedTicket(data.ticket);
        setNewStatus(data.ticket.status);
        // Prefer API messages; if empty, rebuild from legacy so sent+received stay visible
        const nextMessages = data.ticket.messages?.length
          ? data.ticket.messages
          : buildLegacyThread(data.ticket);
        setMessages(nextMessages);
      } else if (selectedTicket) {
        // Re-fetch full thread so admin always sees sent + received after update
        await openTicket(selectedTicket);
      }
      setReplyText('');
      setIsInternal(false);
      void fetchTickets();
    } catch {
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
    const threadPreview = messages
      .slice(-6)
      .map(
        (m) =>
          `[${m.isInternal ? 'INTERNAL' : m.isStaff ? 'STAFF' : 'USER'}] ${m.body.slice(0, 200)}`
      )
      .join('\n');
    const context = `Support ticket ID: ${ticket.id}
User: ${ticket.user.email} (${ticket.user.role})
Subject: ${ticket.subject}
Message: ${ticket.message}
Current status: ${ticket.status}
Priority: ${ticket.priority}
Category: ${ticket.category || 'N/A'}

Recent thread:
${threadPreview || '(no messages yet)'}

Please help draft a helpful reply or suggest how to resolve this.`;

    sessionStorage.setItem('grokSupportContext', context);
    window.location.href = '/admin/grok-build?mode=support';
  };

  return (
    <div className="bg-background text-foreground">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-5xl font-bold">Support</h1>
            <p className="text-muted-foreground mt-1">
              Threaded tickets · public replies notify the user · internal notes stay private
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => fetchTickets()}>
              Refresh
            </Button>
            <Button variant="outline" onClick={() => fetchTickets('open')}>
              Open Only
            </Button>
            <Link
              href="/admin/messages?kind=support"
              className="inline-flex items-center px-4 py-2 border rounded text-sm hover:bg-muted"
            >
              All messages
            </Link>
            <Link
              href="/admin/grok-build"
              className="inline-flex items-center px-4 py-2 border rounded text-sm hover:bg-muted"
            >
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
            <div className="space-y-4">
              {tickets.map((ticket) => (
                <Card
                  key={ticket.id}
                  className={`bg-card border-border cursor-pointer hover:border-orange-500 ${
                    selectedTicket?.id === ticket.id ? 'ring-2 ring-orange-500' : ''
                  }`}
                  onClick={() => void openTicket(ticket)}
                >
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-semibold">{ticket.subject}</p>
                        <p className="text-sm text-muted-foreground">
                          {ticket.user.email} • {ticket.user.role}
                        </p>
                      </div>
                      <div className="text-right text-xs">
                        <span
                          className={`px-2 py-0.5 rounded text-white ${getStatusColor(ticket.status)}`}
                        >
                          {ticket.status}
                        </span>
                        <div className="text-muted-foreground mt-1">{ticket.priority}</div>
                      </div>
                    </div>
                    <p className="text-sm line-clamp-2 text-muted-foreground">{ticket.message}</p>
                    <div className="mt-3 flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          askGrokForHelp(ticket);
                        }}
                      >
                        ✨ Ask Grok for help
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div>
              {selectedTicket ? (
                <Card className="bg-card border-border sticky top-8">
                  <CardContent className="p-6">
                    <div className="flex justify-between mb-4">
                      <h3 className="font-semibold text-lg">
                        Ticket #{selectedTicket.id.slice(0, 8)}
                      </h3>
                      <Button variant="ghost" size="sm" onClick={closeDetail}>
                        Close
                      </Button>
                    </div>

                    <div className="mb-4 text-sm">
                      <strong>From:</strong> {selectedTicket.user.email} (
                      {selectedTicket.user.role})
                      <br />
                      <strong>Subject:</strong> {selectedTicket.subject}
                      <br />
                      <strong>Category:</strong> {selectedTicket.category || 'N/A'} •{' '}
                      <strong>Priority:</strong> {selectedTicket.priority}
                    </div>

                    {/* Thread */}
                    <div className="mb-4">
                      <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                        <MessageSquare className="h-3.5 w-3.5" />
                        Conversation
                      </p>
                      <div className="max-h-72 overflow-y-auto space-y-2 rounded-lg border bg-muted/20 p-3">
                        {loadingThread ? (
                          <p className="text-sm text-muted-foreground">Loading thread…</p>
                        ) : messages.length === 0 ? (
                          <div className="bg-muted p-3 rounded text-sm whitespace-pre-wrap">
                            {selectedTicket.message}
                          </div>
                        ) : (
                          messages.map((m) => (
                            <div
                              key={m.id}
                              className={`rounded-lg p-3 text-sm ${
                                m.isInternal
                                  ? 'bg-amber-50 border border-amber-200 dark:bg-amber-950/30 dark:border-amber-800'
                                  : m.isStaff
                                    ? 'bg-orange-50 border border-orange-200/70 dark:bg-orange-950/25 dark:border-orange-900'
                                    : 'bg-background border border-border'
                              }`}
                            >
                              <div className="flex items-center justify-between gap-2 mb-1">
                                <span className="text-[10px] uppercase tracking-wide font-medium text-muted-foreground flex items-center gap-1">
                                  {m.isInternal ? (
                                    <>
                                      <Lock className="h-3 w-3" />
                                      {staffMessageDisplayName({
                                        internal: true,
                                        authorName: m.author?.name,
                                        authorEmail: m.author?.email,
                                      })}
                                    </>
                                  ) : m.isStaff ? (
                                    // Public staff replies always brand as OigaGIG (never personal name)
                                    staffMessageDisplayName()
                                  ) : (
                                    'User'
                                  )}
                                </span>
                                <span className="text-[10px] text-muted-foreground">
                                  {new Date(m.createdAt).toLocaleString('es-CO', {
                                    dateStyle: 'short',
                                    timeStyle: 'short',
                                  })}
                                </span>
                              </div>
                              <p className="whitespace-pre-wrap">{m.body}</p>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <Label>Status</Label>
                        <select
                          value={newStatus || selectedTicket.status}
                          onChange={(e) => setNewStatus(e.target.value)}
                          className="w-full border rounded p-2 bg-background"
                        >
                          <option value="open">Open</option>
                          <option value="in_progress">In Progress</option>
                          <option value="resolved">Resolved</option>
                          <option value="closed">Closed</option>
                        </select>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <Label>{isInternal ? 'Internal note' : 'Public reply'}</Label>
                          <label className="flex items-center gap-2 text-xs cursor-pointer">
                            <input
                              type="checkbox"
                              checked={isInternal}
                              onChange={(e) => setIsInternal(e.target.checked)}
                              className="h-3.5 w-3.5 accent-amber-600"
                            />
                            Staff-only (no user notify)
                          </label>
                        </div>
                        <Textarea
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          rows={4}
                          placeholder={
                            isInternal
                              ? 'Private note for the team…'
                              : 'Write a public reply. The user will be notified.'
                          }
                        />
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <Button
                          onClick={() => void updateTicket({ sendMessage: true })}
                          disabled={updating}
                          className="flex-1 gap-1.5"
                        >
                          <Send className="h-4 w-4" />
                          {updating
                            ? 'Saving…'
                            : isInternal
                              ? 'Save note + status'
                              : 'Send reply + status'}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => askGrokForHelp(selectedTicket)}
                        >
                          ✨ Grok Help
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="text-muted-foreground p-8 border border-dashed rounded text-center">
                  Select a ticket to view the thread and respond.
                  <br />
                  Public replies notify the user; internal notes stay private.
                </div>
              )}
            </div>
          </div>
        )}

        <div className="mt-8 text-xs text-muted-foreground">
          Users submit tickets from{' '}
          <Link href="/support" className="underline">
            /support
          </Link>
          . They can also reply in the thread.
        </div>
      </div>
    </div>
  );
}

function buildLegacyThread(ticket: Ticket): ThreadMessage[] {
  const msgs: ThreadMessage[] = [
    {
      id: `${ticket.id}-origin`,
      body: ticket.message,
      isInternal: false,
      isStaff: false,
      createdAt: ticket.createdAt,
    },
  ];
  if (ticket.adminReply?.trim()) {
    msgs.push({
      id: `${ticket.id}-admin`,
      body: ticket.adminReply,
      isInternal: false,
      isStaff: true,
      createdAt: ticket.createdAt,
    });
  }
  return msgs;
}

/** Guarantee origin + any missing public staff replies appear in the admin view. */
function ensureSupportThreadComplete(
  ticket: Ticket,
  messages: ThreadMessage[]
): ThreadMessage[] {
  const hasUserMsg = messages.some((m) => !m.isStaff && !m.isInternal);
  let next = [...messages];
  if (!hasUserMsg && ticket.message) {
    next = [
      {
        id: `${ticket.id}-origin`,
        body: ticket.message,
        isInternal: false,
        isStaff: false,
        createdAt: ticket.createdAt,
      },
      ...next,
    ];
  }
  if (
    ticket.adminReply?.trim() &&
    !next.some(
      (m) => m.isStaff && !m.isInternal && m.body.trim() === ticket.adminReply!.trim()
    )
  ) {
    next = [
      ...next,
      {
        id: `${ticket.id}-admin-fallback`,
        body: ticket.adminReply,
        isInternal: false,
        isStaff: true,
        createdAt: ticket.createdAt,
      },
    ];
  }
  return next;
}
