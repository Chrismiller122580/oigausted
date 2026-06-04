'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';

export default function AdminSupportPage() {
  const [tickets] = useState([
    { id: 1, user: "cliente@ejemplo.com", subject: "Problema con pago", status: "Abierto", priority: "Alta" },
    { id: 2, user: "proveedor@ejemplo.com", subject: "Mi gig no aparece", status: "Pendiente", priority: "Media" },
  ]);

  return (
    <div className="min-h-screen bg-background text-foreground p-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-5xl font-bold mb-8">Soporte</h1>
        <p className="text-muted-foreground mb-6">Tickets de soporte (beta: lista estática)</p>

        <div className="space-y-4">
          {tickets.map(ticket => (
            <Card key={ticket.id} className="bg-card border-border">
              <CardContent className="p-6 flex justify-between items-center">
                <div>
                  <p className="font-semibold">{ticket.subject}</p>
                  <p className="text-sm text-muted-foreground">{ticket.user} • {ticket.priority}</p>
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
