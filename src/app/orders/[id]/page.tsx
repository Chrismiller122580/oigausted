"use client"
import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import { useSession } from "next-auth/react"
import { Clock, MessageCircle, Upload, Truck } from "lucide-react"

export default function OrderDetailPage() {
  const params = useParams()
  const { data: session } = useSession()

  const [order, setOrder] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [messages, setMessages] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState("")

  useEffect(() => {
    fetchOrder()
  }, [])

  const fetchOrder = async () => {
    try {
      const res = await fetch(`/api/orders/${params.id}`)
      if (!res.ok) throw new Error("Order not found")
      const data = await res.json()
      setOrder(data.order)
      setMessages(data.order.messages || [])
    } catch (err) {
      console.error(err)
      setError("Orden no encontrada o no tienes acceso")
    } finally {
      setLoading(false)
    }
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || !order) return

    try {
      const res = await fetch(`/api/orders/${order.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: newMessage,
          isFromBuyer: true
        })
      })

      if (res.ok) {
        const newMsg = await res.json()
        setMessages([...messages, newMsg])
        setNewMessage("")   // Clear input after sending
      } else {
        alert("Error al enviar mensaje")
      }
    } catch (err) {
      console.error(err)
      alert("Error al enviar mensaje")
    }
  }

  if (loading) return <div className="container py-20 text-center">Cargando orden...</div>
  if (error) return <div className="container py-20 text-center text-red-600">{error}</div>
  if (!order) return <div className="container py-20 text-center">Orden no encontrada</div>

  const isBuyer = order.buyerId === (session?.user as any)?.id

  return (
    <div className="container max-w-5xl mx-auto py-12 px-6">
      <Link href={isBuyer ? "/buyer" : "/seller"} className="text-orange-600 hover:underline mb-8 inline-block">
        ← Volver a mis {isBuyer ? "pedidos" : "ventas"}
      </Link>

      <div className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-3xl font-bold">{order.gig.title}</h1>
          <p className="text-gray-500">Orden #{order.id.slice(0, 8)}...</p>
        </div>
        <div className={`px-6 py-2 rounded-full font-medium ${order.status === 'Completed' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
          {order.status}
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-8">
          {/* Progress */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Progreso de la Orden
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-3 bg-gray-200 rounded-full overflow-hidden mb-4">
                <div 
                  className="h-full bg-orange-600 rounded-full transition-all" 
                  style={{ width: `${order.progress || 25}%` }}
                />
              </div>
              <p className="text-center text-sm text-gray-500">{order.progress || 25}% completado</p>
            </CardContent>
          </Card>

          {/* Chat */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5" />
                Chat con {isBuyer ? "el vendedor" : "el comprador"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80 bg-gray-50 rounded-xl p-4 overflow-y-auto mb-4 border space-y-4">
                {messages.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No hay mensajes aún. Inicia la conversación.</p>
                ) : (
                  messages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.isFromBuyer ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[70%] p-3 rounded-2xl ${msg.isFromBuyer ? 'bg-orange-600 text-white' : 'bg-white border'}`}>
                        {msg.content}
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="flex gap-2">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Escribe un mensaje..."
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                />
                <Button onClick={sendMessage}>Enviar</Button>
              </div>
            </CardContent>
          </Card>

          {/* Files */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="w-5 h-5" />
                Archivos y Entregables
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border-2 border-dashed border-gray-300 rounded-2xl p-12 text-center">
                <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500">Sube o descarga archivos aquí</p>
                <Button variant="outline" className="mt-6">Subir archivo</Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-4">
          <Card className="sticky top-8">
            <CardHeader>
              <CardTitle>Resumen</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <p className="text-sm text-gray-500">Precio Total</p>
                <p className="text-3xl font-bold text-orange-600">
                  ${order.price.toLocaleString("es-CO")} COP
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Vendedor</p>
                <p className="font-medium">{order.seller.name || order.seller.businessName}</p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Comprador</p>
                <p className="font-medium">{order.buyer.name || "Comprador"}</p>
              </div>

              {order.trackingNumber && (
                <div>
                  <p className="text-sm text-gray-500">Seguimiento</p>
                  <p className="font-medium flex items-center gap-2">
                    <Truck className="w-4 h-4" /> {order.trackingNumber}
                  </p>
                </div>
              )}

              <Button className="w-full" variant="outline">
                Contactar Soporte
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
