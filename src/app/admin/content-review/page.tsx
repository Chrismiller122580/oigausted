'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';

interface ReviewFlag {
  id: string;
  targetType: string;
  targetId: string;
  reason: string;
  matches: string[];
  snippet: string;
  status: string;
  createdAt: string;
}

export default function AdminContentReviewPage() {
  const [flags, setFlags] = useState<ReviewFlag[]>([]);
  const [status, setStatus] = useState('pending');
  const [loading, setLoading] = useState(true);

  const load = async (nextStatus = status) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/content-review?status=${encodeURIComponent(nextStatus)}`);
      const data = await res.json();
      setFlags(data.flags || []);
    } catch {
      toast.error('No se pudo cargar la cola');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(status);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const decide = async (id: string, next: 'cleared' | 'removed') => {
    try {
      const res = await fetch('/api/admin/content-review', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: next }),
      });
      if (!res.ok) {
        toast.error('No se pudo actualizar');
        return;
      }
      toast.success(next === 'cleared' ? 'Marcado como permitido' : 'Retirado');
      load();
    } catch {
      toast.error('Error');
    }
  };

  return (
    <div className="bg-background text-foreground max-w-5xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Revision de contenido</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Anuncios y perfiles marcados por contenido para adultos. Los gigs quedan pausados hasta que decida.
          </p>
        </div>
        <select
          className="border border-border rounded-md bg-background px-3 py-2 text-sm"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="pending">Pendientes</option>
          <option value="cleared">Permitidos</option>
          <option value="removed">Retirados</option>
          <option value="all">Todos</option>
        </select>
      </div>

      {loading ? (
        <p className="text-muted-foreground">Cargando...</p>
      ) : flags.length === 0 ? (
        <p className="text-muted-foreground">No hay elementos en esta cola.</p>
      ) : (
        <div className="space-y-4">
          {flags.map((flag) => (
            <Card key={flag.id} className="bg-card border-border">
              <CardContent className="p-5 space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs uppercase tracking-wide px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-200">
                    {flag.reason}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-muted">{flag.targetType}</span>
                  <span className="text-xs text-muted-foreground">{new Date(flag.createdAt).toLocaleString('es-CO')}</span>
                </div>
                <p className="text-sm whitespace-pre-wrap">{flag.snippet}</p>
                {flag.matches?.length > 0 && (
                  <p className="text-xs text-muted-foreground">Coincidencias: {flag.matches.join(', ')}</p>
                )}
                <div className="flex flex-wrap gap-2">
                  {flag.targetType === 'gig' && (
                    <a href={`/gigs/${flag.targetId}`} target="_blank" rel="noreferrer">
                      <Button variant="outline" size="sm">Ver gig</Button>
                    </a>
                  )}
                  {flag.status === 'pending' && (
                    <>
                      <Button size="sm" variant="outline" onClick={() => decide(flag.id, 'cleared')}>Permitir</Button>
                      <Button size="sm" variant="destructive" onClick={() => decide(flag.id, 'removed')}>Retirar</Button>
                    </>
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
