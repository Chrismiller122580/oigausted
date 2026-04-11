"use client"
import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useSession } from "next-auth/react"
import { Clock, Package, MessageCircle, Upload, Download, CheckCircle } from "lucide-react"

export default function OrderDetailPage() {
  const params = useParams()
  const { data: session } = useSession()

  const [order, setOrder] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    fetchOrder()
  }, [])

  const fetchOrder = async () => {
    try {
      const res = await fetch(`/api/orders/${params.id}`)
      if (!res.ok) throw new Error("Order not found")
      const data = await res.json()
      setOrder(data.order)
    } catch (err) {
      console.error(err)
      setError("Orden no encontrada o no tienes acceso")
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div className="container py-20 text-center">Cargando orden...</div>
  if (error) return <div className="container py-20 text-center text-red-600">{error}</div>
  if (!order) return <div className="container py-20 text-center">Orden no encontrada</div>

  const isBuyer = order.buyerId === (session?.user as any)?.id
  const isSeller = order.sellerId === (session?.user as any)?.id

  return (
    <div className="container max-w-4xl mx-auto py-12 px-6">
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

      <div className="grid md:grid-cols-12 gap-8">
        {/* Main Content */}
        <div className="md:col-span-8 space-y-8">
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

          {/* Chat Placeholder */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5" />
                Chat con {isBuyer ? "el vendedor" : "el comprador"}
              </CardTitle>
            </CardHeader>
            <CardContent className="h-64 bg-gray-50 rounded-xl flex items-center justify-center border">
              <p className="text-gray-500">Chat en tiempo real (próximamente)</p>
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
        <div className="md:col-span-4">
          <Card className="sticky top-8">
            <CardHeader>
              <CardTitle>Resumen</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <p className="text-sm text-gray-500">Precio</p>
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
