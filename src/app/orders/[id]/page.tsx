"use client"
import { useSession } from "next-auth/react"
import { useRouter, useParams } from "next/navigation"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Send, Upload, CheckCircle, FileText } from "lucide-react"
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
  if (!order) return <div className="min-h-screen flex items-center justify-center text-red-600">Orden no encontrada</div>

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
          <span className={`ml-auto px-5 py-2 rounded-full text-sm font-medium ${
            order.status === "Completed" ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"
          }`}>
            {order.status}
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-8 space-y-8">
            {/* Progress / Milestones */}
            <Card>
              <CardHeader>
                <CardTitle>Progreso de la Orden</CardTitle>
              </CardHeader>
              <CardContent className="p-8">
                <div className="flex justify-between mb-4">
                  <span className="text-sm text-gray-600">Avance</span>
                  <span className="font-bold text-orange-600">{order.progress}%</span>
                </div>
                <div className="h-4 bg-gray-200 rounded-full overflow-hidden mb-8">
                  <div 
                    className="h-full bg-gradient-to-r from-orange-500 to-red-600 transition-all duration-500" 
                    style={{ width: `${order.progress}%` }}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
                  {["Pending", "InProgress", "Review", "Completed"].map((status, index) => (
                    <div key={index} className={`p-4 rounded-2xl border ${order.status === status ? 'border-orange-500 bg-orange-50' : 'border-gray-200'}`}>
                      <CheckCircle className={`mx-auto mb-2 ${order.status === status ? 'text-orange-600' : 'text-gray-300'}`} size={28} />
                      <p className="text-sm font-medium">{status}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Chat */}
            <Card>
              <CardHeader>
                <CardTitle>Chat con {isBuyer ? order.seller?.name : order.buyer?.name}</CardTitle>
              </CardHeader>
              <CardContent className="p-8">
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
              <CardHeader>
                <CardTitle>Resumen de la Orden</CardTitle>
              </CardHeader>
              <CardContent className="p-8 space-y-8">
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Gig</span>
                    <span className="font-medium text-right">{order.gig?.title}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Precio</span>
                    <span className="font-bold text-xl text-orange-600">${order.price?.toLocaleString("es-CO")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Estado</span>
                    <span className={`px-5 py-2 rounded-full text-sm font-medium ${order.status === "Completed" ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"}`}>
                      {order.status}
                    </span>
                  </div>
                </div>

                {/* File Upload */}
                <div>
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <Upload size={18} /> Archivos / Evidencia
                  </h4>
                  <Button variant="outline" className="w-full py-6" onClick={() => alert("File upload coming in next step")}>
                    Subir archivo
                  </Button>
                  <p className="text-xs text-gray-500 mt-3 text-center">Imágenes, documentos o comprobantes</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
