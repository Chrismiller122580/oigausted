'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  updatedAt: string;
  resolvedAt: string | null;
}

const CATEGORIES = [
  { value: 'payment', label: 'Pagos y Wompi' },
  { value: 'gig', label: 'Gigs y Servicios' },
  { value: 'account', label: 'Cuenta y Perfil' },
  { value: 'technical', label: 'Problemas Técnicos' },
  { value: 'order', label: 'Pedidos y Entregas' },
  { value: 'other', label: 'Otro' },
];

const PRIORITIES = [
  { value: 'low', label: 'Baja' },
  { value: 'medium', label: 'Media' },
  { value: 'high', label: 'Alta' },
  { value: 'urgent', label: 'Urgente' },
];

export default function SupportPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [category, setCategory] = useState('other');
  const [priority, setPriority] = useState('medium');

  // Redirect if not logged in
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/support');
    }
  }, [status, router]);

  const fetchMyTickets = async () => {
    if (!session?.user) return;
    try {
      const res = await fetch('/api/support/tickets');
      if (res.ok) {
        const data = await res.json();
        setTickets(data.tickets || []);
      }
    } catch (e) {
      console.error('Failed to load tickets', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session?.user) {
      fetchMyTickets();
    }
  }, [session]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) {
      toast.error('Por favor completa el asunto y el mensaje');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/support/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, message, category, priority }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al enviar');

      toast.success('¡Ticket enviado! Te responderemos pronto.');
      
      // Reset form
      setSubject('');
      setMessage('');
      setCategory('other');
      setPriority('medium');

      // Refresh list
      fetchMyTickets();
    } catch (err: any) {
      toast.error(err.message || 'No se pudo enviar el ticket');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-blue-500';
      case 'in_progress': return 'bg-yellow-500';
      case 'resolved': return 'bg-green-500';
      case 'closed': return 'bg-gray-500';
      default: return 'bg-gray-400';
    }
  };

  if (status === 'loading' || !session?.user) {
    return (
      <div className="min-h-screen bg-background text-foreground p-8 flex items-center justify-center">
        <div>Cargando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-5xl font-bold">Soporte</h1>
          <p className="text-muted-foreground mt-2 text-xl">
            Envía un ticket al equipo de administración. Te responderemos lo antes posible.
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            También puedes contactarnos por email en <a href="mailto:support@oigagig.com" className="text-orange-600 hover:underline">support@oigagig.com</a>
          </p>
        </div>

        {/* Submit Form */}
        <Card className="bg-card border-border mb-10">
          <CardContent className="p-8">
            <h2 className="text-2xl font-semibold mb-6">Enviar nuevo ticket</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="subject">Asunto *</Label>
                <Input
                  id="subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Ej: Problema con el pago de mi pedido"
                  required
                  maxLength={120}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="category">Categoría</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map(c => (
                        <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="priority">Prioridad</Label>
                  <Select value={priority} onValueChange={setPriority}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PRIORITIES.map(p => (
                        <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="message">Descripción del problema *</Label>
                <Textarea
                  id="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Describe tu problema con el mayor detalle posible. Incluye capturas o IDs de pedidos/gigs si aplica."
                  rows={6}
                  required
                  maxLength={2000}
                />
                <p className="text-xs text-muted-foreground mt-1">{message.length}/2000 caracteres</p>
              </div>

              <Button type="submit" disabled={submitting || !subject.trim() || !message.trim()} className="w-full md:w-auto">
                {submitting ? 'Enviando...' : 'Enviar Ticket de Soporte'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* My Tickets */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-semibold">Mis Tickets</h2>
            <Button variant="outline" size="sm" onClick={fetchMyTickets} disabled={loading}>
              Actualizar
            </Button>
          </div>

          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Cargando tus tickets...</div>
          ) : tickets.length === 0 ? (
            <Card className="bg-card border-border">
              <CardContent className="p-8 text-center text-muted-foreground">
                Aún no has enviado ningún ticket de soporte.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {tickets.map((ticket) => (
                <Card key={ticket.id} className="bg-card border-border">
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-lg">{ticket.subject}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full text-white ${getStatusColor(ticket.status)}`}>
                            {ticket.status}
                          </span>
                          <span className="text-xs px-2 py-0.5 bg-muted rounded text-muted-foreground">
                            {ticket.priority}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {new Date(ticket.createdAt).toLocaleDateString('es-CO')} • Categoría: {ticket.category || 'Otro'}
                        </p>
                        <p className="text-sm whitespace-pre-wrap mb-3">{ticket.message}</p>

                        {ticket.adminReply && (
                          <div className="mt-4 p-4 bg-muted/50 rounded border-l-4 border-orange-500">
                            <p className="text-xs font-medium text-muted-foreground mb-1">RESPUESTA DEL EQUIPO:</p>
                            <p className="text-sm whitespace-pre-wrap">{ticket.adminReply}</p>
                            {ticket.resolvedAt && (
                              <p className="text-xs text-muted-foreground mt-2">
                                Resuelto el {new Date(ticket.resolvedAt).toLocaleDateString('es-CO')}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        <div className="mt-8 text-center text-xs text-muted-foreground">
          Los tickets se responden generalmente en 24-48 horas hábiles. Para emergencias, contacta directamente al email de soporte.
        </div>
      </div>
    </div>
  );
}
