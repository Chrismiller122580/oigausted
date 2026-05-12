'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'react-hot-toast';
import { gigCategories } from '@/lib/gig-categories';

export default function OrderDetailPage() {
  const params = useParams();
  const orderId = params.id as string;
  const router = useRouter();
  const { data: session } = useSession();

  const [order, setOrder] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [reviewText, setReviewText] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'chat' | 'progress' | 'review'>('overview');

  const isBuyer = order?.buyerId === session?.user?.id;
  const isSeller = order?.sellerId === session?.user?.id;
  const isCompleted = order?.status === 'Completed';

  // Fetch order + messages
  useEffect(() => {
    if (!orderId) return;
    Promise.all([
      fetch(`/api/orders/${orderId}`).then(r => r.json()),
      fetch(`/api/orders/${orderId}/messages`).then(r => r.json().catch(() => ({ messages: [] })))
    ]).then(([orderData, msgData]) => {
      setOrder(orderData.order || orderData);
      setMessages(msgData.messages || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [orderId]);

  const sendMessage = useCallback(async () => {
    if (!newMessage.trim() || !orderId) return;
    try {
      const res = await fetch(`/api/orders/${orderId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newMessage })
      });
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      setMessages(prev => [...prev, data.message]);
      setNewMessage('');
      toast.success('✅ Mensaje enviado');
    } catch (e) {
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
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      setMessages(prev => [...prev, data.message]);
      toast.success('📎 Archivo subido');
    } catch (e) {
      toast.error('Error subiendo archivo');
    }
  }, [orderId]);

  const updateStatus = async (status: string) => {
    try {
      await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      toast.success(`Estado actualizado: ${status}`);
      window.location.reload();
    } catch (e) {
      toast.error('Error actualizando');
    }
  };

  const submitReview = async () => {
    if (!reviewText.trim()) return toast.error("Escribe una reseña");
    try {
      await fetch(`/api/orders/${orderId}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating: reviewRating, comment: reviewText })
      });
      toast.success("¡Reseña enviada! Gracias");
      setReviewText('');
      window.location.reload();
    } catch (e) {
      toast.error("Error enviando reseña");
    }
  };

  if (loading) return <div className="p-20 text-center text-2xl">Cargando pedido...</div>;
  if (!order) return <div className="p-20 text-center text-red-600">Pedido no encontrado</div>;

  const categoryInfo = gigCategories.find(c => c.name === order.gig?.category) || {};
  const emoji = (categoryInfo as any).icon || (categoryInfo as any).emoji || '📦';
  const isCleaningGig = order.gig?.category?.includes("Limpieza");

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4 bg-white p-6 rounded-3xl shadow">
        <div className="flex items-center gap-4">
          <span className="text-6xl">{emoji}</span>
          <div>
            <h1 className="text-3xl font-bold">Pedido #{order.id.slice(0, 8)}</h1>
            <p className="text-xl text-gray-600">{order.gig?.title}</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-5xl font-bold text-orange-600">
            ${Number(order.price || 0).toLocaleString('es-CO')}
          </div>
          <div className="text-sm uppercase tracking-widest text-gray-500 mt-1">
            {order.status}
          </div>
        </div>
      </div>

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
              activeTab === tab.key ? 'border-orange-600 text-orange-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="grid md:grid-cols-12 gap-8">
          <div className="md:col-span-8">
            <Card>
              <CardHeader><CardTitle>Detalles del Servicio</CardTitle></CardHeader>
              <CardContent className="space-y-4 pt-6">
                {Object.entries(order.customFields || {}).map(([key, val]) => (
                  <div key={key} className="flex justify-between py-4 border-b last:border-0 text-lg">
                    <span className="capitalize text-gray-700">{key.replace(/([A-Z])/g, ' $1')}</span>
                    <span className="font-semibold">{String(val)}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            {isCleaningGig && (
              <Card className="mt-8">
                <CardHeader><CardTitle>📸 Antes y Después</CardTitle></CardHeader>
                <CardContent className="text-gray-500">
                  El vendedor subirá fotos aquí una vez completado el servicio.
                </CardContent>
              </Card>
            )}
          </div>

          <div className="md:col-span-4 space-y-6">
            <Card>
              <CardHeader><CardTitle>Acciones</CardTitle></CardHeader>
              <CardContent className="space-y-3 pt-2">
                {isSeller && (
                  <>
                    <Button onClick={() => updateStatus('In Progress')} className="w-full text-lg py-6">🚀 Iniciar Trabajo</Button>
                    <Button onClick={() => updateStatus('Completed')} variant="default" className="w-full text-lg py-6">✅ Marcar como Completado</Button>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* CHAT */}
      {activeTab === 'chat' && (
        <Card className="h-[650px] flex flex-col shadow-lg">
          <CardHeader><CardTitle>💬 Chat en Vivo</CardTitle></CardHeader>
          <CardContent className="flex-1 overflow-y-auto p-6 space-y-5 bg-gray-50">
            {messages.length === 0 && <div className="text-center py-20 text-gray-400">No hay mensajes aún. ¡Escribe el primero!</div>}
            {messages.map((msg: any) => (
              <div key={msg.id} className={`flex ${msg.senderId === session?.user?.id ? 'justify-end' : ''}`}>
                <div className={`max-w-[80%] px-5 py-3.5 rounded-3xl text-[17px] ${msg.senderId === session?.user?.id ? 'bg-orange-600 text-white' : 'bg-white border shadow-sm'}`}>
                  {msg.content}
                  {msg.fileUrl && (
                    <div className="mt-3">
                      <a href={msg.fileUrl} target="_blank" rel="noopener noreferrer">
                        {msg.fileUrl.match(/\.(jpg|jpeg|png|gif)$/i) ? (
                          <img src={msg.fileUrl} alt="preview" className="max-h-48 rounded-xl cursor-pointer border" />
                        ) : (
                          <span className="text-blue-200 underline">📎 Ver archivo</span>
                        )}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
          <div className="p-5 border-t bg-white flex gap-3">
            <label className="cursor-pointer px-5 py-3 border rounded-2xl hover:bg-gray-100 text-2xl">📎</label>
            <input type="file" onChange={uploadFile} className="hidden" />
            <Textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Escribe aquí..."
              className="flex-1 resize-y min-h-[52px] text-base"
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), sendMessage())}
            />
            <Button onClick={sendMessage} className="px-8">Enviar</Button>
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
                    {s.date && <p className="text-sm text-gray-500">{new Date(s.date).toLocaleString('es-CO')}</p>}
                  </div>
                </div>
              ))}
            </div>
            {isSeller && (
              <div className="mt-12 flex gap-4">
                <Button onClick={() => updateStatus('In Progress')} size="lg">🚀 En Progreso</Button>
                <Button onClick={() => updateStatus('Completed')} size="lg" variant="default">✅ Completado</Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* REVIEW */}
      {activeTab === 'review' && isBuyer && isCompleted && (
        <Card className="max-w-2xl mx-auto">
          <CardHeader><CardTitle>⭐ ¿Cómo te fue con el servicio?</CardTitle></CardHeader>
          <CardContent className="space-y-6">
            <div className="flex gap-2 text-4xl">
              {[1,2,3,4,5].map(n => (
                <button key={n} onClick={() => setReviewRating(n)} className="hover:scale-110 transition">
                  {n <= reviewRating ? '⭐' : '☆'}
                </button>
              ))}
            </div>
            <Textarea
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              placeholder="Cuéntanos tu experiencia..."
              className="min-h-[160px]"
            />
            <Button onClick={submitReview} className="w-full py-6 text-lg">Publicar Reseña</Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
