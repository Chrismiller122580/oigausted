"use client"
import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowLeft, Loader2, Clock } from "lucide-react"

declare global {
  interface Window {
    WompiCheckout: any
  }
}

export default function GigCheckoutPage() {
  const params = useParams()
  const router = useRouter()
  const gigId = params.gigId as string

  const [gig, setGig] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [paying, setPaying] = useState(false)
  const [error, setError] = useState("")
  const [wompiReady, setWompiReady] = useState(false)

  // Load Wompi script
  useEffect(() => {
    const scriptId = "wompi-script"

    if (document.getElementById(scriptId)) {
      setWompiReady(true)
      return
    }

    const script = document.createElement("script")
    script.id = scriptId
    script.src = "https://checkout.wompi.co/widget.js"
    script.async = true
    script.onload = () => setWompiReady(true)
    script.onerror = () => setError("No se pudo cargar Wompi. Verifica tu conexión.")
    document.body.appendChild(script)
  }, [])

  useEffect(() => {
    fetchGig()
  }, [gigId])

  const fetchGig = async () => {
    try {
      const res = await fetch(`/api/gigs/${gigId}`)
      if (!res.ok) throw new Error("Gig no encontrado")
      const data = await res.json()
      setGig(data.gig)
    } catch (err: any) {
      setError(err.message || "No se encontró el gig")
    } finally {
      setLoading(false)
    }
  }

  const handlePayment = async () => {
    if (!gig || !wompiReady) {
      alert("Wompi aún no está listo. Espera un momento o refresca la página.")
      return
    }

    setPaying(true)

    try {
      const orderRes = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gigId })
      })

      if (!orderRes.ok) throw new Error("No se pudo crear la orden")
      const { order } = await orderRes.json()

      const checkout = new window.WompiCheckout({
        amount_in_cents: Math.round(gig.price * 100),
        currency: "COP",
        reference: `order_${order.id}`,
        public_key: process.env.NEXT_PUBLIC_WOMPI_PUBLIC_KEY,
        redirect_url: `${window.location.origin}/orders/${order.id}`,
        onSuccess: () => router.push(`/orders/${order.id}`),
        onError: () => alert("Error en el pago. Inténtalo de nuevo."),
        onClose: () => setPaying(false)
      })

      checkout.open()
    } catch (err: any) {
      console.error(err)
      alert("Error al procesar el pago")
      setPaying(false)
    }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center text-xl">Cargando gig...</div>
  if (error || !gig) {
    return <div className="min-h-screen flex items-center justify-center text-red-600">{error || "Gig no encontrado"}</div>
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-6">
        <Button variant="ghost" onClick={() => router.back()} className="mb-8">
          <ArrowLeft className="mr-2 h-4 w-4" /> Volver
        </Button>

        <Card className="shadow-sm">
          <CardContent className="p-10 space-y-10">
            <div>
              <h1 className="text-4xl font-bold tracking-tight">{gig.title}</h1>
              <p className="text-gray-600 mt-3">
                Vendedor: {gig.seller?.name || gig.seller?.businessName || "Vendedor"}
              </p>
            </div>

            {gig.deliveryTime && (
              <div className="flex items-center gap-3 text-lg bg-emerald-50 p-4 rounded-2xl">
                <Clock className="text-emerald-600" />
                <span>Entrega estimada: <strong>{gig.deliveryTime}</strong></span>
              </div>
            )}

            {gig.fields && Object.keys(gig.fields).length > 0 && (
              <div>
                <h3 className="font-semibold mb-4">Detalles del servicio:</h3>
                <div className="space-y-3">
                  {Object.entries(gig.fields).map(([key, value]) => (
                    <div key={key} className="bg-gray-50 p-4 rounded-2xl">
                      <p className="text-sm text-gray-500 capitalize">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </p>
                      <p className="font-medium">{String(value || "No especificado")}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="border-t pt-8 flex justify-between items-end">
              <span className="text-2xl text-gray-600">Total a pagar</span>
              <span className="text-5xl font-bold text-emerald-600">
                ${gig.price?.toLocaleString("es-CO")}
              </span>
            </div>

            <Button
              onClick={handlePayment}
              disabled={paying || !wompiReady}
              className="w-full py-8 text-xl bg-[#00A651] hover:bg-[#008F44] rounded-3xl font-semibold text-white"
            >
              {paying ? (
                <>
                  <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                  Procesando...
                </>
              ) : !wompiReady ? (
                "Cargando Wompi..."
              ) : (
                "💳 Pagar con Wompi"
              )}
            </Button>

            <p className="text-center text-sm text-gray-500">
              Pago seguro procesado por <strong>Wompi</strong> • Bancolombia
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}