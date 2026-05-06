'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'react-hot-toast';

export default function OrderDetailPage() {
  const params = useParams();
  const orderId = params.id as string;

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!orderId) return;

    fetch(`/api/orders/${orderId}`)
      .then(res => res.json())
      .then(data => {
        const orderData = data.order || data;
        setOrder(orderData);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [orderId]);

  // Load chat messages
  useEffect(() => {
    if (!orderId) return;
    fetch(`/api/orders/${orderId}/messages`)
      .then(r => r.json())
      .then(setMessages)
      .catch(() => {});
  }, [orderId]);

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    const res = await fetch(`/api/orders/${orderId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: newMessage })
    });

    if (res.ok) {
      setNewMessage('');
      // Refresh messages
      fetch(`/api/orders/${orderId}/messages`).then(r => r.json()).then(setMessages);
    }
  };

  const handleFileUpload = async (e: any) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch(`/api/orders/${orderId}/files`, {
      method: 'POST',
      body: formData
    });

    if (res.ok) {
      toast.success('Archivo subido correctamente');
    } else {
      toast.error('Error al subir archivo');
    }
    setUploading(false);
  };

  if (loading) return <div className="p-20 text-center text-2xl">Cargando pedido...</div>;
  if (!order) return <div className="p-20 text-center text-red-600">Pedido no encontrado</div>;

  const price = Number(order.price || 0);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold">Pedido <span className="text-orange-600">#{order.id}</span></h1>
        <span className="px-5 py-2 bg-green-100 text-green-700 rounded-full font-medium">
          {order.status || 'Pendiente'}
        </span>
      </div>

      <div className="grid gap-6">
        {/* Service Info */}
        <Card>
          <CardContent className="p-8">
            <div className="flex justify-between">
              <div>
                <h2 className="text-3xl font-bold">{order.gig?.title}</h2>
                <p className="text-gray-600 mt-3">{order.gig?.description}</p>
              </div>
              <div className="text-right">
                <p className="text-5xl font-bold text-orange-600">${price.toLocaleString('es-CO')} COP</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Progress */}
        <Card>
          <CardContent className="p-8">
            <p className="font-medium mb-3">Progreso del Pedido</p>
            <div className="w-full bg-gray-200 h-3 rounded-full overflow-hidden">
              <div className="bg-orange-500 h-3 w-1/3 rounded-full"></div>
            </div>
          </CardContent>
        </Card>

        {/* Chat + Files */}
        <Card>
          <CardContent className="p-8">
            <h3 className="font-semibold mb-4">💬 Chat con el Vendedor</h3>
            
            <div className="h-80 bg-gray-50 border rounded-2xl p-4 overflow-y-auto mb-4 space-y-3">
              {messages.length === 0 && <p className="text-gray-500 text-center py-8">No hay mensajes aún. ¡Escribe el primero!</p>}
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.senderId === order.buyerId ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[70%] px-4 py-3 rounded-2xl ${msg.senderId === order.buyerId ? 'bg-orange-600 text-white' : 'bg-white border'}`}>
                    {msg.text}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Escribe un mensaje..."
                className="flex-1 border rounded-2xl px-5 py-3 focus:outline-none focus:border-orange-500"
              />
              <Button onClick={sendMessage}>Enviar</Button>
            </div>

            <div className="mt-6">
              <label className="cursor-pointer">
                <input type="file" onChange={handleFileUpload} className="hidden" />
                <div className="border border-dashed border-gray-300 rounded-2xl p-6 text-center hover:bg-gray-50">
                  📎 {uploading ? 'Subiendo...' : 'Adjuntar archivo o foto'}
                </div>
              </label>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}