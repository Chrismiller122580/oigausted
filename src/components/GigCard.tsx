"use client"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import Link from "next/link"
import { useState } from "react"
import { X } from "lucide-react"

interface GigProps {
  id: string
  title: string
  description: string
  price: number
  category: string
  seller: string
  rating: number
  reviews: number
}

export function GigCard({ gig }: { gig: GigProps }) {
  const [showModal, setShowModal] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)

  const handleBuyClick = () => setShowModal(true)

  const handlePayment = async (method: string) => {
    setIsProcessing(true)
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gigId: gig.id,
          buyerId: "demo-buyer-id",
          paymentMethod: method,
        }),
      })

      const data = await res.json()

      if (data.success) {
        alert(`✅ Pago exitoso con ${method.toUpperCase()}!\nPlataforma ganó $${data.companyEarnings.toLocaleString("es-CO")}`)
        setShowModal(false)
      } else {
        alert("Error al procesar el pago")
      }
    } catch (error) {
      alert("Error de conexión")
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <>
      <Card className="overflow-hidden hover:shadow-2xl transition-all duration-300 border border-gray-200 hover:border-yellow-500 group">
        <CardHeader className="p-6 pb-3">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <CardTitle className="text-lg leading-tight line-clamp-2 group-hover:text-yellow-600 transition-colors">
                {gig.title}
              </CardTitle>
              <CardDescription className="text-sm mt-1 text-yellow-600 font-medium">
                {gig.category}
              </CardDescription>
            </div>
            <div className="text-right ml-4">
              <span className="text-2xl font-bold text-yellow-600">
                ${gig.price.toLocaleString("es-CO")}
              </span>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6 pt-2">
          <p className="text-sm text-muted-foreground line-clamp-3">{gig.description}</p>
        </CardContent>

        <CardFooter className="p-6 pt-4 border-t flex justify-between items-center gap-3">
          <div>
            <span className="font-medium text-sm">{gig.seller}</span>
            <div className="flex items-center gap-1 text-amber-500 text-sm">
              ★ {gig.rating} <span className="text-muted-foreground">({gig.reviews})</span>
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href={`/gigs/${gig.id}`}>Ver Detalles</Link>
            </Button>
            <Button 
              size="sm" 
              className="bg-yellow-600 hover:bg-yellow-700 text-white"
              onClick={handleBuyClick}
            >
              Comprar Ahora
            </Button>
          </div>
        </CardFooter>
      </Card>

      {/* Simple Confirmation Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden">
            <div className="p-6 border-b flex justify-between items-center">
              <h3 className="text-xl font-bold">Confirmar Compra</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-700">
                <X size={24} />
              </button>
            </div>

            <div className="p-8">
              <p className="text-sm text-muted-foreground mb-2">Estás comprando</p>
              <p className="font-semibold text-lg mb-6">{gig.title}</p>
              <p className="text-3xl font-bold text-yellow-600 mb-8">
                ${gig.price.toLocaleString("es-CO")}
              </p>

              <div className="space-y-3">
                <Button 
                  className="w-full py-6 text-lg"
                  onClick={() => handlePayment("Tarjeta")}
                  disabled={isProcessing}
                >
                  Pagar con Tarjeta
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full py-6 text-lg"
                  onClick={() => handlePayment("PSE")}
                  disabled={isProcessing}
                >
                  Pagar con PSE
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full py-6 text-lg"
                  onClick={() => handlePayment("Nequi")}
                  disabled={isProcessing}
                >
                  Pagar con Nequi
                </Button>
              </div>
            </div>

            <div className="p-6 border-t bg-gray-50 text-center text-xs text-muted-foreground">
              Plataforma cobra 12% de comisión • Seguro con Wompi
            </div>
          </div>
        </div>
      )}
    </>
  )
}
