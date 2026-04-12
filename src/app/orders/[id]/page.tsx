"use client"
import { useSession } from "next-auth/react"
import { useRouter, useParams } from "next/navigation"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowLeft, Send, Upload, CheckCircle } from "lucide-react"
import Link from "next/link"

export default function OrderDetailPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const params = useParams()
  const orderId = params.id as string

  const [order, setOrder] = useState<any>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!orderId) return
    fetchOrder()
    fetchMessages()
  }, [orderId])

  const fetchOrder = async () => {
    try {
      const res = await fetch(`/api/orders/${orderId}`)
      if (!res.ok) throw new Error("Order not found")
      const data = await res.json()
      setOrder(data.order)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const fetchMessages = async () => {
    try {
      const res = await fetch(`/api/orders/${orderId}/messages`)
      if (res.ok) {
        const data = await res.json()
        setMessages(data.messages || [])
      }
    } catch (err) {
      console.error("Failed to fetch messages", err)
    }
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || !order) return

    try {
      const isFromBuyer = (session?.user as any)?.role === "buyer"

      const res = await fetch(`/api/orders/${orderId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: newMessage,
          isFromBuyer
        })
      })

      if (res.ok) {
        const newMsg = await res.json()
        setMessages([...messages, newMsg])
        setNewMessage("")
      }
    } catch (err) {
      console.error("Failed to send message", err)
    }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center">Cargando orden...</div>
  if (!order) return <div className="min-h-screen flex items-center justify-center">Orden no encontrada</div>

  const isBuyer = (session?.user as any)?.role === "buyer"
  const isSeller = (session?.user as any)?.role === "seller"

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-6">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft size={20} />
          </Button>
          <h1 className="text-3xl font-bold">Orden #{order.id.slice(0,8)}</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-8 space-y-8">
            {/* Progress */}
            <Card>
              <CardContent className="p-8">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold">Progreso de la Orden</h2>
                  <span className="text-2xl font-bold text-orange-600">{order.progress}%</span>
                </div>
                <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-orange-600 transition-all" style={{ width: `${order.progress}%` }} />
                </div>
              </CardContent>
            </Card>

            {/* Chat */}
            <Card>
              <CardContent className="p-8">
                <h2 className="text-xl font-semibold mb-6">Chat con {isBuyer ? order.seller?.name : order.buyer?.name}</h2>
                
                <div className="h-96 bg-gray-50 rounded-2xl p-6 mb-6 overflow-y-auto space-y-4">
                  {messages.length === 0 ? (
                    <p className="text-center text-gray-500 py-12">Aún no hay mensajes. ¡Escribe el primero!</p>
                  ) : (
                    messages.map((msg, i) => (
                      <div key={i} className={`flex ${msg.isFromBuyer === isBuyer ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[70%] px-5 py-3 rounded-3xl ${msg.isFromBuyer === isBuyer ? 'bg-orange-600 text-white' : 'bg-white border'}`}>
                          {msg.content}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="flex gap-3">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                    placeholder="Escribe un mensaje..."
                    className="flex-1 px-5 py-4 border rounded-2xl focus:outline-none focus:border-orange-500"
                  />
                  <Button onClick={sendMessage} className="px-8">
                    <Send size={20} />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-4">
            <Card className="sticky top-8">
              <CardContent className="p-8 space-y-8">
                <div>
                  <h3 className="font-semibold text-lg mb-4">Resumen</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Gig</span>
                      <span className="font-medium">{order.gig?.title}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Precio</span>
                      <span className="font-bold text-xl">${order.price?.toLocaleString("es-CO")}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Estado</span>
                      <span className={`px-4 py-1 rounded-full text-sm ${order.status === "Completed" ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"}`}>
                        {order.status}
                      </span>
                    </div>
                  </div>
                </div>

                <Button className="w-full py-6 text-lg" onClick={() => alert("Upload feature coming soon")}>
                  Subir archivo / Evidencia
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
