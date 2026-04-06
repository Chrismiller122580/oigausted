"use client"
import { useState, useEffect } from "react"
import GigCard from "@/components/GigCard"

export default function GigsContent() {
  const [gigs, setGigs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    fetchGigs()
  }, [])

  const fetchGigs = async () => {
    try {
      const res = await fetch("/api/gigs")
      const data = await res.json()
      setGigs(data.gigs || [])
    } catch (error) {
      console.error("Failed to fetch gigs", error)
    } finally {
      setLoading(false)
    }
  }

  const filteredGigs = gigs.filter(gig =>
    gig.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    gig.seller?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (gig.category && gig.category.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  if (loading) {
    return <div className="container py-12 text-center">Cargando gigs...</div>
  }

  return (
    <div className="container py-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
        <div>
          <h1 className="text-4xl font-bold">Explorar Gigs en Colombia</h1>
          <p className="text-gray-500 mt-2">{filteredGigs.length} servicios disponibles</p>
        </div>

        <div className="w-full md:w-96">
          <input
            type="text"
            placeholder="Buscar gigs, categorías o vendedores..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-3 rounded-full border border-gray-300 focus:outline-none focus:border-yellow-500"
          />
        </div>
      </div>

      {filteredGigs.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-2xl text-gray-400">No se encontraron gigs</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredGigs.map((gig) => (
            <GigCard key={gig.id} gig={gig} />
          ))}
        </div>
      )}
    </div>
  )
}
