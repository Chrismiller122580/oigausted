'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  const [activeTab, setActiveTab] = useState('overview');

  const isBuyer = order?.buyerId === session?.user?.id;
  const isSeller = order?.sellerId === session?.user?.id;

  // Fetch order + messages
  useEffect(() => {
    if (!orderId) return;
    Promise.all([
      fetch(`/api/orders/${orderId}`).then(r => r.json()),
      fetch(`/api/orders/${orderId}/messages`).then(r => r.json())
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
        body: JSON.stringify({ content: newMessage, isFile: false })
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
      const res = await fetch(`/api/orders/${orderId}/messages`, {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      setMessages(prev => [...prev, data.message]);
      toast.success('Archivo subido');
    } catch (e) {
      toast.error('Error subiendo archivo');
    }
  };

  const updateProgress = async (newStatus: string, progress: number) => {
    await fetch(`/api/orders/${orderId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus, progress })
    });
    toast.success('Progreso actualizado');
    // Refresh
    window.location.reload();
  };

  if (loading) return <div className="p-20 text-center text-2xl">Cargando pedido...</div>;
  if (!order) return <div className="p-20 text-center text-red-600">Pedido no encontrado</div>;

  const categoryEmoji = gigCategories.find(c => c.name === order.gig?.category)?.emoji || '📦';
  const totalPrice = order.price || 0;

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* HEADER */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-3">
            <span className="text-4xl">{categoryEmoji}</span>
            <h1 className="text-3xl font-bold">Pedido #{order.id.slice(0,8)}</h1>
            <Badge variant={order.status === 'Completed' ? 'default' : 'secondary'} className="text-lg px-4 py-1">
              {order.status}
            </Badge>
          </div>
          <p className="text-gray-600 mt-1">{order.gig?.title}</p>
        </div>
        <div className="text-right">
          <p className="text-4xl font-bold text-orange-600">${totalPrice.toLocaleString('es-CO')} COP</p>
          <p className="text-sm text-gray-500">Precio final</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Resumen</TabsTrigger>
          <TabsTrigger value="chat">Chat</TabsTrigger>
          <TabsTrigger value="progress">Progreso</TabsTrigger>
          <TabsTrigger value="files">Archivos</TabsTrigger>
        </TabsList>

        {/* OVERVIEW TAB */}
        <TabsContent value="overview" className="mt-6">
          <div className="grid md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <Card>
                <CardHeader><CardTitle>Detalles del Servicio</CardTitle></CardHeader>
                <CardContent className="space-y-6">
                  {/* Custom fields breakdown */}
                  <div>
                    <h3 className="font-medium mb-3">Lo que pediste:</h3>
                    {Object.entries(order.customFields || {}).map(([key, value]) => (
                      <div key={key} className="flex justify-between py-2 border-b last:border-none">
                        <span className="capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                        <span className="font-medium">{value}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar actions */}
            <div>
              <Card className="sticky top-6">
                <CardHeader><CardTitle>Acciones</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  {isSeller && (
                    <>
                      <Button onClick={() => updateProgress('In Progress', 30)} className="w-full">Iniciar trabajo</Button>
                      <Button onClick={() => updateProgress('Completed', 100)} variant="default" className="w-full">Marcar como completado</Button>
                    </>
                  )}
                  {isBuyer && order.status === 'Completed' && (
                    <Button className="w-full">Dejar reseña</Button>
                  )}
                  {isBuyer && (
                    <Button variant="outline" className="w-full">Pedir revisión</Button>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* CHAT TAB */}
        <TabsContent value="chat" className="mt-6">
          <Card className="h-[600px] flex flex-col">
            <CardHeader><CardTitle>Chat del pedido</CardTitle></CardHeader>
            <CardContent className="flex-1 overflow-y-auto space-y-4 p-4">
              {messages.map((msg: any) => (
                <div key={msg.id} className={`flex ${msg.senderId === session?.user?.id ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[70%] p-3 rounded-2xl ${msg.senderId === session?.user?.id ? 'bg-orange-600 text-white' : 'bg-gray-100'}`}>
                    {msg.content}
                    {msg.fileUrl && <a href={msg.fileUrl} target="_blank" className="text-blue-200 underline block mt-1">📎 Ver archivo</a>}
                  </div>
                </div>
              ))}
            </CardContent>
            <div className="p-4 border-t flex gap-3">
              <input type="file" onChange={uploadFile} className="hidden" id="file-upload" />
              <label htmlFor="file-upload" className="cursor-pointer px-4 py-2 border rounded-xl hover:bg-gray-50">📎</label>
              <Textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Escribe un mensaje..."
                className="flex-1 resize-none"
                rows={1}
              />
              <Button onClick={sendMessage}>Enviar</Button>
            </div>
          </Card>
        </TabsContent>

        {/* PROGRESS TAB */}
        <TabsContent value="progress" className="mt-6">
          <Card>
            <CardHeader><CardTitle>Seguimiento del pedido</CardTitle></CardHeader>
            <CardContent>
              {/* Simple timeline */}
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center text-white text-xs">1</div>
                  <div className="flex-1">
                    <p className="font-medium">Pedido creado</p>
                    <p className="text-sm text-gray-500">{new Date(order.createdAt).toLocaleDateString('es-CO')}</p>
                  </div>
                </div>
                {/* Add more steps as needed */}
              </div>
              {isSeller && (
                <div className="mt-8 pt-8 border-t">
                  <h3 className="font-medium mb-4">Actualizar progreso</h3>
                  <Button onClick={() => updateProgress('In Progress', 50)} className="mr-3">50% En progreso</Button>
                  <Button onClick={() => updateProgress('Completed', 100)}>Completado 100%</Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* FILES TAB */}
        <TabsContent value="files" className="mt-6">
          <Card>
            <CardHeader><CardTitle>Archivos y entregables</CardTitle></CardHeader>
            <CardContent>
              <p className="text-gray-500">Aquí aparecerán todos los archivos compartidos en el chat.</p>
              {/* Gallery would go here */}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
