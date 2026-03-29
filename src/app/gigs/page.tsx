"use client"
import { useState, useEffect } from "react"
import Link from "next/link"

interface Gig {
  id: string
  title: string
  description: string
  price: number
  category: string
}

export default function GigsPage() {
  const [gigs, setGigs] = useState<Gig[]>([])

  useEffect(() => {
    const saved = localStorage.getItem("oigausted-gigs")
    if (saved) setGigs(JSON.parse(saved))
  }, [])

  return (
    <div className="container mx-auto py-12 px-6">
      <div className="flex justify-between items-center mb-10">
        <h1 className="text-4xl font-bold">Gigs en Colombia</h1>
        <Link 
          href="/create-gig"
          className="bg-yellow-600 hover:bg-yellow-700 text-white px-8 py-3 rounded-full font-medium"
        >
          + Publicar Gig
        </Link>
      </div>

      {gigs.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed rounded-3xl border-gray-300 bg-gray-50">
          <p className="text-6xl mb-6">🌴</p>
          <p className="text-2xl text-gray-500 mb-2">Aún no hay gigs</p>
          <p className="text-gray-400">¡Publica el primero!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {gigs.map((gig) => (
            <div key={gig.id} className="bg-white border rounded-2xl p-6 hover:shadow-lg">
              <h3 className="font-semibold text-xl mb-3 line-clamp-2">{gig.title}</h3>
              <p className="text-gray-600 text-sm mb-6 line-clamp-4">{gig.description}</p>
              <div className="flex justify-between items-center pt-4 border-t">
                <span className="text-3xl font-bold text-yellow-600">
                  ${gig.price.toLocaleString("es-CO")}
                </span>
                <span className="text-xs bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full">
                  {gig.category}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
