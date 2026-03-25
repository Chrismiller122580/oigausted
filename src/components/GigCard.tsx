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
  const [isBuying, setIsBuying] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const handleBuyClick = () => {
    setShowConfirm(true)
  }

  const handleConfirmBuy = async () => {
    setShowConfirm(false)
    setIsBuying(true)

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gigId: gig.id,
          buyerId: "demo-buyer-id", // TODO: replace with real user ID later
        }),
      })

      const data = await res.json()

      if (data.success) {
        alert(`¡Compra exitosa! Plataforma ganó $${data.companyEarnings.toLocaleString("es-CO")}`)
      } else {
        alert("Error al procesar la compra")
      }
    } catch (error) {
      alert("Error de conexión")
    } finally {
      setIsBuying(false)
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

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4">
            <h3 className="text-2xl font-bold mb-4">Confirmar Compra</h3>
            <p className="text-muted-foreground mb-6">
              ¿Estás seguro de comprar "<strong>{gig.title}</strong>" por ${gig.price.toLocaleString("es-CO")}?
            </p>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setShowConfirm(false)}>
                Cancelar
              </Button>
              <Button 
                className="flex-1 bg-yellow-600 hover:bg-yellow-700" 
                onClick={handleConfirmBuy}
                disabled={isBuying}
              >
                {isBuying ? "Procesando..." : "Confirmar Compra"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
