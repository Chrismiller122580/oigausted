"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft } from "lucide-react"

export default function CheckoutPage() {
  const { orderId } = useParams()
  const router = useRouter()
  const [order, setOrder] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const savedOrders = JSON.parse(localStorage.getItem("oigausted-orders") || "[]")
    const foundOrder = savedOrders.find((o: any) => o.id === orderId)
    setOrder(foundOrder)
    setLoading(false)
  }, [orderId])

  const handleWompiPayment = () => {
    if (!order) return

    // Your exact public key from the screenshot
    const wompiPublicKey = "pub_test_hhnHHaFm6UYVNyVRg8KdLOmC5wPZsQfZ"

    const amountInCents = Math.round(order.price * 100)
    const uniqueReference = `oigausted-${order.id}-${Date.now()}`

    // Simple & Reliable Generic Paid Link
    const checkoutUrl = `https://checkout.wompi.co/p/?` +
      `public-key=${wompiPublicKey}` +
      `&amount-in-cents=${amountInCents}` +
      `&reference=${uniqueReference}` +
      `&currency=COP` +
      `&redirect-url=${encodeURIComponent(`https://oigausted-clean.vercel.app/orders/${order.id}?success=true`)}`

    console.log("Opening Wompi with URL:", checkoutUrl)
    window.location.href = checkoutUrl
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center">Cargando orden...</div>
  if (!order) return <div className="min-h-screen flex items-center justify-center">Orden no encontrada</div>

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container max-w-lg mx-auto px-4">
        <Button 
          variant="ghost" 
          onClick={() => router.back()}
          className="mb-6"
        >
          <ArrowLeft className="mr-2" /> Volver
        </Button>

        <Card className="shadow-2xl">
          <CardHeader>
            <CardTitle className="text-3xl">Confirmar tu pago</CardTitle>
          </CardHeader>
          <CardContent className="p-8 space-y-8">
            <div>
              <p className="text-gray-500">Estás comprando</p>
              <p className="text-2xl font-bold mt-1">{order.gigTitle}</p>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-6">
              <div className="flex justify-between items-baseline">
                <span className="text-lg">Total a pagar</span>
                <span className="text-4xl font-bold text-yellow-600">
                  ${order.price.toLocaleString()}
                </span>
              </div>
            </div>

            <Button 
              onClick={handleWompiPayment}
              className="w-full py-8 text-xl bg-green-600 hover:bg-green-700 font-semibold"
            >
              Pagar con Wompi (Sandbox)
            </Button>

            <div className="text-center text-xs text-gray-500">
              Serás redirigido al checkout oficial de Wompi
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
