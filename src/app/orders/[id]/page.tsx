'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'react-hot-toast';
import { gigCategories } from '@/lib/gig-categories';
import { parseCustomFields } from '@/lib/utils';

export default function OrderDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const orderId = params.id as string;
  const { data: session } = useSession();

  const [order, setOrder] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [reviewText, setReviewText] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [existingReview, setExistingReview] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'chat' | 'progress' | 'review'>('overview');
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const isBuyer = order?.buyerId === session?.user?.id;
  const isSeller = order?.sellerId === session?.user?.id;
  const isCompleted = order?.status === 'Completed';

  useEffect(() => {
    if (!orderId) return;
    Promise.all([
      fetch(`/api/orders/${orderId}`).then(r => r.json()),
      fetch(`/api/orders/${orderId}/messages`).then(r => r.json().catch(() => ({ messages: [] }))),
      fetch(`/api/orders/${orderId}/review`).then(r => r.json().catch(() => ({ review: null })))
    ]).then(([orderData, msgData, reviewData]) => {
      setOrder(orderData.order || orderData);
      setMessages(msgData.messages || []);
      setExistingReview(reviewData.review || null);
      if (reviewData.review) {
        setReviewRating(reviewData.review.rating);
        setReviewText(reviewData.review.comment || '');
      }

      // Smart default tab
      const urlTab = searchParams.get('tab') as any;
      const needsReview = (orderData.order || orderData)?.status === 'Completed' && !reviewData.review;

      if (urlTab === 'review' && (orderData.order || orderData)?.status === 'Completed') {
        setActiveTab('review');
      } else if (needsReview) {
        setActiveTab('review');
      } else if (urlTab) {
        setActiveTab(urlTab);
      }

      setLoading(false);
    }).catch(() => setLoading(false));
  }, [orderId, searchParams]);

  // Auto-scroll chat to bottom when messages update
  useEffect(() => {
    if (activeTab === 'chat' && chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages, activeTab]);

  const sendMessage = useCallback(async () => {
    if (!newMessage.trim() || !orderId) return;
    try {
      const res = await fetch(`/api/orders/${orderId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newMessage })
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setMessages(prev => [...prev, data.message]);
      setNewMessage('');
      toast.success('✅ Mensaje enviado');
    } catch {
      toast.error('Error enviando mensaje');
    }
  }, [newMessage, orderId]);

  const uploadFile = useCallback(async (e: any) => {
    const file = e.target.files[0];
    if (!file || !orderId) return;
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await fetch(`/api/orders/${orderId}/messages`, { method: 'POST', body: formData });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setMessages(prev => [...prev, data.message]);
      toast.success('📎 Archivo subido');
    } catch {
      toast.error('Error subiendo archivo');
    }
  }, [orderId]);

  const updateStatus = async (status: string) => {
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      
      if (res.ok) {
        toast.success(`Estado actualizado: ${status}`);
        // Refetch order data
        const updatedOrder = await fetch(`/api/orders/${orderId}`).then(r => r.json());
        setOrder(updatedOrder.order || updatedOrder);
      } else {
        toast.error('Error actualizando estado');
      }
    } catch {
      toast.error('Error actualizando');
    }
  };

  const submitReview = async () => {
    if (!reviewText.trim()) return toast.error("Escribe una reseña");
    try {
      const res = await fetch(`/api/orders/${orderId}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating: reviewRating, comment: reviewText })
      });
      
      if (res.ok) {
        toast.success("¡Reseña enviada! Gracias por tu opinión.");
        // Refetch to update existingReview
        const reviewRes = await fetch(`/api/orders/${orderId}/review`).then(r => r.json());
        setExistingReview(reviewRes.review || null);
        setActiveTab('overview'); // Switch away after submitting
      } else {
        toast.error("Error enviando reseña");
      }
    } catch {
      toast.error("Error enviando reseña");
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-orange-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-lg text-muted-foreground">Cargando pedido...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-4xl mx-auto p-12 text-center">
        <p className="text-2xl text-red-600 mb-4">Pedido no encontrado</p>
        <a href="/orders" className="text-orange-600 hover:underline">Volver a mis pedidos →</a>
      </div>
    );
  }

  const categoryInfo = gigCategories.find(c => c.name === order.gig?.category) || {};
  const emoji = (categoryInfo as any).icon || (categoryInfo as any).emoji || '📦';
  const isCleaningGig = order.gig?.category?.toLowerCase().includes("limpieza");

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* HEADER */}
      <div className="mb-4">
        <a href="/orders" className="text-sm text-orange-600 hover:underline flex items-center gap-1">
          ← Volver a mis pedidos
        </a>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4 bg-white p-6 rounded-3xl shadow">
        <div className="flex items-center gap-4">
          <span className="text-6xl">{emoji}</span>
          <div>
            <h1 className="text-3xl font-bold">Pedido #{order.id.slice(0, 8)}</h1>
            <p className="text-xl text-foreground">{order.gig?.title}</p>
            <p className="text-sm text-muted-foreground mt-1">
              {isBuyer ? 'Vendedor' : 'Comprador'}: {isBuyer ? (order.seller?.businessName || order.seller?.name) : (order.buyer?.name)}
            </p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-5xl font-bold text-orange-600">
            ${Number(order.price || 0).toLocaleString('es-CO')}
          </div>
          <div className="text-sm uppercase tracking-widest text-muted-foreground mt-1">
            {order.status}
          </div>
        </div>
      </div>

      {/* DEV TESTING - Force Order Status */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mb-6 p-4 border-2 border-dashed border-orange-500 rounded-2xl bg-orange-50 dark:bg-orange-950/40">
          <div className="font-semibold text-orange-700 dark:text-orange-400 mb-3 flex items-center gap-2">
            🧪 DEV TESTING — Force Order Status
          </div>
          <div className="flex flex-wrap gap-2">
            {['Pending', 'Paid', 'In Progress', 'Completed', 'Cancelled'].map((s) => (
              <Button
                key={s}
                size="sm"
                variant={order.status === s ? "default" : "outline"}
                onClick={() => updateStatus(s)}
                className={order.status === s ? "bg-orange-600 hover:bg-orange-700" : ""}
              >
                {s}
              </Button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Quickly jump between states to test seller dashboards, reviews, earnings, etc.
          </p>
        </div>
      )}

      {/* TABS */}
      <div className="flex border-b mb-8 bg-white rounded-t-2xl">
        {[
          { key: 'overview', label: '📋 Resumen' },
          { key: 'chat', label: '💬 Chat' },
          { key: 'progress', label: '📈 Progreso' },
          ...(isCompleted && isBuyer ? [{ key: 'review', label: '⭐ Reseña' }] : [])
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`flex-1 md:flex-none px-8 py-5 font-medium text-lg border-b-4 transition-all ${
              activeTab === tab.key ? 'border-orange-600 text-orange-600' : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* OVERVIEW + BEFORE/AFTER */}
      {activeTab === 'overview' && (
        <div className="grid md:grid-cols-12 gap-8">
          <div className="md:col-span-8">
            <Card>
              <CardHeader><CardTitle>Detalles del Servicio</CardTitle></CardHeader>
              <CardContent className="space-y-4 pt-6">
                {Object.entries(parseCustomFields(order.customFields)).map(([key, val]) => (
                  <div key={key} className="flex justify-between py-4 border-b last:border-0 text-lg">
                    <span className="capitalize text-foreground">{key.replace(/([A-Z])/g, ' $1')}</span>
                    <span className="font-semibold">{String(val)}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            {isCleaningGig && (
              <Card className="mt-8">
                <CardHeader><CardTitle>📸 Antes y Después</CardTitle></CardHeader>
                <CardContent className="text-muted-foreground py-8 text-center">
                  El vendedor subirá fotos aquí una vez completado.
                </CardContent>
              </Card>
            )}
          </div>

          <div className="md:col-span-4">
            <Card>
              <CardHeader><CardTitle>Acciones</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {isSeller && (
                  <>
                    {order.status === 'Pending' && (
                      <Button onClick={() => updateStatus('In Progress')} className="w-full bg-blue-600 hover:bg-blue-700">🚀 Aceptar e Iniciar</Button>
                    )}
                    {['Pending', 'In Progress'].includes(order.status) && (
                      <Button onClick={() => updateStatus('Completed')} className="w-full">✅ Marcar como Completado</Button>
                    )}
                    {order.status !== 'Completed' && order.status !== 'Cancelled' && (
                      <Button onClick={() => updateStatus('Cancelled')} variant="outline" className="w-full text-red-600 border-red-200 hover:bg-red-50">Cancelar Pedido</Button>
                    )}
                  </>
                )}
                {!isSeller && !isCompleted && (
                  <p className="text-sm text-muted-foreground text-center py-2">El vendedor actualizará el progreso aquí.</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* CHAT - Improved */}
      {activeTab === 'chat' && (
        <Card className="h-[620px] flex flex-col shadow-lg overflow-hidden">
          <CardHeader className="border-b">
            <CardTitle className="flex items-center gap-2">💬 Chat en Vivo</CardTitle>
            <p className="text-sm text-muted-foreground">Comunicación directa con {isBuyer ? 'el vendedor' : 'el comprador'}</p>
          </CardHeader>
          
          <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-6 space-y-4 bg-muted/30">
            {messages.length === 0 && (
              <div className="text-center py-16 text-muted-foreground">
                <div className="text-4xl mb-3">💬</div>
                <p>No hay mensajes aún.</p>
                <p className="text-sm mt-1">¡Envía el primero para coordinar!</p>
              </div>
            )}
            {messages.map((msg: any, idx: number) => {
              const isMine = msg.senderId === session?.user?.id;
              return (
                <div key={msg.id || idx} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] px-4 py-3 rounded-2xl text-[15px] ${
                    isMine ? 'bg-orange-600 text-white' : 'bg-background border shadow-sm'
                  }`}>
                    {!isMine && (
                      <div className="text-[12px] opacity-70 mb-0.5 font-medium text-muted-foreground">
                        {isBuyer ? 'Vendedor' : 'Comprador'}
                      </div>
                    )}
                    {msg.content && <div>{msg.content}</div>}
                    {msg.fileUrl && (
                      <div className="mt-2">
                        <a href={msg.fileUrl} target="_blank" rel="noopener noreferrer" className="block">
                          {msg.fileUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                            <img src={msg.fileUrl} alt="adjunto" className="max-h-48 rounded-xl" />
                          ) : (
                            <span className="underline">📎 Ver archivo adjunto</span>
                          )}
                        </a>
                      </div>
                    )}
                    <div className={`text-[10px] mt-1.5 opacity-70 ${isMine ? 'text-right' : ''}`}>
                      {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }) : ''}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-4 border-t bg-white flex gap-2 items-end">
            <label className="cursor-pointer flex items-center justify-center w-11 h-11 border rounded-2xl hover:bg-gray-100 text-xl flex-shrink-0" title="Adjuntar archivo">
              📎
              <input type="file" onChange={uploadFile} className="hidden" />
            </label>
            <Textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Escribe un mensaje..."
              className="flex-1 resize-y min-h-[44px] max-h-[120px] text-base"
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), sendMessage())}
            />
            <Button onClick={sendMessage} disabled={!newMessage.trim()} className="px-7 h-[44px]">
              Enviar
            </Button>
          </div>
        </Card>
      )}

      {/* PROGRESS TIMELINE */}
      {activeTab === 'progress' && (
        <Card className="shadow-lg">
          <CardHeader><CardTitle>📈 Progreso del Pedido</CardTitle></CardHeader>
          <CardContent className="pt-8">
            <div className="space-y-10 relative pl-8 before:absolute before:left-4 before:top-0 before:bottom-0 before:w-0.5 before:bg-gray-200">
              {[
                { step: "Pedido creado", date: order.createdAt, done: true },
                { step: "En progreso", date: null, done: order.status === 'In Progress' || isCompleted },
                { step: "Trabajo completado", date: null, done: isCompleted },
              ].map((s, i) => (
                <div key={i} className="flex gap-6 relative">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${s.done ? 'bg-green-500 text-white' : 'bg-gray-200'}`}>
                    {s.done ? '✓' : i+1}
                  </div>
                  <div>
                    <p className={`font-semibold ${s.done ? 'text-green-600' : ''}`}>{s.step}</p>
                    {s.date && <p className="text-sm text-muted-foreground">{new Date(s.date).toLocaleString('es-CO')}</p>}
                  </div>
                </div>
              ))}
            </div>

            {isSeller && (
              <div className="mt-12 flex flex-wrap gap-3">
                {order.status !== 'In Progress' && order.status !== 'Completed' && (
                  <Button onClick={() => updateStatus('In Progress')} size="lg">🚀 Iniciar Trabajo</Button>
                )}
                {order.status !== 'Completed' && (
                  <Button onClick={() => updateStatus('Completed')} size="lg">✅ Marcar Completado</Button>
                )}
                {order.status !== 'Cancelled' && order.status !== 'Completed' && (
                  <Button onClick={() => updateStatus('Cancelled')} size="lg" variant="outline" className="text-red-600">Cancelar</Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* REVIEW */}
      {activeTab === 'review' && isBuyer && isCompleted && (
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>
              {existingReview ? '⭐ Tu reseña' : '⭐ ¿Cómo te fue con el servicio?'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {existingReview ? (
              <div className="bg-green-50 border border-green-200 rounded-2xl p-6">
                <div className="flex gap-1 text-3xl mb-4">
                  {[1,2,3,4,5].map(n => (
                    <span key={n}>{n <= existingReview.rating ? '⭐' : '☆'}</span>
                  ))}
                </div>
                <p className="text-foreground text-lg">
                  {existingReview.comment || "No dejaste comentario."}
                </p>
                <p className="text-xs text-muted-foreground mt-4">
                  Enviada el {new Date(existingReview.createdAt).toLocaleDateString('es-CO')}
                </p>
              </div>
            ) : (
              <>
                <div className="flex gap-1 text-5xl">
                  {[1,2,3,4,5].map(n => (
                    <button 
                      key={n} 
                      onClick={() => setReviewRating(n)} 
                      className="hover:scale-125 transition active:scale-95"
                    >
                      {n <= reviewRating ? '⭐' : '☆'}
                    </button>
                  ))}
                </div>
                <p className="text-sm text-muted-foreground -mt-1">Tu calificación: {reviewRating} / 5</p>
                <Textarea
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  placeholder="Cuéntanos tu experiencia con el servicio..."
                  className="min-h-[160px]"
                />
                <Button onClick={submitReview} className="w-full py-6 text-lg">Publicar Reseña</Button>
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
