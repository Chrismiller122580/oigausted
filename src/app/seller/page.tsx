"use client"
import GrokAssistant from "@/components/GrokAssistant"
import { useSession } from "next-auth/react"
import { useEffect, useState } from "react"

export default function SellerDashboard() {
  const { data: session } = useSession()
  const [gigs, setGigs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (session?.user?.email) {
      fetch(`/api/gigs?sellerEmail=${encodeURIComponent(session.user.email)}`)
        .then(res => res.json())
        .then(data => {
          setGigs(Array.isArray(data) ? data : [])
          setLoading(false)
        })
        .catch(() => setLoading(false))
    }
  }, [session])

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-6 py-10">
        <div className="flex justify-between items-center mb-10">
          <h1 className="text-4xl font-bold">Mi Dashboard de Vendedor</h1>
          <a href="/create-gig" className="bg-yellow-600 hover:bg-yellow-700 text-white px-8 py-4 rounded-2xl font-medium flex items-center gap-2">
            + Publicar Nuevo Gig
          </a>
        </div>

        {loading ? (
          <p className="text-center py-20">Cargando tus gigs...</p>
        ) : gigs.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-2xl text-gray-500 mb-6">Aún no tienes gigs publicados</p>
            <a href="/create-gig" className="inline-block bg-yellow-600 text-white px-10 py-5 rounded-2xl font-medium text-lg">Crear mi primer Gig</a>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {gigs.map(gig => (
              <div key={gig.id} className="bg-white border rounded-3xl overflow-hidden shadow-sm">
                {gig.imageUrl && <img src={gig.imageUrl} alt={gig.title} className="w-full h-56 object-cover" />}
                <div className="p-6">
                  <h3 className="font-semibold text-2xl mb-2">{gig.title}</h3>
                  <p className="text-gray-600 line-clamp-3 mb-6">{gig.description}</p>
                  <div className="flex justify-between items-end">
                    <div>
                      <span className="text-3xl font-bold text-yellow-600">${gig.price}</span>
                    </div>
                    <span className="px-5 py-2 bg-yellow-100 text-yellow-700 rounded-2xl text-sm font-medium">{gig.category}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Grok AI Assistant */}
      <GrokAssistant />
    </div>
  )
}
