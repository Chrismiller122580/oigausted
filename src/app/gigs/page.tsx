"use client"

import { GigCard } from "@/components/GigCard"
import { useEffect, useState } from "react"

interface Gig {
  id: string
  title: string
  description: string
  price: number
  category: string
  seller: { name: string | null }
  rating?: number
  reviews?: number
}

export default function GigsPage() {
  const [gigs, setGigs] = useState<Gig[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/gigs')
      .then(res => res.json())
      .then(data => {
        setGigs(data.gigs || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="container py-12 text-center">
        <p>Cargando gigs...</p>
      </div>
    )
  }

  return (
    <div className="container py-8 md:py-12">
      <h1 className="text-3xl md:text-4xl font-bold mb-8 text-center">
        Explora Gigs en Colombia
      </h1>

      {gigs.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-xl text-muted-foreground">Aún no hay gigs publicados.</p>
          <p className="mt-4">
            <a href="/create-gig" className="text-yellow-600 hover:underline">
              Sé el primero en publicar un gig →
            </a>
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {gigs.map((gig) => (
            <GigCard 
              key={gig.id} 
              gig={{
                ...gig,
                seller: gig.seller.name || "Vendedor",
                rating: 4.8,
                reviews: 12
              }} 
            />
          ))}
        </div>
      )}
    </div>
  )
}
