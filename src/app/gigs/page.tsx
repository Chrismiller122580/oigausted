"use client"
import { useState, useEffect } from "react"
import GigCard from "@/components/GigCard"

export default function GigsPage() {
  const [gigs, setGigs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchGigs()
  }, [])

  const fetchGigs = async () => {
    try {
      const res = await fetch("/api/gigs")
      const data = await res.json()
      setGigs(data)
    } catch (error) {
      console.error("Error fetching gigs:", error)
      setGigs([])
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="p-12 text-center">Cargando gigs...</div>
  }

  return (
    <div className="container py-12">
      <h1 className="text-4xl font-bold mb-10">Explorar Gigs</h1>
      
      {gigs.length === 0 ? (
        <p className="text-center text-gray-500 text-xl">No hay gigs disponibles todavía. ¡Sé el primero en publicar uno!</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {gigs.map((gig) => (
            <GigCard key={gig.id} gig={gig} />
          ))}
        </div>
      )}
    </div>
  )
}
