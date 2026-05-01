'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { ArrowLeft, MessageCircle, Paperclip, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

export default function OrderDetailPage() {
  const params = useParams();
  const orderId = params.id as string;
  const { data: session } = useSession();

  const [order, setOrder] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load order + messages
  useEffect(() => {
    Promise.all([
      fetch(`/api/orders/${orderId}`).then(r => r.json()),
      fetch(`/api/orders/${orderId}/messages`).then(r => r.json())
    ]).then(([orderData, msgData]) => {
      setOrder(orderData.order || orderData);
      setMessages(msgData.messages || msgData || []);
      setLoading(false);
      scrollToBottom();
    }).catch(() => setLoading(false));
  }, [orderId]);

  const scrollToBottom = () => {
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  };

  const sendMessage = async (fileUrl?: string) => {
    if (!newMessage.trim() && !fileUrl) return;

    const messagePayload = {
      text: newMessage,
      fileUrl: fileUrl || null,
      senderId: (session?.user as any)?.id
    };

    const res = await fetch(`/api/orders/${orderId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(messagePayload)
    });

    const savedMsg = await res.json();
    setMessages(prev => [...prev, savedMsg]);
    setNewMessage('');
    scrollToBottom();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch('/api/upload', { method: 'POST', body: formData });
    const data = await res.json();

    if (data.url) {
      await sendMessage(data.url);
    }
    setUploading(false);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Cargando pedido...</div>;
  if (!order) return <div className="min-h-screen flex items-center justify-center text-red-600">Pedido no encontrado</div>;

  const progress = order.status === 'Pending' ? 25 : order.status === 'Paid' ? 50 : order.status === 'In Progress' ? 75 : 100;

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <Link href="/orders" className="flex items-center gap-2 text-orange-600 mb-8 hover:underline">
        <ArrowLeft size={20} /> Volver a Mis Pedidos
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Main Area */}
        <div className="lg:col-span-8 space-y-8">
          {/* Progress */}
          <Card>
            <CardContent className="p-8">
              <div className="flex justify-between mb-3">
                <span className="font-semibold">Progreso del Pedido</span>
                <span className="font-medium">{order.status}</span>
              </div>
              <Progress value={progress} className="h-3" />
            </CardContent>
          </Card>

          {/* Gig Info */}
          <Card>
            <CardContent className="p-10">
              <h1 className="text-4xl font-bold">{order.gig?.title}</h1>
              <p className="text-3xl font-bold text-orange-600 mt-2">${Number(order.price).toLocaleString('es-CO')} COP</p>
              {order.gig?.imageUrl && <img src={order.gig.imageUrl} className="mt-8 rounded-3xl w-full" />}
            </CardContent>
          </Card>

          {/* Requirements */}
          {order.customFields && Object.keys(order.customFields).length > 0 && (
            <Card>
              <CardContent className="p-10">
                <h3 className="font-semibold text-xl mb-6">Requisitos del Cliente</h3>
                <div className="grid grid-cols-2 gap-6">
                  {Object.entries(order.customFields).map(([key, val]) => (
                    <div key={key} className="bg-gray-50 p-6 rounded-2xl">
                      <p className="uppercase text-xs text-gray-500">{key.replace(/([A-Z])/g, ' $1')}</p>
                      <p className="text-lg font-medium mt-1">{String(val)}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Persistent Chat */}
          <Card>
            <CardContent className="p-10">
              <h3 className="font-semibold text-2xl mb-6 flex items-center gap-3">
                <MessageCircle className="text-orange-600" /> Chat del Pedido
              </h3>

              <div className="h-96 bg-gray-50 rounded-2xl p-6 overflow-y-auto border space-y-4 mb-6">
                {messages.map(m => (
                  <div key={m.id} className={`flex ${m.senderId === (session?.user as any)?.id ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[75%] px-5 py-3 rounded-3xl ${m.senderId === (session?.user as any)?.id ? 'bg-orange-600 text-white' : 'bg-white border'}`}>
                      {m.fileUrl && <img src={m.fileUrl} className="max-w-[200px] rounded-xl mb-2" />}
                      <p>{m.text}</p>
                      <p className="text-xs mt-2 opacity-70">{new Date(m.createdAt).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              <div className="flex gap-3">
                <label className="cursor-pointer">
                  <input type="file" className="hidden" onChange={handleFileUpload} accept="image/*,.pdf" />
                  <Button variant="outline" disabled={uploading} className="flex items-center gap-2">
                    <Paperclip size={18} /> {uploading ? 'Subiendo...' : 'Adjuntar'}
                  </Button>
                </label>

                <input
                  type="text"
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  onKeyPress={e => e.key === 'Enter' && sendMessage()}
                  placeholder="Escribe un mensaje..."
                  className="flex-1 px-6 py-4 border rounded-2xl focus:outline-none focus:border-orange-600"
                />

                <Button onClick={() => sendMessage()}>Enviar</Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-4">
          <Card>
            <CardContent className="p-8">
              <h4 className="font-semibold mb-6">Detalles del Pedido</h4>
              <div className="space-y-4 text-sm">
                <div className="flex justify-between"><span className="text-gray-600">Cliente</span><span>{order.buyer?.name}</span></div>
                <div className="flex justify-between"><span className="text-gray-600">Proveedor</span><span>{order.seller?.businessName || order.seller?.name}</span></div>
                <div className="flex justify-between"><span className="text-gray-600">Estado</span><span className="font-medium">{order.status}</span></div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
