"use client"
import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

interface Gig {
  id: string
  title: string
  description: string
  price: number
  category: string
  deliveryDays: number
}

interface Order {
  id: string
  gigId: string
  gigTitle: string
  price: number
  status: "Pending" | "In Progress" | "Review" | "Completed"
  buyer: string
  seller: string
  createdAt: string
  messages: { from: string; text: string; time: string }[]
  files: { name: string; url: string }[]
  addOns: { name: string; price: number }[]
  progress: number // 0-100
}

export default function GigsPage() {
  const [gigs, setGigs] = useState<Gig[]>([])
  const [selectedGig, setSelectedGig] = useState<Gig | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState("")

  useEffect(() => {
    const saved = localStorage.getItem("oigausted-gigs")
    if (saved) setGigs(JSON.parse(saved))
  }, [])

  const openBuyModal = (gig: Gig) => {
    setSelectedGig(gig)
    setShowModal(true)
    setPaymentMethod("")
  }

  const handleBuy = () => {
    if (!paymentMethod || !selectedGig) return

    // Create new Order
    const newOrder: Order = {
      id: Date.now().toString(),
      gigId: selectedGig.id,
      gigTitle: selectedGig.title,
      price: selectedGig.price,
      status: "Pending",
      buyer: "Tú (Comprador)",
      seller: "Demo Vendedor",
      createdAt: new Date().toISOString(),
      messages: [],
      files: [],
      addOns: [],
      progress: 25
    }

    // Save order
    const existingOrders: Order[] = JSON.parse(localStorage.getItem("oigausted-orders") || "[]")
    localStorage.setItem("oigausted-orders", JSON.stringify([newOrder, ...existingOrders]))

    alert(`✅ ¡Orden creada exitosamente!\nMétodo: ${paymentMethod}\nAhora puedes ver el progreso en /orders`)

    setShowModal(false)
    setSelectedGig(null)

    // Redirect to the new order detail
    window.location.href = `/orders/${newOrder.id}`
  }

  return (
    <div className="container mx-auto py-12 px-6">
      <div className="flex justify-between items-center mb-10">
        <h1 className="text-4xl font-bold">Gigs en Colombia</h1>
        <Link href="/create-gig" className="bg-yellow-600 hover:bg-yellow-700 text-white px-8 py-3 rounded-full font-medium">
          + Publicar Gig
        </Link>
      </div>

      {gigs.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed rounded-3xl border-gray-300 bg-gray-50">
          <p className="text-6xl mb-6">🌴</p>
          <p className="text-2xl text-gray-500">Aún no hay gigs publicados</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {gigs.map((gig) => (
            <div key={gig.id} className="bg-white border rounded-2xl p-6 hover:shadow-lg transition-all">
              <h3 className="font-semibold text-xl mb-3">{gig.title}</h3>
              <p className="text-gray-600 text-sm mb-4 line-clamp-4">{gig.description}</p>
              <div className="flex justify-between text-sm text-gray-500 mb-6">
                <span>Entrega en {gig.deliveryDays} días</span>
                <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full">{gig.category}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="text-3xl font-bold text-yellow-600">
                  ${gig.price.toLocaleString("es-CO")}
                </div>
                <button 
                  onClick={() => openBuyModal(gig)}
                  className="bg-yellow-600 hover:bg-yellow-700 text-white px-6 py-2.5 rounded-xl text-sm font-medium"
                >
                  Comprar Ahora
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Buy Modal */}
      {showModal && selectedGig && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden">
            <div className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white p-8">
              <h2 className="text-2xl font-bold">Confirmar Compra</h2>
              <p className="mt-2 opacity-90">{selectedGig.title}</p>
            </div>
            <div className="p-8">
              <div className="mb-8">
                <p className="text-4xl font-bold text-yellow-600">
                  ${selectedGig.price.toLocaleString("es-CO")}
                </p>
                <p className="text-sm text-gray-500 mt-1">Entrega en {selectedGig.deliveryDays} días</p>
              </div>

              <div className="space-y-3 mb-10">
                {["Tarjeta de Crédito / Débito", "PSE", "Nequi", "Daviplata"].map((method) => (
                  <button
                    key={method}
                    onClick={() => setPaymentMethod(method)}
                    className={`w-full text-left px-6 py-4 rounded-2xl border-2 transition-all text-sm font-medium ${
                      paymentMethod === method ? 'border-yellow-600 bg-yellow-50 text-yellow-700' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {method}
                  </button>
                ))}
              </div>

              <div className="flex gap-4">
                <Button variant="outline" className="flex-1 py-6" onClick={() => setShowModal(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleBuy} disabled={!paymentMethod} className="flex-1 py-6 bg-yellow-600 hover:bg-yellow-700">
                  Confirmar Compra
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
