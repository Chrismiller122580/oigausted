"use client"
import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ToastProvider"

interface Order {
  id: string
  gigTitle: string
  price: number
  status: "Pending" | "In Progress" | "Review" | "Completed"
  buyer: string
  seller: string
  messages: { from: string; text: string; time: string }[]
  files: { name: string; url: string }[]
  addOns: { name: string; price: number }[]
  progress: number
}

export default function OrderDetailPage() {
  const { id } = useParams() as { id: string }
  const [order, setOrder] = useState<Order | null>(null)
  const [newMessage, setNewMessage] = useState("")
  const { showToast } = useToast()

  useEffect(() => {
    const saved = localStorage.getItem("oigausted-orders")
    if (saved) {
      const orders: Order[] = JSON.parse(saved)
      const found = orders.find(o => o.id === id)
      if (found) setOrder(found)
    }
  }, [id])

  const saveOrder = (updatedOrder: Order) => {
    const saved = localStorage.getItem("oigausted-orders")
    if (saved) {
      const orders: Order[] = JSON.parse(saved)
      const newOrders = orders.map(o => o.id === updatedOrder.id ? updatedOrder : o)
      localStorage.setItem("oigausted-orders", JSON.stringify(newOrders))
      setOrder(updatedOrder)
    }
  }

  const sendMessage = () => {
    if (!newMessage.trim() || !order) return

    const updated = { ...order }
    updated.messages.push({
      from: "Tú",
      text: newMessage.trim(),
      time: new Date().toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" })
    })
    saveOrder(updated)
    setNewMessage("")
  }

  const markAsReceived = () => {
    if (!order) return
    const updated = { ...order, status: "Completed", progress: 100 }
    saveOrder(updated)
    showToast("¡Pedido marcado como recibido! Gracias por tu compra.", "success")
  }

  const updateProgress = (newProgress: number) => {
    if (!order) return
    const updated = { 
      ...order, 
      progress: newProgress,
      status: newProgress === 100 ? "Completed" : order.status 
    }
    saveOrder(updated)
    showToast(`Progreso actualizado a ${newProgress}%`, "success")
  }

  const changeStatus = (newStatus: Order["status"]) => {
    if (!order) return
    const updated = { ...order, status: newStatus }
    if (newStatus === "Completed") updated.progress = 100
    saveOrder(updated)
    showToast(`Estado cambiado a ${newStatus}`, "success")
  }

  if (!order) return <div className="container py-12 text-center">Cargando orden...</div>

  return (
    <div className="container mx-auto py-12 px-6 max-w-5xl">
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold">{order.gigTitle}</h1>
          <p className="text-yellow-600 font-medium mt-1">${order.price.toLocaleString("es-CO")}</p>
        </div>
        <div className={`px-5 py-2 text-sm font-medium rounded-full ${
          order.status === "Completed" ? "bg-green-100 text-green-700" :
          order.status === "In Progress" ? "bg-blue-100 text-blue-700" : "bg-yellow-100 text-yellow-700"
        }`}>
          {order.status}
        </div>
      </div>

      {/* Progress */}
      <div className="bg-white border rounded-3xl p-8 mb-10">
        <div className="flex justify-between mb-3">
          <h3 className="font-semibold">Progreso del Pedido</h3>
          <span className="text-sm text-gray-500">{order.progress}%</span>
        </div>
        <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className="h-full bg-yellow-600 transition-all duration-300" 
            style={{ width: `${order.progress}%` }}
          />
        </div>
        <div className="flex gap-2 mt-6">
          {[25, 50, 75, 100].map((p) => (
            <Button 
              key={p}
              variant={order.progress === p ? "default" : "outline"}
              size="sm"
              onClick={() => updateProgress(p)}
            >
              {p}%
            </Button>
          ))}
        </div>
        {order.status !== "Completed" && (
          <Button onClick={markAsReceived} className="mt-6 w-full bg-green-600 hover:bg-green-700">
            Marcar como Recibido
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Chat */}
        <div className="lg:col-span-7 bg-white border rounded-3xl p-8">
          <h3 className="font-semibold mb-6">Chat entre Comprador y Vendedor</h3>
          <div className="h-96 overflow-y-auto border rounded-2xl p-6 space-y-6 bg-gray-50 mb-6">
            {order.messages.length === 0 ? (
              <p className="text-center text-gray-400 py-12">El chat está vacío. Envía el primer mensaje.</p>
            ) : (
              order.messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.from === "Tú" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[75%] px-5 py-3.5 rounded-3xl ${
                    msg.from === "Tú" 
                      ? "bg-yellow-600 text-white" 
                      : "bg-white border"
                  }`}>
                    <p className="text-xs opacity-70 mb-1 font-medium">{msg.from}</p>
                    <p className="text-[15px]">{msg.text}</p>
                    <p className="text-[10px] opacity-60 mt-1">{msg.time}</p>
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
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              className="flex-1 border rounded-3xl px-6 py-4 focus:outline-none focus:border-yellow-600 text-[15px]"
              placeholder="Escribe un mensaje..."
            />
            <Button onClick={sendMessage} className="px-8">Enviar</Button>
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-5 space-y-8">
          <div className="bg-white border rounded-3xl p-8">
            <h3 className="font-semibold mb-4">Cambiar Estado</h3>
            <div className="grid grid-cols-2 gap-3">
              {(["Pending", "In Progress", "Review", "Completed"] as const).map((s) => (
                <Button 
                  key={s}
                  variant={order.status === s ? "default" : "outline"}
                  onClick={() => changeStatus(s)}
                >
                  {s}
                </Button>
              ))}
            </div>
          </div>

          <div className="bg-white border rounded-3xl p-8">
            <h3 className="font-semibold mb-4">Archivos</h3>
            <Button className="w-full mb-6" onClick={() => showToast("Archivo subido correctamente", "success")}>
              📎 Subir archivo
            </Button>
          </div>

          <div className="bg-white border rounded-3xl p-8">
            <h3 className="font-semibold mb-4">Add-ons</h3>
            <Button variant="outline" className="w-full" onClick={() => showToast("Add-on agregado", "success")}>
              + Agregar Add-on
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
