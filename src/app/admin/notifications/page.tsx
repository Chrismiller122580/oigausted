'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'react-hot-toast';

export default function AdminSendNotification() {
  const [userId, setUserId] = useState('');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [category, setCategory] = useState('system');
  const [loading, setLoading] = useState(false);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || !title || !message) {
      toast.error('Todos los campos son obligatorios');
      return;
    }

    setLoading(true);
    try {
      // For now, we just use the internal send (in future this would call a protected admin endpoint)
      const res = await fetch('/api/admin/send-notification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, title, message, category, type: 'in_app' }),
      });

      if (res.ok) {
        toast.success('Notificación enviada');
        setTitle('');
        setMessage('');
      } else {
        toast.error('Error al enviar');
      }
    } catch (e) {
      toast.error('Error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-2">Enviar Notificación Manual</h1>
      <p className="text-muted-foreground mb-8">Envía notificaciones in-app a cualquier usuario (para pruebas y soporte).</p>

      <form onSubmit={handleSend} className="space-y-5 bg-card p-6 rounded-2xl border">
        <div>
          <label className="text-sm font-medium">User ID</label>
          <Input 
            value={userId} 
            onChange={(e) => setUserId(e.target.value)} 
            placeholder="ID del usuario" 
            required 
          />
        </div>

        <div>
          <label className="text-sm font-medium">Categoría</label>
          <select 
            value={category} 
            onChange={(e) => setCategory(e.target.value)}
            className="w-full border rounded-md p-2 bg-background"
          >
            <option value="system">Sistema</option>
            <option value="order">Pedido</option>
            <option value="gig">Gig</option>
            <option value="payment">Pago</option>
          </select>
        </div>

        <div>
          <label className="text-sm font-medium">Título</label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
        </div>

        <div>
          <label className="text-sm font-medium">Mensaje</label>
          <Textarea 
            value={message} 
            onChange={(e) => setMessage(e.target.value)} 
            rows={4} 
            required 
          />
        </div>

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? 'Enviando...' : 'Enviar Notificación'}
        </Button>
      </form>

      <p className="text-xs text-muted-foreground mt-4 text-center">
        Nota: Esta es una herramienta de administrador. En producción, considera agregar confirmación extra.
      </p>
    </div>
  );
}
