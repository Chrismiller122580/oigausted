'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import {
  MessageCircle,
  RefreshCw,
  ExternalLink,
  ShoppingBag,
  HelpCircle,
  Headphones,
  Lock,
} from 'lucide-react';

type Kind = 'all' | 'order' | 'inquiry' | 'support';

type ThreadSummary = {
  id: string;
  kind: 'order' | 'inquiry' | 'support';
  title: string;
  subtitle: string;
  status: string;
  messageCount: number;
  lastMessageAt: string;
  lastPreview: string;
  lastDirection: string;
  participants: {
    buyer?: { id: string; name: string | null; email: string | null };
    seller?: { id: string; name: string | null; email: string | null };
    user?: { id: string; name: string | null; email: string | null };
  };
};

type ThreadMessage = {
  id: string;
  body: string;
  createdAt: string;
  direction: string;
  label: string;
  isInternal?: boolean;
  fileUrl?: string | null;
  fileName?: string | null;
};

type ThreadDetail = {
  kind: 'order' | 'inquiry' | 'support';
  id: string;
  status: string;
  title: string;
  link?: string;
  participants: ThreadSummary['participants'];
  messages: ThreadMessage[];
};

const KIND_TABS: { value: Kind; label: string; icon: typeof MessageCircle }[] = [
  { value: 'all', label: 'All chats', icon: MessageCircle },
  { value: 'order', label: 'Orders', icon: ShoppingBag },
  { value: 'inquiry', label: 'Inquiries', icon: HelpCircle },
  { value: 'support', label: 'Support', icon: Headphones },
];

