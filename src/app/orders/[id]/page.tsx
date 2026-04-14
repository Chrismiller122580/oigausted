"use client"
import { useEffect, useState, useRef } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowLeft, Send, Paperclip, Loader2 } from "lucide-react"

export default function OrderDetailPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const orderId = params.id as string

  const [order, setOrder] = useState<any>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [files, setFiles] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const userStr = localStorage.getItem("oigausted-user")
    if (userStr) {
      try {
        const user = JSON.parse(userStr)
        setCurrentUserRole(user.role || "buyer")
      } catch (e) {}
    }

    fetchOrder()
    fetchMessages()
    fetchFiles()

    const interval = setInterval(fetchMessages, 4000)
    return () => clearInterval(interval)
  }, [orderId])

  const fetchOrder = async () => {
    try {
      const res = await fetch(`/api/orders/${orderId}`)
      if (res.ok) {
        const data = await res.json()
        setOrder(data.order)
      }
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
      console.error(err)
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

  const sendMessage = async () => {
    if (!newMessage.trim()) return
    setSending(true)
    try {
      const res = await fetch(`/api/orders/${orderId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newMessage })
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

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", file)

      const res = await fetch(`/api/orders/${orderId}/files`, {
        method: "POST",
        body: formData
      })

      if (res.ok) {
        const result = await res.json()
        // Immediately add the new file to the list for instant feedback
        setFiles(prev => [...prev, result.file || { name: file.name, uploadedAt: new Date().toISOString() }])
        alert(`✅ Archivo "${file.name}" subido correctamente`)
      } else {
        alert("Error al subir el archivo")
      }
    } catch (err) {
      console.error(err)
      alert("Error al subir archivo")
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  const handleWompiPayment = async () => {
    if (!order || order.status !== "Pending") return
    try {
      alert("Redirigiendo a Wompi...")
      router.push(`/orders/${orderId}?status=paid`)
    } catch (err) {
      alert("Error en el pago")
    }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center">Cargando orden...</div>
  if (!order) return <div className="min-h-screen flex items-center justify-center text-red-600">Orden no encontrada</div>

  const isBuyer = currentUserRole === "buyer"
  const isPaid = order.status === "Paid"

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-5xl mx-auto px-6">
        <Button variant="ghost" onClick={() => router.back()} className="mb-8">← Volver</Button>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-8">
            <Card>
              <CardContent className="p-8">
                <h1 className="text-4xl font-bold">{order.gig?.title}</h1>
                <p className="text-gray-500">Orden #{order.id.slice(0,8)}</p>
                <div className="mt-6 text-5xl font-bold text-orange-600">
                  ${order.price?.toLocaleString("es-CO")}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-8">
                <h2 className="text-2xl font-semibold mb-6">
                  Chat con {isBuyer ? "el vendedor" : "el comprador"}
                </h2>
                <div className="h-[420px] bg-gray-50 rounded-3xl p-6 mb-6 overflow-y-auto space-y-4">
                  {messages.length === 0 ? (
                    <p className="text-center text-gray-500 py-12">No hay mensajes aún</p>
                  ) : (
                    messages.map((msg, i) => (
                      <div key={i} className={`flex ${msg.isFromBuyer ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[75%] px-6 py-4 rounded-3xl ${msg.isFromBuyer ? 'bg-orange-600 text-white' : 'bg-white border'}`}>
                          {msg.content}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="flex gap-3">
                  <input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                    placeholder="Escribe un mensaje..."
                    className="flex-1 px-6 py-4 border rounded-3xl"
                  />
                  <Button onClick={sendMessage} disabled={sending || !newMessage.trim()}>
                    Enviar
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Files Sidebar - Now with real list */}
          <div className="lg:col-span-4">
            <Card className="sticky top-8">
              <CardContent className="p-8">
                <h3 className="font-semibold mb-6">Archivos subidos ({files.length})</h3>
                
                <div className="min-h-[260px] bg-gray-50 rounded-2xl p-6 mb-6 overflow-y-auto">
                  {files.length === 0 ? (
                    <p className="text-gray-500 text-center py-12">Aún no hay archivos subidos</p>
                  ) : (
                    files.map((file, i) => (
                      <div key={i} className="py-3 border-b last:border-0 flex items-center gap-3 text-sm">
                        <Paperclip className="h-5 w-5 text-gray-400 flex-shrink-0" />
                        <span className="truncate">{file.name}</span>
                      </div>
                    ))
                  )}
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <Button 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="w-full py-7"
                  variant="outline"
                >
                  {uploading ? "Subiendo archivo..." : "Subir nuevo archivo"}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
