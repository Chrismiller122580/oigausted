"use client"
import { useState, useEffect } from "react"

interface Gig {
  id: string
  title: string
  price: number
  deliveryDays: number
}

export default function EarningsPage() {
  const [gigs, setGigs] = useState<Gig[]>([])
  const [totalRevenue, setTotalRevenue] = useState(0)

  useEffect(() => {
    const saved = localStorage.getItem("oigausted-gigs")
    if (saved) {
      const parsedGigs: Gig[] = JSON.parse(saved)
      setGigs(parsedGigs)
      
      // Simulate 12% platform fee on all gigs
      const revenue = parsedGigs.reduce((sum, gig) => sum + (gig.price * 0.12), 0)
      setTotalRevenue(revenue)
    }
  }, [])

  return (
    <div className="container mx-auto py-12 px-6">
      <h1 className="text-4xl font-bold mb-10">Ganancias de la Plataforma</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="bg-white border rounded-3xl p-8">
          <p className="text-sm text-gray-500">Total Gigs Publicados</p>
          <p className="text-5xl font-bold mt-2">{gigs.length}</p>
        </div>
        <div className="bg-white border rounded-3xl p-8">
          <p className="text-sm text-gray-500">Ingresos Estimados (12% fee)</p>
          <p className="text-5xl font-bold text-green-600 mt-2">
            ${totalRevenue.toLocaleString("es-CO")}
          </p>
        </div>
        <div className="bg-white border rounded-3xl p-8">
          <p className="text-sm text-gray-500">Promedio por Gig</p>
          <p className="text-5xl font-bold mt-2">
            ${gigs.length > 0 ? (totalRevenue / gigs.length).toFixed(0) : 0}
          </p>
        </div>
      </div>

      <div className="bg-white border rounded-3xl p-8">
        <h3 className="font-semibold text-lg mb-6">Gigs Publicados</h3>
        {gigs.length === 0 ? (
          <p className="text-gray-500">Aún no hay gigs para calcular ganancias.</p>
        ) : (
          <div className="space-y-4">
            {gigs.map((gig) => (
              <div key={gig.id} className="flex justify-between items-center border-b pb-4 last:border-0">
                <div>
                  <p className="font-medium">{gig.title}</p>
                  <p className="text-sm text-gray-500">Entrega en {gig.deliveryDays} días</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">${gig.price.toLocaleString("es-CO")}</p>
                  <p className="text-xs text-green-600">+12% fee</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
