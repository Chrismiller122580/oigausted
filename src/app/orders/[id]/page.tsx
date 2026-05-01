'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { ArrowLeft, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

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
    setMessages([...messages, {
      id: Date.now(),
      sender: "You",
      text: newMessage,
      time: "ahora"
    }]);
    setNewMessage('');
  };

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
          <Card>
            <CardContent className="p-10">
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="text-4xl font-bold">{order.gig?.title}</h1>
                  <p className="text-gray-600 mt-2">Pedido #{order.id?.slice(0,8)}...</p>
                </div>
                <div className="px-6 py-3 rounded-2xl bg-orange-100 text-orange-700 font-semibold">
                  {order.status}
                </div>
              </div>

              <div className="mt-8 flex gap-12">
                <div>
                  <p className="text-sm text-gray-500">Total Pagado</p>
                  <p className="text-3xl font-bold text-orange-600">${Number(order.price || 0).toLocaleString('es-CO')}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Fecha</p>
                  <p>{new Date(order.createdAt).toLocaleDateString('es-CO')}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Buyer Requirements */}
          {order.customFields && Object.keys(order.customFields).length > 0 && (
            <Card>
              <CardContent className="p-10">
                <h3 className="font-semibold text-2xl mb-6">Requisitos del Cliente</h3>
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
                <MessageCircle className="text-orange-600" /> Chat con {isBuyer ? "el Vendedor" : "el Cliente"}
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
                  placeholder="Escribe un mensaje..."
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
              <div className="space-y-4">
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
