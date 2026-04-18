"use client"
import { useEffect, useState, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowLeft, Send, Paperclip, Loader2, CreditCard, MessageCircle, CheckCircle, Star } from "lucide-react"
import { toast } from "react-hot-toast"

const statusSteps = [
  { key: "Pending", label: "Pendiente de pago", color: "bg-orange-500" },
  { key: "Paid", label: "Pagado", color: "bg-green-500" },
  { key: "In Progress", label: "En progreso", color: "bg-blue-500" },
  { key: "Completed", label: "Completado", color: "bg-emerald-500" },
  { key: "Approved", label: "Aprobado", color: "bg-purple-500" },
]

const statusConfig: any = {
  Pending: { label: "Pendiente de pago", color: "bg-orange-100 text-orange-700" },
  Paid: { label: "Pagado ✓", color: "bg-green-100 text-green-700" },
  "In Progress": { label: "En progreso", color: "bg-blue-100 text-blue-700" },
  Completed: { label: "Completado", color: "bg-emerald-100 text-emerald-700" },
  Approved: { label: "Aprobado", color: "bg-purple-100 text-purple-700" },
}

export default function OrderDetailPage() {
  const params = useParams()
  const router = useRouter()
  const orderId = params.id as string
  const { data: session } = useSession()

  const [order, setOrder] = useState<any>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [files, setFiles] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [rating, setRating] = useState(0)
  const [reviewComment, setReviewComment] = useState("")

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const currentUserRole = (session?.user as any)?.role as string | undefined
  const isBuyer = currentUserRole === "buyer"
  const isSeller = currentUserRole === "seller"

  useEffect(() => {
    if (!orderId) return
    fetchOrder()
    fetchFiles()
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

  const fetchFiles = async () => {
    try {
      const res = await fetch(`/api/orders/${orderId}/files`)
      if (res.ok) {
        const data = await res.json()
        setFiles(data.files || [])
      }
    } catch (err) {
      console.error(err)
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
      console.error(err)
    }
  }

  const updateOrderStatus = async (newStatus: string) => {
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
      })
      if (res.ok) {
        const data = await res.json()
        setOrder(data.order)
        toast.success(`Estado actualizado a ${newStatus}`)
      }
    } catch (err) {
      toast.error("Error al actualizar estado")
    }
  }

  const submitRating = async () => {
    if (rating === 0) {
      toast.error("Por favor selecciona una calificación")
      return
    }
    try {
      const res = await fetch(`/api/orders/${orderId}/rate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, comment: reviewComment })
      })
      if (res.ok) {
        toast.success("¡Gracias por tu calificación!")
        setRating(0)
        setReviewComment("")
        fetchOrder() // refresh
      }
    } catch (err) {
      toast.error("Error al enviar calificación")
    }
  }

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return
    setSending(true)
    try {
      const res = await fetch(`/api/orders/${orderId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newMessage.trim() })
      })
      if (res.ok) {
        setNewMessage("")
        fetchMessages()
      }
    } catch (err) {
      console.error(err)
    } finally {
      setSending(false)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const toastId = toast.loading(`Subiendo ${file.name}...`)
    setUploading(true)

    const formData = new FormData()
    formData.append("file", file)

    try {
      const res = await fetch(`/api/orders/${orderId}/files`, {
        method: "POST",
        body: formData
      })
      const data = await res.json()
      if (res.ok) {
        toast.success(`✅ ${file.name} subido`, { id: toastId })
        fetchFiles()
      } else {
        toast.error(data.error || "Error al subir", { id: toastId })
      }
    } catch (err) {
      toast.error("Error de conexión", { id: toastId })
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center">Cargando orden...</div>
  if (!order) return <div className="min-h-screen flex items-center justify-center text-red-600">Orden no encontrada</div>

  const currentStepIndex = statusSteps.findIndex(step => step.key === order.status)
  const isApproved = order.status === "Approved"

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="max-w-6xl mx-auto px-6">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-8">
          <ArrowLeft size={20} /> Volver
        </button>

        {/* Workflow Meter */}
        <Card className="mb-8">
          <CardContent className="p-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold">Estado del Servicio</h2>
              <div className={`px-6 py-2 rounded-2xl text-sm font-medium ${statusConfig[order.status]?.color || "bg-gray-100"}`}>
                {statusConfig[order.status]?.label || order.status}
              </div>
            </div>

            <div className="relative flex items-center justify-between">
              {statusSteps.map((step, index) => (
                <div key={step.key} className="flex flex-col items-center flex-1">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold transition-all ${index <= currentStepIndex ? step.color : "bg-gray-200"}`}>
                    {index + 1}
                  </div>
                  <p className={`mt-3 text-sm text-center ${index <= currentStepIndex ? "font-medium" : "text-gray-400"}`}>
                    {step.label}
                  </p>
                  {index < statusSteps.length - 1 && (
                    <div className={`absolute h-1 w-1/4 top-5 left-1/4 ${index < currentStepIndex ? "bg-emerald-500" : "bg-gray-200"}`} />
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-8">
            <Card>
              <CardContent className="p-8">
                <h1 className="text-3xl font-bold">{order.gig?.title}</h1>
                <p className="text-4xl font-bold text-orange-600 mt-2">
                  ${order.price?.toLocaleString("es-CO")}
                </p>
              </CardContent>
            </Card>

            {/* Role-based Actions */}
            {isSeller && order.status === "Paid" && (
              <div className="flex gap-4">
                <Button onClick={() => updateOrderStatus("In Progress")} className="flex-1 py-6">Marcar como En Progreso</Button>
                <Button onClick={() => updateOrderStatus("Completed")} variant="outline" className="flex-1 py-6">Marcar como Completado</Button>
              </div>
            )}

            {isBuyer && order.status === "Completed" && !isApproved && (
              <Button onClick={() => updateOrderStatus("Approved")} className="w-full py-8 text-xl bg-emerald-600">
                Aprobar Servicio y Liberar Pago
              </Button>
            )}

            {/* Rating Section - appears after approval */}
            {isBuyer && isApproved && (
              <Card>
                <CardContent className="p-8">
                  <h3 className="font-semibold text-xl mb-6">Califica al vendedor</h3>
                  <div className="flex gap-2 mb-6">
                    {[1,2,3,4,5].map((star) => (
                      <button key={star} onClick={() => setRating(star)} className={`text-4xl ${star <= rating ? "text-yellow-500" : "text-gray-300"}`}>
                        ★
                      </button>
                    ))}
                  </div>
                  <textarea
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder="Escribe tu reseña (opcional)"
                    className="w-full h-32 p-4 border rounded-2xl mb-4"
                  />
                  <Button onClick={submitRating} disabled={rating === 0} className="w-full py-6">
                    Enviar Calificación
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Chat */}
            <Card>
              <CardContent className="p-8">
                <h3 className="font-semibold text-xl mb-6 flex items-center gap-2">
                  <MessageCircle size={22} /> Chat con el vendedor
                </h3>
                {/* Your existing chat code remains here */}
                <div className="h-96 bg-gray-50 rounded-2xl p-6 mb-6 overflow-y-auto space-y-4" id="chat-container">
                  {messages.length === 0 ? (
                    <p className="text-gray-500 text-center py-12">Aún no hay mensajes</p>
                  ) : (
                    messages.map((msg, i) => (
                      <div key={i} className={`flex ${msg.isFromBuyer ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[75%] px-5 py-3 rounded-3xl ${msg.isFromBuyer ? "bg-orange-600 text-white" : "bg-white border"}`}>
                          <p>{msg.content}</p>
                          <p className="text-xs opacity-70 mt-1 text-right">
                            {new Date(msg.createdAt).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" })}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </div>
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                    placeholder="Escribe un mensaje..."
                    className="flex-1 px-6 py-4 border rounded-3xl focus:outline-none focus:border-orange-500"
                  />
                  <Button onClick={handleSendMessage} disabled={sending || !newMessage.trim()} className="px-8">
                    {sending ? <Loader2 className="animate-spin" /> : <Send size={22} />}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Files Sidebar - your existing code */}
          <div className="lg:col-span-4">
            <Card className="sticky top-8">
              <CardContent className="p-8">
                <h3 className="font-semibold mb-6">Archivos subidos ({files.length})</h3>
                {/* Your existing files list and upload button */}
                <div className="min-h-[300px] bg-gray-50 rounded-2xl p-6 mb-6 overflow-y-auto space-y-4">
                  {files.length === 0 ? (
                    <p className="text-gray-500 text-center py-12">Aún no hay archivos</p>
                  ) : (
                    files.map((file, i) => (
                      <div key={i} className="flex items-start gap-4 p-4 bg-white rounded-2xl border">
                        <Paperclip className="h-6 w-6 text-gray-400 mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">
                            {file.name || file.fileName || "Archivo sin nombre"}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            Subido por {(file.uploadedBy === "buyer" || file.uploadedByBuyer) ? "el comprador" : "el vendedor"} •
                            {new Date(file.createdAt).toLocaleDateString("es-CO", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <input ref={fileInputRef} type="file" onChange={handleFileUpload} className="hidden" />
                <Button onClick={() => fileInputRef.current?.click()} disabled={uploading} className="w-full py-7" variant="outline">
                  {uploading ? "Subiendo..." : "Subir nuevo archivo"}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}