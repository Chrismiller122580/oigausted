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
  sellerId?: string
  sellerName?: string
}

export default function GigsPage() {
  const [gigs, setGigs] = useState<Gig[]>([])
  const [filteredGigs, setFilteredGigs] = useState<Gig[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedGig, setSelectedGig] = useState<Gig | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState("")
  const [currentUser, setCurrentUser] = useState<any>(null)

  useEffect(() => {
    const userStr = localStorage.getItem("oigausted-user")
    if (userStr) setCurrentUser(JSON.parse(userStr))

    const saved = localStorage.getItem("oigausted-gigs")
    if (saved) {
      const parsed: Gig[] = JSON.parse(saved)
      setGigs(parsed)
      setFilteredGigs(parsed)
    }
  }, [])

  // Live search
  useEffect(() => {
    let result = gigs
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      result = result.filter(gig => 
        gig.title.toLowerCase().includes(term) || 
        gig.description.toLowerCase().includes(term)
      )
    }
    setFilteredGigs(result)
  }, [gigs, searchTerm])

  const deleteGig = (id: string) => {
    if (!confirm("¿Eliminar este gig permanentemente?")) return

    const updatedGigs = gigs.filter(g => g.id !== id)
    localStorage.setItem("oigausted-gigs", JSON.stringify(updatedGigs))
    setGigs(updatedGigs)
    setFilteredGigs(updatedGigs)
  }

  const canDeleteGig = (gig: Gig) => {
    if (!currentUser) return false
    if (currentUser.role === "admin") return true
    return gig.sellerId === currentUser.id
  }

  const openBuyModal = (gig: Gig) => {
    setSelectedGig(gig)
    setShowModal(true)
    setPaymentMethod("")
  }

  const handleBuy = () => {
    if (!paymentMethod || !selectedGig) return

    const newOrder = {
      id: Date.now().toString(),
      gigId: selectedGig.id,
      gigTitle: selectedGig.title,
      price: selectedGig.price,
      status: "Pending",
      buyer: currentUser?.name || "Comprador",
      seller: selectedGig.sellerName || "Demo Vendedor",
      createdAt: new Date().toISOString(),
      messages: [],
      files: [],
      addOns: [],
      progress: 25
    }

    const existingOrders = JSON.parse(localStorage.getItem("oigausted-orders") || "[]")
    localStorage.setItem("oigausted-orders", JSON.stringify([newOrder, ...existingOrders]))

    alert(`✅ Orden creada con ${paymentMethod}`)
    setShowModal(false)
    setSelectedGig(null)
    window.location.href = `/orders/${newOrder.id}`
  }

  return (
    <div className="container mx-auto py-12 px-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
        <h1 className="text-4xl font-bold">Gigs en Colombia</h1>
        
        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
          <div className="relative flex-1">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar gigs por título o descripción..."
              className="w-full border border-gray-300 rounded-full pl-12 py-3 focus:outline-none focus:border-yellow-600"
            />
            <span className="absolute left-5 top-3.5 text-gray-400">🔍</span>
          </div>
          <Link href="/create-gig" className="bg-yellow-600 hover:bg-yellow-700 text-white px-8 py-3 rounded-full font-medium whitespace-nowrap">
            + Publicar Gig
          </Link>
        </div>
      </div>

      {filteredGigs.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed rounded-3xl border-gray-300 bg-gray-50">
          <p className="text-6xl mb-6">🌴</p>
          <p className="text-2xl text-gray-500">
            {searchTerm ? "No se encontraron gigs" : "Aún no hay gigs publicados"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredGigs.map((gig) => (
            <div key={gig.id} className="bg-white border rounded-2xl p-6 hover:shadow-lg transition-all relative">
              {/* Delete button - visible to admin OR the seller who created it */}
              {canDeleteGig(gig) && (
                <button
                  onClick={() => deleteGig(gig.id)}
                  className="absolute top-4 right-4 text-red-500 hover:text-red-700 text-xl font-bold"
                >
                  ✕
                </button>
              )}

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
                {["Tarjeta de Crédito / Débito", "PSE (Transferencia Bancaria)", "Nequi", "Daviplata"].map((method) => (
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
