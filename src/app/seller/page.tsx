"use client"
import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ToastProvider"

export default function SellerDashboard() {
  const [myGigs, setMyGigs] = useState<any[]>([])
  const [mySales, setMySales] = useState<any[]>([])
  const [totalEarnings, setTotalEarnings] = useState(0)
  const { showToast } = useToast()

  useEffect(() => {
    const savedUser = localStorage.getItem("oigausted-user")
    if (!savedUser) return

    const user = JSON.parse(savedUser)
    if (user.role !== "seller") return

    // Load my gigs
    const savedGigs = localStorage.getItem("oigausted-gigs")
    if (savedGigs) {
      const gigs = JSON.parse(savedGigs)
      setMyGigs(gigs.filter((g: any) => g.seller === user.name))
    }

    // Load my sales
    const savedOrders = localStorage.getItem("oigausted-orders")
    if (savedOrders) {
      const orders = JSON.parse(savedOrders)
      const sales = orders.filter((o: any) => o.seller === user.name)
      setMySales(sales)

      const earnings = sales.reduce((sum: number, o: any) => sum + (o.price * 0.88), 0)
      setTotalEarnings(Math.round(earnings))
    }
  }, [])

  return (
    <div className="container mx-auto py-12 px-6 max-w-5xl">
      <div className="flex justify-between items-center mb-10">
        <h1 className="text-4xl font-bold">Dashboard de Vendedor</h1>
        <Button asChild>
          <Link href="/create-gig">Publicar Nuevo Gig</Link>
        </Button>
      </div>

      <div className="grid md:grid-cols-2 gap-8 mb-12">
        <div className="bg-white border rounded-3xl p-8">
          <h2 className="text-2xl font-semibold mb-2">💰 Ganancias Totales</h2>
          <p className="text-6xl font-bold text-green-600">${totalEarnings}</p>
          <p className="text-gray-500">88% de las ventas (después de comisión)</p>
        </div>

        <div className="bg-white border rounded-3xl p-8">
          <h2 className="text-2xl font-semibold mb-6">📦 Mis Ventas Recientes</h2>
          {mySales.length === 0 ? (
            <p className="text-gray-500">Aún no tienes ventas.</p>
          ) : (
            <div className="space-y-4">
              {mySales.slice(0, 5).map((sale) => (
                <div key={sale.id} className="p-5 border rounded-2xl flex justify-between">
                  <div>
                    <p className="font-medium">{sale.gigTitle}</p>
                    <p className="text-sm text-gray-500">Comprador: {sale.buyer}</p>
                  </div>
                  <div className="text-right font-bold">${sale.price}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-semibold mb-6">🛠 Mis Gigs Publicados</h2>
        {myGigs.length === 0 ? (
          <p className="text-gray-500">Aún no has publicado ningún gig.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {myGigs.map((gig) => (
              <div key={gig.id} className="bg-white border rounded-3xl p-8">
                <p className="font-semibold text-xl">{gig.title}</p>
                <p className="text-gray-600 mt-2">{gig.description}</p>
                <p className="text-2xl font-bold text-green-600 mt-4">${gig.price}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
