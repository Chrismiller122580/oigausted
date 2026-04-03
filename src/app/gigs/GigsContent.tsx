"use client"

import { useState, useEffect } from "react"
import GigCard from "@/components/GigCard"

export default function GigsContent() {
  const [gigs, setGigs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const savedGigs = JSON.parse(localStorage.getItem("oigausted-gigs") || "[]")
    setGigs(savedGigs)
    setLoading(false)
  }, [])

  if (loading) {
    return <div className="container py-12 text-center">Cargando gigs...</div>
  }

  return (
    <div className="container py-12">
      <div className="flex justify-between items-center mb-10">
        <h1 className="text-4xl font-bold">Explorar Gigs</h1>
        <p className="text-gray-500">{gigs.length} servicios disponibles</p>
      </div>

      {gigs.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-2xl text-gray-400">Aún no hay gigs publicados</p>
        </div>
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
