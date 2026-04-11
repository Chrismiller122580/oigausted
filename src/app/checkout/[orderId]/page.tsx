"use client"
import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { useSession } from "next-auth/react"

export default function CheckoutPage() {
  const params = useParams()
  const router = useRouter()
  const { data: session } = useSession()

  const [gig, setGig] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    fetchGig()
  }, [])

  const fetchGig = async () => {
    try {
      const res = await fetch(`/api/gigs/${params.orderId}`)
      if (!res.ok) throw new Error("Gig not found")
      const data = await res.json()
      setGig(data.gig)
    } catch (err) {
      console.error(err)
      setError("No se pudo cargar el gig")
    } finally {
      setLoading(false)
    }
  }

  const handleConfirmPurchase = async () => {
    if (!gig || !session?.user) return

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gigId: gig.id,
          price: gig.price
        })
      })

      if (res.ok) {
        const { order } = await res.json()
        router.push(`/orders/${order.id}`)
      } else {
        alert("Error al crear la orden")
      }
    } catch (err) {
      console.error(err)
      alert("Error al procesar la compra")
    }
  }

  if (loading) return <div className="container py-20 text-center">Cargando checkout...</div>
  if (error) return <div className="container py-20 text-center text-red-600">{error}</div>
  if (!gig) return <div className="container py-20 text-center">Gig no encontrado</div>

  return (
    <div className="container max-w-2xl mx-auto py-12 px-6">
      <div className="mb-8">
        <Link href="/gigs" className="text-orange-600 hover:underline">
          ← Volver a los gigs
        </Link>
      </div>

      <h1 className="text-3xl font-bold mb-8">Confirmar Compra</h1>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>{gig.title}</CardTitle>
        </CardHeader>
        <CardContent className="p-8">
          <p className="text-gray-600 mb-6">{gig.description}</p>
          <div className="text-5xl font-bold text-orange-600 mb-8">
            ${gig.price.toLocaleString("es-CO")} COP
          </div>

          <Button 
            onClick={handleConfirmPurchase}
            size="lg"
            className="w-full py-8 text-xl bg-orange-600 hover:bg-orange-700"
          >
            Confirmar y Pagar
          </Button>
        </CardContent>
      </Card>

      <p className="text-center text-gray-500 text-sm">
        Al confirmar, se creará la orden y podrás seguir el progreso en "Mis Pedidos".
      </p>
    </div>
  )
}
