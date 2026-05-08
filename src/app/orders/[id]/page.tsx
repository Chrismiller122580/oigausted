'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'react-hot-toast';

export default function OrderDetailPage() {
  const params = useParams();
  const orderId = params.id as string;

  const [order, setOrder] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load order and messages (your existing logic)
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

  const loadMessages = () => {
    fetch(`/api/orders/${orderId}/messages`)
      .then(r => r.json())
      .then(setMessages)
      .catch(console.error);
  };

  useEffect(() => { loadMessages(); const i = setInterval(loadMessages, 2000); return () => clearInterval(i); }, [orderId]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const sendMessage = async () => {
    if (!newMessage.trim()) return;
    await fetch(`/api/orders/${orderId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: newMessage })
    });
    setNewMessage('');
    loadMessages();
  };

  // Grok Suggestion in Chat
  const askGrok = async () => {
    if (!newMessage.trim()) return toast.error('Escribe algo primero');
    const userMsg = newMessage;
    setMessages(prev => [...prev, { role: "user", content: userMsg }]);
    setNewMessage('');

    try {
      const res = await fetch('/api/grok/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          prompt: `Contexto: ${order?.gig?.title}. Cliente dice: "${userMsg}". Responde como asistente útil y profesional.` 
        })
      });
      const data = await res.json();
      if (data.description) {
        setMessages(prev => [...prev, { role: "assistant", content: data.description }]);
      }
    } catch (err) {
      toast.error('Grok no disponible');
    }
  };

  // ... (keep your existing review, approve, revision logic)

  if (loading) return <div className="p-20 text-center">Cargando...</div>;

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Your existing order info, buyer selections, etc. */}

      <Card className="mb-6">
        <CardContent className="p-8">
          <div className="flex justify-between mb-4">
            <h3 className="font-semibold">💬 Chat con el Vendedor</h3>
            <Button variant="outline" size="sm" onClick={askGrok}>🤖 Grok Sugiere</Button>
          </div>

          <div className="h-80 bg-gray-50 rounded-2xl p-4 overflow-y-auto mb-4">
            {messages.map((msg, i) => (
              <div key={i} className={`mb-3 ${msg.role === "user" ? "text-right" : ""}`}>
                <div className={`inline-block px-4 py-3 rounded-2xl ${msg.role === "user" ? "bg-orange-600 text-white" : "bg-white border"}`}>
                  {msg.content}
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && askGrok()}
              placeholder="Escribe mensaje o pregunta a Grok..."
              className="flex-1 border rounded-2xl px-5 py-3"
            />
            <Button onClick={askGrok}>Enviar</Button>
          </div>
        </CardContent>
      </Card>

      {/* Review section (unchanged) */}
      {order.status === 'Completed' && (
        <Card>
          <CardContent className="p-8">
            <h3>⭐ Deja tu review</h3>
            {/* your existing review stars + comment */}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
