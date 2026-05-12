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
      toast.success('Mensaje enviado');
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
      toast.success('Archivo subido');
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
      toast.success(`Estado actualizado a ${status}`);
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
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div className="flex items-center gap-4">
          <span className="text-5xl">{emoji}</span>
          <div>
            <h1 className="text-3xl font-bold">Pedido #{order.id.slice(0, 8)}</h1>
            <p className="text-gray-600">{order.gig?.title}</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-4xl font-bold text-orange-600">
            ${Number(order.price || 0).toLocaleString('es-CO')} COP
          </div>
          <div className="text-sm uppercase tracking-widest text-gray-500 mt-1">
            {order.status}
          </div>
        </div>
      </div>

      {/* TABS */}
      <div className="flex border-b mb-6">
        {['overview', 'chat', 'progress'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`px-8 py-4 font-medium border-b-2 transition-all ${
              activeTab === tab 
                ? 'border-orange-600 text-orange-600' 
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab === 'overview' && 'Resumen'}
            {tab === 'chat' && '💬 Chat'}
            {tab === 'progress' && '📈 Progreso'}
          </button>
        ))}
      </div>

      {/* OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="grid md:grid-cols-12 gap-8">
          <div className="md:col-span-8">
            <Card>
              <CardHeader><CardTitle>Detalles del Servicio</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(order.customFields || {}).length > 0 ? (
                  Object.entries(order.customFields).map(([key, val]) => (
                    <div key={key} className="flex justify-between py-3 border-b last:border-0">
                      <span className="capitalize text-gray-600">{key.replace(/([A-Z])/g, ' $1')}</span>
                      <span className="font-medium">{String(val)}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500">No hay detalles adicionales.</p>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="md:col-span-4 space-y-4">
            <Card>
              <CardHeader><CardTitle>Acciones rápidas</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {isSeller && (
                  <>
                    <Button onClick={() => updateStatus('In Progress')} className="w-full">Iniciar Trabajo</Button>
                    <Button onClick={() => updateStatus('Completed')} variant="default" className="w-full">Marcar como Completado</Button>
                  </>
                )}
                {isBuyer && order.status === 'Completed' && (
                  <Button className="w-full">Dejar Reseña</Button>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* CHAT */}
      {activeTab === 'chat' && (
        <Card className="h-[620px] flex flex-col">
          <CardHeader><CardTitle>💬 Chat del Pedido</CardTitle></CardHeader>
          <CardContent className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
            {messages.length === 0 && <p className="text-center text-gray-400 py-12">No hay mensajes aún. ¡Escribe el primero!</p>}
            {messages.map((msg: any) => (
              <div key={msg.id} className={`flex ${msg.senderId === session?.user?.id ? 'justify-end' : ''}`}>
                <div className={`max-w-[75%] px-4 py-3 rounded-2xl ${msg.senderId === session?.user?.id ? 'bg-orange-600 text-white' : 'bg-white border'}`}>
                  {msg.content}
                  {msg.fileUrl && <a href={msg.fileUrl} target="_blank" className="block mt-2 text-blue-200 underline text-sm">📎 Ver archivo</a>}
                </div>
              </div>
            ))}
          </CardContent>
          <div className="p-4 border-t bg-white flex gap-3">
            <label className="cursor-pointer px-4 py-2.5 border rounded-xl hover:bg-gray-100">📎</label>
            <input type="file" onChange={uploadFile} className="hidden" />
            <Textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Escribe un mensaje o pregunta..."
              className="flex-1 min-h-[50px]"
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), sendMessage())}
            />
            <Button onClick={sendMessage}>Enviar</Button>
          </div>
        </Card>
      )}

      {/* PROGRESS */}
      {activeTab === 'progress' && (
        <Card>
          <CardHeader><CardTitle>📈 Seguimiento</CardTitle></CardHeader>
          <CardContent>
            <p className="text-gray-500">Timeline y progreso del pedido aparecerán aquí.</p>
            {isSeller && (
              <div className="mt-8 flex gap-3">
                <Button onClick={() => updateStatus('In Progress')}>En Progreso</Button>
                <Button onClick={() => updateStatus('Completed')}>Completado</Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
