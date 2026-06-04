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
      toast.error('Error cargando tickets');
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

      toast.success('Ticket actualizado');
      closeDetail();
      fetchTickets(); // refresh list
    } catch (e) {
      toast.error('No se pudo actualizar el ticket');
    } finally {
      setUpdating(false);
    }
  };

  const getStatusColor = (status: string) => {
    if (status === 'open') return 'bg-blue-500';
    if (status === 'in_progress') return 'bg-yellow-500';
    if (status === 'resolved') return 'bg-green-500';
    return 'bg-gray-500';
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
            <h1 className="text-5xl font-bold">Soporte</h1>
            <p className="text-muted-foreground mt-1">Gestiona tickets enviados por usuarios (compradores y vendedores)</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => fetchTickets()}>Actualizar</Button>
            <Button variant="outline" onClick={() => fetchTickets('open')}>Solo Abiertos</Button>
            <Link href="/admin/grok-build" className="inline-flex items-center px-4 py-2 border rounded text-sm hover:bg-muted">
              ✨ Abrir Grok Build
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">Cargando tickets...</div>
        ) : tickets.length === 0 ? (
          <Card className="bg-card border-border p-8 text-center">No hay tickets que coincidan.</Card>
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
                        ✨ Pedir ayuda a Grok
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
                      <Button variant="ghost" size="sm" onClick={closeDetail}>Cerrar</Button>
                    </div>

                    <div className="mb-4 text-sm">
                      <strong>De:</strong> {selectedTicket.user.email} ({selectedTicket.user.role})<br />
                      <strong>Asunto:</strong> {selectedTicket.subject}<br />
                      <strong>Categoría:</strong> {selectedTicket.category || 'N/A'} • <strong>Prioridad:</strong> {selectedTicket.priority}
                    </div>

                    <div className="mb-4">
                      <p className="text-xs text-muted-foreground mb-1">MENSAJE DEL USUARIO</p>
                      <div className="bg-muted p-3 rounded text-sm whitespace-pre-wrap">{selectedTicket.message}</div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <Label>Estado</Label>
                        <select 
                          value={newStatus || selectedTicket.status} 
                          onChange={e => setNewStatus(e.target.value)}
                          className="w-full border rounded p-2 bg-background"
                        >
                          <option value="open">Abierto</option>
                          <option value="in_progress">En Progreso</option>
                          <option value="resolved">Resuelto</option>
                          <option value="closed">Cerrado</option>
                        </select>
                      </div>

                      <div>
                        <Label>Respuesta / Notas del Admin</Label>
                        <Textarea 
                          value={replyText} 
                          onChange={e => setReplyText(e.target.value)} 
                          rows={5} 
                          placeholder="Escribe tu respuesta aquí. Se enviará notificación al usuario."
                        />
                      </div>

                      <div className="flex gap-2">
                        <Button onClick={updateTicket} disabled={updating} className="flex-1">
                          {updating ? 'Guardando...' : 'Guardar Cambios y Notificar'}
                        </Button>
                        <Button variant="outline" onClick={() => askGrokForHelp(selectedTicket)}>
                          ✨ Ayuda de Grok
                        </Button>
                      </div>
                    </div>

                    {selectedTicket.adminReply && (
                      <div className="mt-4 p-3 bg-muted rounded text-sm">
                        <p className="text-xs font-medium mb-1">Respuesta actual:</p>
                        {selectedTicket.adminReply}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <div className="text-muted-foreground p-8 border border-dashed rounded text-center">
                  Selecciona un ticket para ver detalles y responder. <br />Usa el botón "Pedir ayuda a Grok" para que el asistente te ayude a redactar respuestas o diagnosticar problemas.
                </div>
              )}
            </div>
          </div>
        )}

        <div className="mt-8 text-xs text-muted-foreground">
          Los usuarios pueden enviar tickets desde <Link href="/support" className="underline">/support</Link>. Los cambios aquí envían notificaciones automáticas.
        </div>
      </div>
    </div>
  );
}

