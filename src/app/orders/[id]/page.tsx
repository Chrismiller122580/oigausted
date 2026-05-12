'use client';

import { useState, useEffect } from 'react';
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
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'chat' | 'progress'>('overview');

  const isBuyer = order?.buyerId === session?.user?.id;
  const isSeller = order?.sellerId === session?.user?.id;

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

  const sendMessage = async () => {
    if (!newMessage.trim()) return;
    try {
      const res = await fetch(`/api/orders/${orderId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newMessage })
      });
      const data = await res.json();
      setMessages(prev => [...prev, data.message]);
      setNewMessage('');
      toast.success('✅ Mensaje enviado');
    } catch (e) {
      toast.error('Error enviando mensaje');
    }
  };

  const uploadFile = async (e: any) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await fetch(`/api/orders/${orderId}/messages`, { method: 'POST', body: formData });
      const data = await res.json();
      setMessages(prev => [...prev, data.message]);
      toast.success('📎 Archivo subido');
    } catch (e) {
      toast.error('Error subiendo archivo');
    }
  };

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

  if (loading) return <div className="p-20 text-center text-2xl">Cargando pedido...</div>;
  if (!order) return <div className="p-20 text-center text-red-600">Pedido no encontrado</div>;

  const categoryInfo = gigCategories.find(c => c.name === order.gig?.category) || {};
  const emoji = (categoryInfo as any).icon || (categoryInfo as any).emoji || '📦';

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4 bg-white p-6 rounded-2xl shadow-sm border">
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
      <div className="flex border-b mb-8">
        {[
          { key: 'overview', label: '📋 Resumen' },
          { key: 'chat', label: '💬 Chat' },
          { key: 'progress', label: '📈 Progreso' }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`flex-1 md:flex-none px-8 py-4 font-medium text-lg border-b-4 transition-all ${
              activeTab === tab.key 
                ? 'border-orange-600 text-orange-600' 
                : 'border-transparent text-gray-500 hover:text-gray-700'
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
                {Object.entries(order.customFields || {}).length > 0 ? (
                  Object.entries(order.customFields).map(([key, val]) => (
                    <div key={key} className="flex justify-between py-4 border-b last:border-0 text-lg">
                      <span className="capitalize text-gray-700">{key.replace(/([A-Z])/g, ' $1')}</span>
                      <span className="font-semibold">{String(val)}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 py-8 text-center">Sin detalles adicionales para este pedido.</p>
                )}
              </CardContent>
            </Card>
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
                {isBuyer && order.status === 'Completed' && (
                  <Button className="w-full text-lg py-6">⭐ Dejar Reseña</Button>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* CHAT */}
      {activeTab === 'chat' && (
        <Card className="h-[650px] flex flex-col shadow-lg">
          <CardHeader><CardTitle className="flex items-center gap-2">💬 Chat en Vivo</CardTitle></CardHeader>
          <CardContent className="flex-1 overflow-y-auto p-6 space-y-5 bg-gray-50">
            {messages.length === 0 && (
              <div className="text-center py-20 text-gray-400">
                Aún no hay mensajes.<br />¡Saluda al {isBuyer ? 'vendedor' : 'comprador'}!
              </div>
            )}
            {messages.map((msg: any) => (
              <div key={msg.id} className={`flex ${msg.senderId === session?.user?.id ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] px-5 py-3.5 rounded-3xl text-[17px] ${
                  msg.senderId === session?.user?.id 
                    ? 'bg-orange-600 text-white' 
                    : 'bg-white border shadow-sm'
                }`}>
                  {msg.content}
                  {msg.fileUrl && (
                    <a href={msg.fileUrl} target="_blank" className="block mt-2 text-sm underline opacity-90">📎 Ver archivo</a>
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

      {/* PROGRESS */}
      {activeTab === 'progress' && (
        <Card className="shadow-lg">
          <CardHeader><CardTitle>📈 Seguimiento del Pedido</CardTitle></CardHeader>
          <CardContent className="pt-8">
            <div className="space-y-10">
              <div className="flex gap-6">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-2xl">📝</div>
                <div className="flex-1">
                  <p className="font-semibold">Pedido creado</p>
                  <p className="text-sm text-gray-500">{new Date(order.createdAt).toLocaleString('es-CO')}</p>
                </div>
              </div>
            </div>

            {isSeller && (
              <div className="mt-12 pt-8 border-t flex gap-4">
                <Button onClick={() => updateStatus('In Progress')} size="lg">🚀 Marcar En Progreso</Button>
                <Button onClick={() => updateStatus('Completed')} size="lg" variant="default">✅ Completar Pedido</Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
