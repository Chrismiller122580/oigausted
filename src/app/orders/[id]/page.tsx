"use client"
import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ToastProvider"
import { MessageCircle, Upload, Star, CheckCircle, ArrowLeft } from "lucide-react"

interface Order {
  id: string
  gigTitle: string
  price: number
  status: string
  progress: number
  buyer: string
  seller: string
  messages: { from: string; text: string; time: string }[]
  files: { name: string; url: string }[]
  rating?: number
  reviewComment?: string
}

export default function OrderDetail() {
  const params = useParams()
  const router = useRouter()
  const { showToast } = useToast()
  
  const [order, setOrder] = useState<Order | null>(null)
  const [newMessage, setNewMessage] = useState("")
  const [rating, setRating] = useState(0)
  const [reviewComment, setReviewComment] = useState("")
  const [showRatingModal, setShowRatingModal] = useState(false)

  useEffect(() => {
    const savedOrders = JSON.parse(localStorage.getItem("oigausted-orders") || "[]")
    const found = savedOrders.find((o: Order) => o.id === params.id)
    
    if (found) {
      setOrder(found)
    } else {
      router.push("/buyer")
    }
  }, [params.id, router])

  const sendMessage = () => {
    if (!newMessage.trim() || !order) return

    const updatedOrder = {
      ...order,
      messages: [
        ...order.messages,
        {
          from: "Buyer",
          text: newMessage.trim(),
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]
    }

    const savedOrders = JSON.parse(localStorage.getItem("oigausted-orders") || "[]")
    const index = savedOrders.findIndex((o: Order) => o.id === order.id)
    if (index !== -1) {
      savedOrders[index] = updatedOrder
      localStorage.setItem("oigausted-orders", JSON.stringify(savedOrders))
    }

    setOrder(updatedOrder)
    setNewMessage("")
    showToast("Mensaje enviado al vendedor", "success")
  }

  const markAsReceived = () => {
    setShowRatingModal(true)
  }

  const submitRating = () => {
    if (!order || rating === 0) return

    const updatedOrder = {
      ...order,
      status: "Completed",
      progress: 100,
      rating,
      reviewComment: reviewComment.trim()
    }

    const savedOrders = JSON.parse(localStorage.getItem("oigausted-orders") || "[]")
    const index = savedOrders.findIndex((o: Order) => o.id === order.id)
    if (index !== -1) {
      savedOrders[index] = updatedOrder
      localStorage.setItem("oigausted-orders", JSON.stringify(savedOrders))
    }

    setOrder(updatedOrder)
    setShowRatingModal(false)
    setReviewComment("")

    showToast(`¡Gracias por tu calificación de ${rating} estrellas!`, "success")

    // Auto redirect to home page after rating
    setTimeout(() => {
      router.push("/")
    }, 1500)
  }

  const simulateFileUpload = () => {
    showToast("Archivo subido correctamente (simulación)", "success")
  }

  if (!order) return <div className="p-10 text-center">Cargando pedido...</div>

  return (
    <div className="container py-10 max-w-4xl mx-auto">
      <Button onClick={() => router.push("/buyer")} variant="outline" className="mb-8">
        ← Volver a Mi Perfil
      </Button>

      <div className="bg-white border rounded-3xl p-10">
        <h1 className="text-4xl font-bold mb-2">{order.gigTitle}</h1>
        <p className="text-3xl text-yellow-600 font-semibold mb-8">${order.price}</p>

        {/* Progress */}
        <div className="mb-10">
          <div className="flex justify-between mb-3">
            <span className="font-medium">Progreso del Pedido</span>
            <span>{order.progress}%</span>
          </div>
          <Progress value={order.progress} className="h-5" />
        </div>

        {/* Chat Section */}
        <div className="mb-12">
          <h3 className="font-semibold text-xl mb-4 flex items-center gap-2">
            <MessageCircle className="w-6 h-6" /> Chat con el Vendedor
          </h3>
          <div className="h-80 border rounded-2xl p-6 bg-gray-50 overflow-y-auto mb-4 space-y-4">
            {order.messages.length === 0 ? (
              <p className="text-gray-500 text-center py-10">Aún no hay mensajes. Inicia la conversación.</p>
            ) : (
              order.messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.from === "Buyer" ? "justify-end" : ""}`}>
                  <div className={`max-w-[75%] p-4 rounded-2xl ${msg.from === "Buyer" ? "bg-yellow-600 text-white" : "bg-white border"}`}>
                    <p>{msg.text}</p>
                    <p className="text-xs opacity-70 mt-1">{msg.time}</p>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="flex gap-3">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && sendMessage()}
              placeholder="Escribe un mensaje al vendedor..."
              className="flex-1"
            />
            <Button onClick={sendMessage}>Enviar</Button>
          </div>
        </div>

        {/* File Section */}
        <div className="mb-12">
          <h3 className="font-semibold text-xl mb-4">Archivos y Entregables</h3>
          <Button onClick={simulateFileUpload} className="mb-4">
            <Upload className="mr-2" /> Subir Archivo
          </Button>
        </div>

        {/* Review Section */}
        {order.rating && (
          <div className="mb-8 p-6 border rounded-2xl bg-green-50">
            <h3 className="font-semibold text-lg mb-3">Tu Calificación</h3>
            <div className="flex items-center gap-2 text-3xl text-yellow-500 mb-2">
              {"★".repeat(order.rating)}
            </div>
            {order.reviewComment && <p className="text-gray-700 italic">"{order.reviewComment}"</p>}
          </div>
        )}

        {/* Action Button */}
        {order.status !== "Completed" && (
          <Button 
            onClick={markAsReceived}
            className="w-full py-8 text-xl bg-green-600 hover:bg-green-700"
          >
            Marcar como Recibido y Calificar Servicio
          </Button>
        )}
      </div>

      {/* Rating Modal with Comment */}
      {showRatingModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-white rounded-3xl p-10 max-w-md w-full">
            <h3 className="text-2xl font-bold mb-6 text-center">¿Cómo calificarías este servicio?</h3>
            
            <div className="flex justify-center gap-4 mb-8 text-5xl">
              {[1,2,3,4,5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  className={rating >= star ? "text-yellow-500" : "text-gray-300"}
                >
                  ★
                </button>
              ))}
            </div>

            <Textarea
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              placeholder="Escribe un comentario sobre el servicio (opcional)"
              className="mb-6 min-h-[100px]"
            />

            <Button onClick={submitRating} disabled={rating === 0} className="w-full py-7 text-lg">
              Enviar Calificación y Comentario
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