export default function AdminMessagesPage() {
  const searchParams = useSearchParams();
  const deepKind = searchParams.get('kind') as Kind | null;
  const deepId = searchParams.get('id');

  const [kind, setKind] = useState<Kind>(
    deepKind === 'order' || deepKind === 'inquiry' || deepKind === 'support'
      ? deepKind
      : 'all'
  );
  const [search, setSearch] = useState('');
  const [threads, setThreads] = useState<ThreadSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<ThreadDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const fetchThreads = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        view: 'threads',
        kind,
        limit: '50',
      });
      if (search.trim()) params.set('search', search.trim());
      const res = await fetch(`/api/admin/messages?${params}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      setThreads(data.threads || []);
    } catch {
      toast.error('Could not load conversations');
      setThreads([]);
    } finally {
      setLoading(false);
    }
  }, [kind, search]);

  const openThread = useCallback(async (k: 'order' | 'inquiry' | 'support', id: string) => {
    setLoadingDetail(true);
    try {
      const params = new URLSearchParams({
        view: 'thread',
        kind: k,
        id,
      });
      const res = await fetch(`/api/admin/messages?${params}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      setSelected(data as ThreadDetail);
    } catch {
      toast.error('Could not load conversation');
    } finally {
      setLoadingDetail(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => void fetchThreads(), 250);
    return () => clearTimeout(t);
  }, [fetchThreads]);

  useEffect(() => {
    if (
      deepId &&
      (deepKind === 'order' || deepKind === 'inquiry' || deepKind === 'support')
    ) {
      void openThread(deepKind, deepId);
    }
  }, [deepId, deepKind, openThread]);

  const bubbleClass = (direction: string, isInternal?: boolean) => {
    if (isInternal || direction === 'internal') {
      return 'bg-amber-50 border border-amber-200 dark:bg-amber-950/30 dark:border-amber-800';
    }
    if (direction === 'buyer' || direction === 'user' || direction === 'inbound') {
      return 'bg-background border border-border';
    }
    if (direction === 'seller' || direction === 'outbound') {
      return 'bg-sky-50 border border-sky-200/80 dark:bg-sky-950/25 dark:border-sky-900';
    }
    if (direction === 'staff') {
      return 'bg-orange-50 border border-orange-200/70 dark:bg-orange-950/25 dark:border-orange-900';
    }
    return 'bg-muted border border-border';
  };

  const kindBadge = (k: string) => {
    if (k === 'order') return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-100';
    if (k === 'inquiry') return 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-100';
    return 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-100';
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold flex items-center gap-2">
            <MessageCircle className="h-8 w-8 text-orange-600" />
            Messages
          </h1>
          <p className="text-muted-foreground mt-1">
            All platform chats — order messages, pre-order inquiries, and support threads.
            Sent and received messages are fully visible to admin / CS.
          </p>
        </div>
        <Button variant="outline" onClick={() => void fetchThreads()} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {KIND_TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.value}
              type="button"
              onClick={() => {
                setKind(tab.value);
                setSelected(null);
              }}
              className={`inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-full border transition ${
                kind === tab.value
                  ? 'bg-orange-600 text-white border-orange-600'
                  : 'border-border hover:bg-muted'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      <Input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search by email, name, gig title, or id…"
        className="max-w-xl"
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Thread list */}
        <div className="space-y-3">
          {loading ? (
            <p className="text-muted-foreground py-8 text-center">Loading conversations…</p>
          ) : threads.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                No conversations match your filters.
              </CardContent>
            </Card>
          ) : (
            threads.map((t) => (
              <Card
                key={`${t.kind}-${t.id}`}
                className={`cursor-pointer transition hover:border-orange-500 ${
                  selected?.id === t.id && selected?.kind === t.kind
                    ? 'ring-2 ring-orange-500'
                    : ''
                }`}
                onClick={() => void openThread(t.kind, t.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded ${kindBadge(t.kind)}`}
                        >
                          {t.kind}
                        </span>
                        <span className="font-medium truncate">{t.title}</span>
                      </div>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        {t.subtitle}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-[10px] text-muted-foreground block">
                        {t.messageCount} msg
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted">
                        {t.status}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                    <span className="text-[10px] uppercase text-muted-foreground/80 mr-1">
                      {t.lastDirection === 'inbound' || t.lastDirection === 'user'
                        ? '← received'
                        : t.lastDirection === 'outbound' ||
                            t.lastDirection === 'staff' ||
                            t.lastDirection === 'seller'
                          ? '→ sent'
                          : ''}
                    </span>
                    {t.lastPreview}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {new Date(t.lastMessageAt).toLocaleString('es-CO', {
                      dateStyle: 'short',
                      timeStyle: 'short',
                    })}
                  </p>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Thread detail */}
        <div>
          {loadingDetail ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                Loading thread…
              </CardContent>
            </Card>
          ) : selected ? (
            <Card className="sticky top-4">
              <CardContent className="p-5 space-y-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <span
                      className={`text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded ${kindBadge(selected.kind)}`}
                    >
                      {selected.kind}
                    </span>
                    <h2 className="font-semibold text-lg mt-1">{selected.title}</h2>
                    <p className="text-xs text-muted-foreground">
                      Status: {selected.status}
                    </p>
                    {selected.participants.buyer && (
                      <p className="text-xs mt-1">
                        <strong>Buyer:</strong>{' '}
                        {selected.participants.buyer.name || '—'} (
                        {selected.participants.buyer.email})
                      </p>
                    )}
                    {selected.participants.seller && (
                      <p className="text-xs">
                        <strong>Seller:</strong>{' '}
                        {selected.participants.seller.name || '—'} (
                        {selected.participants.seller.email})
                      </p>
                    )}
                    {selected.participants.user && (
                      <p className="text-xs mt-1">
                        <strong>User:</strong>{' '}
                        {selected.participants.user.name || '—'} (
                        {selected.participants.user.email})
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col gap-1 shrink-0">
                    {selected.link && (
                      <Link href={selected.link} target="_blank" rel="noreferrer">
                        <Button size="sm" variant="outline" className="gap-1">
                          <ExternalLink className="h-3.5 w-3.5" />
                          Open
                        </Button>
                      </Link>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setSelected(null)}
                    >
                      Close
                    </Button>
                  </div>
                </div>

                <div className="max-h-[60vh] overflow-y-auto space-y-2 rounded-lg border bg-muted/20 p-3">
                  {selected.messages.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-6">
                      No messages in this conversation.
                    </p>
                  ) : (
                    selected.messages.map((m) => (
                      <div
                        key={m.id}
                        className={`rounded-lg p-3 text-sm ${bubbleClass(m.direction, m.isInternal)}`}
                      >
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="text-[10px] uppercase tracking-wide font-medium text-muted-foreground flex items-center gap-1">
                            {m.isInternal || m.direction === 'internal' ? (
                              <>
                                <Lock className="h-3 w-3" />
                                {m.label}
                              </>
                            ) : (
                              m.label
                            )}
                          </span>
                          <span className="text-[10px] text-muted-foreground shrink-0">
                            {new Date(m.createdAt).toLocaleString('es-CO', {
                              dateStyle: 'short',
                              timeStyle: 'short',
                            })}
                          </span>
                        </div>
                        <p className="whitespace-pre-wrap">{m.body || (m.fileName ? '' : '—')}</p>
                        {m.fileUrl && (
                          <a
                            href={m.fileUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-orange-600 hover:underline mt-2"
                          >
                            <ExternalLink className="h-3 w-3" />
                            {m.fileName || 'Attachment'}
                          </a>
                        )}
                        <p className="text-[10px] text-muted-foreground mt-1.5">
                          {m.direction === 'buyer' || m.direction === 'user'
                            ? '← Received from user'
                            : m.direction === 'seller'
                              ? '→ Sent by seller / to buyer side'
                              : m.direction === 'staff'
                                ? '→ Sent by support'
                                : m.direction === 'internal'
                                  ? 'Staff only'
                                  : ''}
                        </p>
                      </div>
                    ))
                  )}
                </div>

                <p className="text-[11px] text-muted-foreground">
                  Full history shown in chronological order. Buyer/user messages are received;
                  seller and support messages are sent. Internal support notes are amber and
                  never shown to users.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="border border-dashed rounded-xl p-10 text-center text-muted-foreground">
              Select a conversation to read the full sent and received message history.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
