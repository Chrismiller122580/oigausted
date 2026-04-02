"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ToastProvider"

export default function AdminSupport() {
  const [tickets, setTickets] = useState([
    { id: "t1", user: "buyer@demo.com", subject: "No veo mis pedidos", status: "Open", message: "Hola, compré un gig pero no aparece en mis pedidos." },
    { id: "t2", user: "seller@demo.com", subject: "Cómo cobro mis ganancias", status: "Open", message: "Hola, ¿cómo hago para recibir el pago de mis ventas?" },
  ])
  const { showToast } = useToast()

  const closeTicket = (id: string) => {
    setTickets(tickets.filter(t => t.id !== id))
    showToast("Ticket cerrado", "success")
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-10">Soporte y Tickets</h1>

        <div className="bg-gray-900 border border-gray-700 rounded-3xl p-8">
          {tickets.length === 0 ? (
            <p className="text-2xl text-gray-400 text-center py-12">No hay tickets abiertos.</p>
          ) : (
            <div className="space-y-8">
              {tickets.map((ticket) => (
                <div key={ticket.id} className="border border-gray-700 rounded-2xl p-8">
                  <div className="flex justify-between mb-4">
                    <div>
                      <p className="font-medium text-lg">{ticket.subject}</p>
                      <p className="text-gray-400 text-sm">De: {ticket.user}</p>
                    </div>
                    <span className="px-4 py-1 bg-orange-500/20 text-orange-400 rounded-full text-sm">Open</span>
                  </div>
                  <p className="text-gray-300 mb-6">{ticket.message}</p>
                  <Button onClick={() => closeTicket(ticket.id)} variant="destructive">
                    Cerrar Ticket
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
