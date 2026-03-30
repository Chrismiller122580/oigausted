"use client"
import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Star } from "lucide-react"
import { useToast } from "@/components/ToastProvider"

interface Order {
  id: string
  gigTitle: string
  price: number
  status: "Pending" | "In Progress" | "Review" | "Completed"
  progress: number
  buyer: string
  seller: string
  messages: { from: string; text: string; time: string }[]
  paidToSeller?: boolean
  rating?: number
  reviewComment?: string
}

export default function OrderDetail() {
  const params = useParams()
  const router = useRouter()
  const { showToast } = useToast()
  const [order, setOrder] = useState<Order | null>(null)
  const [message, setMessage] = useState("")
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [showRatingModal, setShowRatingModal] = useState(false)
  const [rating, setRating] = useState(5)
  const [reviewComment, setReviewComment] = useState("")

  useEffect(() => {
    const userStr = localStorage.getItem("oigausted-user")
    if (userStr) setCurrentUser(JSON.parse(userStr))

    const savedOrders = localStorage.getItem("oigausted-orders")
    if (savedOrders) {
      const allOrders: Order[] = JSON.parse(savedOrders)
      const found = allOrders.find(o => o.id === params.id)
      if (found) setOrder(found)
    }
  }, [params.id])

  const saveOrder = (updatedOrder: Order) => {
    const savedOrders = localStorage.getItem("oigausted-orders")
    let allOrders: Order[] = savedOrders ? JSON.parse(savedOrders) : []
    allOrders = allOrders.map(o => o.id === updatedOrder.id ? updatedOrder : o)
    localStorage.setItem("oigausted-orders", JSON.stringify(allOrders))
    setOrder(updatedOrder)
  }

  const sendMessage = () => {
    if (!message.trim() || !order || !currentUser) return
    const newMsg = {
      from: currentUser.name,
      text: message.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
    const updated = { ...order, messages: [...order.messages, newMsg] }
    saveOrder(updated)
    setMessage("")
    showToast("Mensaje enviado", "success")
  }

  const updateProgress = (newProgress: number) => {
    if (!order || currentUser?.role !== "seller") return
    const updated = { ...order, progress: newProgress }
    if (newProgress === 100) updated.status = "Completed"
    saveOrder(updated)
    showToast(`Progreso actualizado a ${newProgress}%`, "success")
  }

  const markAsReceivedAndPay = () => {
    if (!order || currentUser?.role !== "buyer" || order.paidToSeller) return

    const updated: Order = {
      ...order,
      status: "Completed",
      progress: 100,
      paidToSeller: true
    }

    saveOrder(updated)
    setShowRatingModal(true)   // Auto-open rating right after approval
    showToast("¡Trabajo aprobado! Pago liberado al vendedor.", "success")
  }

  const submitRating = () => {
    if (!order) return

    const updated: Order = {
      ...order,
      rating,
      reviewComment: reviewComment.trim() || undefined
    }

    saveOrder(updated)
    setShowRatingModal(false)
    setReviewComment("")
    showToast(`¡Calificación de ${rating} estrellas enviada!`, "success")
  }

  const openRatingModal = () => {
    if (order?.paidToSeller) {
      setRating(order.rating || 5)
      setReviewComment(order.reviewComment || "")
      setShowRatingModal(true)
    }
  }

  if (!order) {
    return <div className="container py-12 text-center">Pedido no encontrado.</div>
  }

  const isBuyer = currentUser?.role === "buyer"
  const isSeller = currentUser?.role === "seller"
  const canRate = isBuyer && order.paidToSeller

  return (
    <div className="container mx-auto py-12 px-6 max-w-4xl">
      <Button variant="ghost" onClick={() => router.push("/profile")} className="mb-8">
        ← Volver a Mi Perfil
      </Button>

      <div className="bg-white border rounded-3xl p-10">
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-3xl font-bold">{order.gigTitle}</h1>
            <p className="text-gray-600 mt-1">
              Comprador: <strong>{order.buyer}</strong> • Vendedor: <strong>{order.seller}</strong>
            </p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-green-600">${order.price.toLocaleString("es-CO")}</p>
          </div>
        </div>

        {/* Progress */}
        <div className="mb-10">
          <div className="flex justify-between text-sm mb-3">
            <span>Progreso del trabajo</span>
            <span className="font-semibold">{order.progress}%</span>
          </div>
          <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-yellow-500 to-orange-500 transition-all duration-500" 
              style={{ width: `${order.progress}%` }}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-4 mb-10">
          {isSeller && [25, 50, 75, 100].map(p => (
            <Button 
              key={p} 
              variant={order.progress === p ? "default" : "outline"} 
              size="sm"
              onClick={() => updateProgress(p)}
            >
              {p}%
            </Button>
          ))}

          {isBuyer && order.status === "Completed" && !order.paidToSeller && (
            <Button 
              onClick={markAsReceivedAndPay}
              className="bg-green-600 hover:bg-green-700 text-white px-8 py-6 text-lg"
            >
              ✅ Aprobar Trabajo y Pagar al Vendedor
            </Button>
          )}

          {canRate && (
            <Button 
              onClick={openRatingModal}
              variant="outline"
              className="border-yellow-600 text-yellow-700 hover:bg-yellow-50"
            >
              ⭐ Calificar Trabajo
            </Button>
          )}

          {order.paidToSeller && (
            <div className="px-6 py-3 bg-green-100 text-green-700 rounded-2xl font-medium flex items-center gap-2">
              ✓ Pago liberado al vendedor
            </div>
          )}
        </div>

        {/* Chat Section */}
        <div className="border rounded-2xl p-6 bg-gray-50">
          <h3 className="font-semibold mb-4">Chat del Pedido</h3>
          <div className="h-80 overflow-y-auto space-y-4 mb-6 pr-2">
            {order.messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.from === currentUser?.name ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-2xl px-5 py-3 ${msg.from === currentUser?.name ? 'bg-yellow-600 text-white' : 'bg-white border'}`}>
                  <p className="text-xs opacity-75 mb-1">{msg.from}</p>
                  <p>{msg.text}</p>
                  <p className="text-[10px] opacity-60 text-right mt-1">{msg.time}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-3">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Escribe un mensaje..."
              className="flex-1 border rounded-2xl px-5 py-3 focus:outline-none focus:border-yellow-600"
            />
            <Button onClick={sendMessage}>Enviar</Button>
          </div>
        </div>
      </div>

      {/* Rating Modal */}
      {showRatingModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-8">
            <h2 className="text-2xl font-bold mb-6 text-center">Califica el trabajo del vendedor</h2>
            
            <div className="flex justify-center gap-3 mb-8 text-6xl">
              {[1,2,3,4,5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  className={`transition-transform hover:scale-110 ${star <= rating ? 'text-yellow-500' : 'text-gray-300'}`}
                >
                  ★
                </button>
              ))}
            </div>

            <textarea
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              placeholder="Comentario (opcional pero recomendado)..."
              className="w-full border rounded-2xl p-5 h-32 focus:outline-none focus:border-yellow-600"
            />

            <div className="flex gap-4 mt-8">
              <Button variant="outline" className="flex-1" onClick={() => setShowRatingModal(false)}>
                Cancelar
              </Button>
              <Button className="flex-1 bg-yellow-600 hover:bg-yellow-700" onClick={submitRating}>
                Enviar Calificación
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
