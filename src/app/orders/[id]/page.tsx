'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'react-hot-toast';

export default function OrderDetailPage() {
  const params = useParams();
  const orderId = params.id as string;

  const [order, setOrder] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [review, setReview] = useState<any>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load Order + Review
  useEffect(() => {
    fetch(`/api/orders/${orderId}`)
      .then(r => r.json())
      .then(data => {
        const orderData = data.order || data;
        setOrder(orderData);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [orderId]);

  // Load Messages
  const loadMessages = () => {
    fetch(`/api/orders/${orderId}/messages`)
      .then(r => r.json())
      .then(setMessages)
      .catch(console.error);
  };

  useEffect(() => {
    loadMessages();
    const interval = setInterval(loadMessages, 2000);
    return () => clearInterval(interval);
  }, [orderId]);

  // Auto scroll chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!newMessage.trim()) return;
    const res = await fetch(`/api/orders/${orderId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: newMessage })
    });
    if (res.ok) {
      setNewMessage('');
      loadMessages();
    }
  };

  const submitReview = async () => {
    if (rating < 1 || rating > 5) return toast.error('Rating debe ser entre 1 y 5');

    const res = await fetch('/api/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId, rating, comment })
    });

    if (res.ok) {
      toast.success('✅ Gracias por tu review!');
      setComment('');
    } else {
      toast.error('Error enviando review');
    }
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

      {/* Service Info */}
      <Card className="mb-6">
        <CardContent className="p-8">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-3xl font-bold">{order.gig?.title}</h2>
              <p className="text-gray-600 mt-3">{order.gig?.description}</p>
            </div>
            <div className="text-right">
              <p className="text-5xl font-bold text-orange-600">
                ${price.toLocaleString('es-CO')} COP
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Buyer Selections */}
      {order.metadata && Object.keys(order.metadata).length > 0 && (
        <Card className="mb-6">
          <CardContent className="p-8">
            <h3 className="font-semibold mb-4">📋 Detalles seleccionados</h3>
            <div className="grid gap-3">
              {Object.entries(order.metadata).map(([key, value]) => (
                <div key={key} className="flex justify-between bg-gray-50 p-4 rounded-2xl">
                  <span className="capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                  <span className="font-semibold">{String(value)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Chat */}
      <Card className="mb-6">
        <CardContent className="p-8">
          <h3 className="font-semibold mb-4">💬 Chat con el Vendedor</h3>
          <div className="h-80 bg-gray-50 border rounded-2xl p-4 overflow-y-auto mb-4 space-y-3">
            {messages.length === 0 && <p className="text-center text-gray-500 py-8">No hay mensajes aún.</p>}
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
              placeholder="Escribe tu mensaje..."
              className="flex-1 border rounded-2xl px-5 py-3"
            />
            <Button onClick={sendMessage}>Enviar</Button>
          </div>
        </CardContent>
      </Card>

      {/* Review Section */}
      {order.status === 'Completed' && (
        <Card>
          <CardContent className="p-8">
            <h3 className="font-semibold mb-4">⭐ Deja tu opinión</h3>
            <div className="flex gap-1 mb-4">
              {[1,2,3,4,5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  className={`text-3xl ${star <= rating ? 'text-yellow-500' : 'text-gray-300'}`}
                >
                  ★
                </button>
              ))}
            </div>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="¿Qué te pareció el servicio?"
              className="mb-4"
            />
            <Button onClick={submitReview} className="w-full">
              Publicar Review
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
