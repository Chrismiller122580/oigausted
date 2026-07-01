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
import OnboardingTutorial from '@/components/common/OnboardingTutorial';
import { markTutorialDismissed } from '@/lib/tutorial';
import { ShoppingBag, Briefcase } from 'lucide-react';

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

  // Tutorial state
  const [showTutorial, setShowTutorial] = useState(false);
  const [tutorialMode, setTutorialMode] = useState<'buyer' | 'seller'>('buyer');

  // Dynamic FAQs (controlled from Admin > Settings)
  const [faqs, setFaqs] = useState<{ id: string; question: string; answer: string; category?: string | null }[]>([]);

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

  // Load active FAQs (managed in admin)
  useEffect(() => {
    fetch('/api/faqs')
      .then(r => r.json())
      .then(d => setFaqs(d.faqs || []))
      .catch(() => setFaqs([]));
  }, []);

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
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'No se pudo enviar el ticket');
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
    <div className="bg-background text-foreground py-8">
      <div className="max-w-4xl mx-auto px-6">
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

        {/* FAQ & How-To - Full training and self-service support */}
        <div className="mt-12">
          <h2 className="text-3xl font-bold mb-2">Centro de Ayuda y Capacitación</h2>
          <p className="text-muted-foreground mb-6">Respuestas rápidas, guías paso a paso y tutoriales interactivos para que aproveches OigaGIG al máximo.</p>

          {/* FAQ */}
          <div className="mb-10">
            <h3 className="text-xl font-semibold mb-4">Preguntas Frecuentes (FAQ)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {faqs.length > 0 ? (
                faqs.map((f) => (
                  <Card key={f.id} className="bg-card border-border">
                    <CardContent className="p-5">
                      <p className="font-semibold mb-1">{f.question}</p>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">{f.answer}</p>
                      {f.category && <span className="text-[10px] text-muted-foreground mt-2 inline-block">Categoría: {f.category}</span>}
                    </CardContent>
                  </Card>
                ))
              ) : (
                // Fallback static (in case API empty or during first load before admin seeds)
                <>
                  <Card className="bg-card border-border">
                    <CardContent className="p-5">
                      <p className="font-semibold mb-1">¿Cómo pago con Nequi o PayU?</p>
                      <p className="text-sm text-muted-foreground">En la página de checkout selecciona Nequi (recomendado para pagos instantáneos), PSE o PayU. El dinero se retiene seguro y se libera al vendedor solo cuando marques el pedido como completado.</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-card border-border">
                    <CardContent className="p-5">
                      <p className="font-semibold mb-1">¿Cómo contacto al vendedor?</p>
                      <p className="text-sm text-muted-foreground">Usa &quot;Chatear en OigaGIG&quot; en el servicio o perfil del vendedor para preguntar antes de comprar. Después del pago, coordina la entrega en el chat del pedido (/orders/[id]).</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-card border-border">
                    <CardContent className="p-5">
                      <p className="font-semibold mb-1">¿Puedo cancelar un pedido?</p>
                      <p className="text-sm text-muted-foreground">Solo los compradores pueden cancelar pedidos en estado "Pending" o "Paid". Los vendedores pueden actualizar a "In Progress" o "Completed". Una vez en progreso o completado no se puede cancelar unilateralmente.</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-card border-border">
                    <CardContent className="p-5">
                      <p className="font-semibold mb-1">¿Cómo me convierto en vendedor?</p>
                      <p className="text-sm text-muted-foreground">Ve a tu Perfil → "Convertirme en Vendedor", completa el nombre del negocio y confirma. Luego ve al Dashboard de Vendedor para crear tu primer gig y configurar tu perfil público.</p>
                    </CardContent>
                  </Card>
                </>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-2">Las FAQs son gestionadas por el equipo en Admin → Settings. ¿Falta alguna? Envía un ticket o usa el centro de ayuda.</p>
          </div>

          {/* How-To Quick Guides */}
          <div className="mb-6">
            <h3 className="text-xl font-semibold mb-4">Guías Rápidas (Cómo hacerlo)</h3>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Buyer How-To */}
              <Card className="border-orange-200 dark:border-orange-900/50">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-900/40 text-orange-600 flex items-center justify-center">
                      <ShoppingBag size={20} />
                    </div>
                    <div>
                      <div className="font-semibold text-lg">Para Compradores (4 pasos)</div>
                      <div className="text-xs text-muted-foreground">Nuevo en OigaGIG</div>
                    </div>
                  </div>
                  <ol className="list-decimal ml-5 space-y-2 text-sm">
                    <li><strong>Explora gigs:</strong> Ve a /gigs, filtra por categoría, precio o cerca de ti usando ubicación.</li>
                    <li><strong>Contacta:</strong> Lee reseñas y usa el chat de OigaGIG antes de pagar (sin compartir teléfonos ni correos).</li>
                    <li><strong>Paga seguro:</strong> Elige Nequi/PayU en checkout. Tu dinero está protegido hasta que confirmes el servicio.</li>
                    <li><strong>Sigue y califica:</strong> Revisa estado en "Mis Pedidos". Al completar, deja una reseña honesta para ayudar a la comunidad.</li>
                  </ol>
                  <Button 
                    onClick={() => { setTutorialMode('buyer'); setShowTutorial(true); }} 
                    className="mt-5 w-full"
                    variant="outline"
                  >
                    Abrir tutorial interactivo completo para Compradores
                  </Button>
                </CardContent>
              </Card>

              {/* Seller How-To */}
              <Card className="border-orange-200 dark:border-orange-900/50">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-900/40 text-orange-600 flex items-center justify-center">
                      <Briefcase size={20} />
                    </div>
                    <div>
                      <div className="font-semibold text-lg">Para Vendedores (5 pasos)</div>
                      <div className="text-xs text-muted-foreground">Al convertirte en vendedor desbloqueas estas herramientas</div>
                    </div>
                  </div>
                  <ol className="list-decimal ml-5 space-y-2 text-sm">
                    <li><strong>Configura tu negocio:</strong> En Perfil completa nombre del negocio, ubicación y foto de portada. Tu URL pública (slug) se genera automáticamente. Los compradores te escriben por Mensajes en la app.</li>
                    <li><strong>Crea gigs:</strong> Publica servicios con precio base + campos dinámicos (horas, habitaciones, etc.). Sube fotos atractivas.</li>
                    <li><strong>Recibe y gestiona pedidos:</strong> Te notificamos. Acepta, chatea con el cliente y actualiza estado a "En Progreso" → "Completado".</li>
                    <li><strong>Cobra:</strong> Al completar liberamos el pago a tu cuenta (Nequi configurado). Revisa ganancias y referidos.</li>
                    <li><strong>Construye reputación:</strong> Comparte tu enlace público /sellers/tu-slug. Responde rápido y recolecta reseñas excelentes.</li>
                  </ol>
                  <Button 
                    onClick={() => { setTutorialMode('seller'); setShowTutorial(true); }} 
                    className="mt-5 w-full bg-orange-600 hover:bg-orange-700"
                  >
                    Abrir tutorial interactivo completo para Vendedores
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>

          <p className="text-xs text-center text-muted-foreground">¿Quieres ver el tutorial otra vez? Usa los botones de arriba en cualquier momento. Los tutoriales también aparecen automáticamente para usuarios nuevos y cuando un comprador se convierte en vendedor.</p>
        </div>

        <div className="mt-8 text-center text-xs text-muted-foreground">
          Los tickets se responden generalmente en 24-48 horas hábiles. Para emergencias, contacta directamente al email de soporte.
        </div>
      </div>

      {/* Tutorial Modal */}
      {showTutorial && (
        <OnboardingTutorial
          mode={tutorialMode}
          onComplete={() => {
            const uid = session?.user?.id;
            if (uid) markTutorialDismissed(tutorialMode, uid);
            setShowTutorial(false);
            toast.success('¡Gracias! Tutorial completado. ¡Éxito con OigaGIG!');
          }}
          onClose={() => {
            const uid = session?.user?.id;
            if (uid) markTutorialDismissed(tutorialMode, uid);
            setShowTutorial(false);
          }}
        />
      )}
    </div>
  );
}
