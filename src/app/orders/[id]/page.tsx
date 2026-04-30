'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Send, Paperclip, Clock, MessageCircle } from 'lucide-react';

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const [order, setOrder] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrder();
  }, [params.id]);

  const fetchOrder = async () => {
    try {
      const res = await fetch(`/api/orders/${params.id}`);
      const data = await res.json();
      setOrder(data);
      setMessages([
        { id: 1, sender: "buyer", content: "Hola, ¿cuándo puedes empezar?", time: "hace 2 horas" },
        { id: 2, sender: "seller", content: "Mañana en la mañana estoy disponible", time: "hace 1 hora" },
      ]);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = () => {
    if (!newMessage.trim()) return;
    setMessages([...messages, {
      id: Date.now(),
      sender: "seller",
      content: newMessage,
      time: "ahora"
    }]);
    setNewMessage('');
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Cargando pedido...</div>;
  if (!order) return <div className="min-h-screen flex items-center justify-center text-red-600">Pedido no encontrado</div>;

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-5xl mx-auto px-6">
        <Link href="/orders" className="flex items-center gap-2 text-orange-600 mb-8">
          <ArrowLeft size={20} /> Volver a Mis Pedidos
        </Link>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            <Card>
              <CardContent className="p-10">
                <h1 className="text-3xl font-bold">{order.gig?.title || 'Pedido #' + order.id}</h1>
                <p className="text-2xl font-bold text-orange-600 mt-4">
                  ${Number(order.price).toLocaleString('es-CO')}
                </p>
              </CardContent>
            </Card>

            {/* Chat Section */}
            <Card>
              <CardContent className="p-8">
                <h3 className="font-semibold text-xl mb-6 flex items-center gap-3">
                  <MessageCircle /> Chat con el cliente
                </h3>

                <div className="h-96 bg-gray-50 rounded-2xl p-6 overflow-y-auto space-y-4 mb-6">
                  {messages.map(msg => (
                    <div key={msg.id} className={`flex ${msg.sender === 'seller' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[75%] px-5 py-3 rounded-3xl ${msg.sender === 'seller' ? 'bg-orange-600 text-white' : 'bg-white border'}`}>
                        {msg.content}
                        <p className="text-xs opacity-70 mt-1">{msg.time}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex gap-3">
                  <Textarea 
                    value={newMessage} 
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Escribe un mensaje al cliente..."
                    onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                  />
                  <Button onClick={sendMessage}>
                    <Send size={20} />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div>
            <Card className="sticky top-8">
              <CardContent className="p-8">
                <h3 className="font-semibold mb-6">Estado del Pedido</h3>
                <div className="space-y-6 text-sm">
                  <div className="flex justify-between">
                    <span>Estado actual</span>
                    <span className="font-medium text-green-600">En Progreso</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Entrega estimada</span>
                    <span>5 días</span>
                  </div>
                </div>

                <Button className="w-full mt-10" onClick={() => alert('Funcionalidad de subir archivo en desarrollo')}>
                  📎 Subir archivo para el cliente
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
