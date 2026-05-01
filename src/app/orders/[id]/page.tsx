'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { ArrowLeft, MessageCircle, CheckCircle2, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

export default function OrderDetailPage() {
  const params = useParams();
  const orderId = params.id as string;
  const router = useRouter();
  const { data: session } = useSession();

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<any[]>([
    { id: 1, sender: "seller", text: "Hola! Recibí tu pedido. ¿Cuándo te gustaría que empecemos?", time: "hace 2 horas" }
  ]);
  const [newMessage, setNewMessage] = useState('');

  useEffect(() => {
    fetch(`/api/orders/${orderId}`)
      .then(res => res.json())
      .then(data => {
        const o = data.order || data;
        setOrder(o);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [orderId]);

  const sendMessage = () => {
    if (!newMessage.trim()) return;
    setMessages([...messages, { id: Date.now(), sender: "You", text: newMessage, time: "ahora" }]);
    setNewMessage('');
  };

  // Progress calculation
  const getProgress = (status: string) => {
    switch (status) {
      case 'Pending': return 25;
      case 'Paid': return 50;
      case 'In Progress': return 75;
      case 'Completed': return 100;
      default: return 25;
    }
  };

  const progress = order ? getProgress(order.status) : 25;

  if (loading) return <div className="min-h-screen flex items-center justify-center text-2xl">Cargando pedido...</div>;
  if (!order) return <div className="min-h-screen flex items-center justify-center text-2xl">Pedido no encontrado</div>;

  const isBuyer = order.buyerId === (session?.user as any)?.id;
  const isSeller = order.sellerId === (session?.user as any)?.id;

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <Link href="/orders" className="flex items-center gap-2 text-orange-600 mb-8 hover:underline">
        <ArrowLeft size={20} /> Volver a Mis Pedidos
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-8 space-y-8">
          {/* Progress Bar */}
          <Card>
            <CardContent className="p-8">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-lg">Estado del Pedido</h3>
                <span className="font-medium text-orange-600">{order.status}</span>
              </div>
              <Progress value={progress} className="h-3" />
              <div className="flex justify-between text-xs text-gray-500 mt-2">
                <span>Pendiente</span>
                <span>En Progreso</span>
                <span>Completado</span>
              </div>
            </CardContent>
          </Card>

          {/* Gig Info */}
          <Card>
            <CardContent className="p-10">
              <h1 className="text-4xl font-bold mb-2">{order.gig?.title}</h1>
              <p className="text-3xl font-bold text-orange-600">${Number(order.price).toLocaleString('es-CO')} COP</p>
              {order.gig?.imageUrl && <img src={order.gig.imageUrl} className="mt-6 w-full rounded-3xl" alt={order.gig.title} />}
              <p className="text-gray-700 mt-6">{order.gig?.description}</p>
            </CardContent>
          </Card>

          {/* Buyer Requirements */}
          {order.customFields && Object.keys(order.customFields).length > 0 && (
            <Card>
              <CardContent className="p-10">
                <h3 className="font-semibold text-2xl mb-6">Tus Requisitos</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {Object.entries(order.customFields).map(([key, value]) => (
                    <div key={key} className="bg-gray-50 p-6 rounded-2xl">
                      <p className="text-sm uppercase tracking-widest text-gray-500">{key.replace(/([A-Z])/g, ' $1')}</p>
                      <p className="text-xl font-medium mt-2">{String(value)}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Chat */}
          <Card>
            <CardContent className="p-10">
              <h3 className="font-semibold text-2xl mb-6 flex items-center gap-3">
                <MessageCircle className="text-orange-600" /> Chat
              </h3>

              <div className="h-96 bg-gray-50 rounded-2xl p-6 overflow-y-auto space-y-4 mb-6 border">
                {messages.map(msg => (
                  <div key={msg.id} className={`flex ${msg.sender === "You" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[70%] rounded-3xl px-5 py-3 ${msg.sender === "You" ? "bg-orange-600 text-white" : "bg-white border"}`}>
                      <p>{msg.text}</p>
                      <p className="text-xs mt-2 opacity-70">{msg.time}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-3">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  placeholder="Escribe un mensaje al vendedor..."
                  className="flex-1 px-6 py-4 border rounded-2xl focus:outline-none focus:border-orange-600"
                />
                <Button onClick={sendMessage}>Enviar</Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-4 space-y-6">
          <Card>
            <CardContent className="p-8">
              <h4 className="font-semibold mb-6">Información</h4>
              <div className="space-y-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Cliente</span>
                  <span>{order.buyer?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Proveedor</span>
                  <span>{order.seller?.businessName || order.seller?.name}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
