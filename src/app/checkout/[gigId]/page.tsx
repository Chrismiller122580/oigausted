"use client"
import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowLeft, Loader2 } from "lucide-react"

export default function GigCheckoutPage() {
  const params = useParams()
  const router = useRouter()
  const gigId = params.gigId as string

  const [gig, setGig] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    const fetchGig = async () => {
      try {
        const res = await fetch(`/api/gigs/${gigId}`)
        if (!res.ok) throw new Error("Gig not found")
        const data = await res.json()
        setGig(data.gig)
      } catch (err: any) {
        console.error(err)
        setError(err.message || "No se encontró el gig")
      } finally {
        setLoading(false)
      }
    }
    fetchGig()
  }, [gigId])

  const handleConfirmOrder = async () => {
    setCreating(true)
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gigId })
      })

      if (!res.ok) throw new Error("Failed to create order")

      const data = await res.json()
      router.push(`/orders/${data.order.id}`)
    } catch (err: any) {
      console.error(err)
      alert("Error al crear la orden: " + (err.message || "Desconocido"))
    } finally {
      setCreating(false)
    }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center">Cargando gig...</div>
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

            <div className="border-t pt-8 flex justify-between items-end">
              <span className="text-2xl text-gray-600">Total a pagar</span>
              <span className="text-5xl font-bold text-orange-600">
                ${gig.price?.toLocaleString("es-CO")}
              </span>
            </div>

            <Button 
              onClick={handleConfirmOrder}
              disabled={creating}
              className="w-full py-8 text-xl bg-orange-600 hover:bg-orange-700 rounded-2xl font-semibold"
            >
              {creating ? (
                <>
                  <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                  Creando orden...
                </>
              ) : (
                "Confirmar Orden y Proceder al Pago"
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
