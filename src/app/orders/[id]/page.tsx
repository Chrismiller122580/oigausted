"use client"

import { useEffect, useState } from "react"
import { useParams, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Send } from "lucide-react"

export default function OrderDetailPage() {
  const { id } = useParams()
  const searchParams = useSearchParams()
  const isSuccess = searchParams.get("success") === "true"

  const [order, setOrder] = useState<any>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [currentUser, setCurrentUser] = useState("")

  useEffect(() => {
    const savedOrders = JSON.parse(localStorage.getItem("oigausted-orders") || "[]")
    const foundOrder = savedOrders.find((o: any) => o.id === id)
    setOrder(foundOrder)

    const savedMessages = JSON.parse(localStorage.getItem(`chat_${id}`) || "[]")
    setMessages(savedMessages)

    const userStr = localStorage.getItem("oigausted-user")
    if (userStr) {
      try {
        const user = JSON.parse(userStr)
        setCurrentUser(user.name || "")
      } catch (e) {}
    }
  }, [id])

  const sendMessage = () => {
    if (!newMessage.trim() || !order) return

    const messageObj = {
      id: Date.now(),
      text: newMessage.trim(),
      sender: currentUser || "Usuario",
      timestamp: new Date().toISOString()
    }

    const updatedMessages = [...messages, messageObj]
    setMessages(updatedMessages)
    localStorage.setItem(`chat_${id}`, JSON.stringify(updatedMessages))

    setNewMessage("")
  }

  if (!order) return <div className="min-h-screen flex items-center justify-center">Orden no encontrada</div>

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container max-w-3xl mx-auto px-4">
        {isSuccess && (
          <div className="bg-green-100 border border-green-300 rounded-2xl p-6 mb-8 text-center">
            <h1 className="text-2xl font-bold text-green-700">¡Pago confirmado!</h1>
            <p className="text-green-600">El vendedor ha sido notificado. Puedes chatear con él aquí.</p>
          </div>
        )}

        <Card className="mb-8">
          <CardContent className="p-6">
            <h2 className="text-2xl font-semibold">{order.gigTitle}</h2>
            <p className="text-gray-500">Orden #{order.id}</p>
            <p className="text-3xl font-bold text-yellow-600 mt-4">${order.price.toLocaleString()} COP</p>
          </CardContent>
        </Card>

        {/* Chat */}
        <Card className="h-[500px] flex flex-col">
          <div className="p-4 border-b font-medium">Chat con el vendedor</div>
          
          <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-gray-50">
            {messages.length === 0 ? (
              <p className="text-center text-gray-500 mt-10">Aún no hay mensajes. Envía el primero.</p>
            ) : (
              messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.sender === currentUser ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[75%] p-3 rounded-2xl ${msg.sender === currentUser ? "bg-yellow-600 text-white" : "bg-white border"}`}>
                    <p>{msg.text}</p>
                    <p className="text-xs opacity-70 mt-1">{new Date(msg.timestamp).toLocaleTimeString()}</p>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="p-4 border-t flex gap-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && sendMessage()}
              placeholder="Escribe un mensaje..."
            />
            <Button onClick={sendMessage}>
              <Send size={20} />
            </Button>
          </div>
        </Card>
      </div>
    </div>
  )
}
