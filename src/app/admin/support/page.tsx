'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'react-hot-toast';

export default function AdminSupportPage() {
  const [tickets] = useState([
    { id: 1, user: "buyer@demo.com", subject: "Problema con pago", status: "Abierto", priority: "Alta" },
    { id: 2, user: "seller@demo.com", subject: "Mi gig no aparece", status: "Pendiente", priority: "Media" },
  ]);

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-5xl font-bold mb-8">Soporte</h1>
        <p className="text-zinc-400 mb-6">Tickets de soporte (beta: lista estática)</p>

        <div className="space-y-4">
          {tickets.map(ticket => (
            <Card key={ticket.id} className="bg-zinc-900 border-zinc-800">
              <CardContent className="p-6 flex justify-between items-center">
                <div>
                  <p className="font-semibold">{ticket.subject}</p>
                  <p className="text-sm text-zinc-400">{ticket.user} • {ticket.priority}</p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm px-3 py-1 bg-amber-600 rounded-full">{ticket.status}</span>
                  <Button size="sm" onClick={() => toast.success('Ticket marcado como resuelto (demo)')}>
                    Resolver
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
