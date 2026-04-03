"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function PublicSellerProfile() {
  const { username } = useParams()
  const [seller, setSeller] = useState<any>(null)
  const [gigs, setGigs] = useState<any[]>([])

  useEffect(() => {
    const savedProfile = localStorage.getItem(`businessProfile_${username}`)
    if (savedProfile) {
      setSeller(JSON.parse(savedProfile))
    }

    const savedGigs = JSON.parse(localStorage.getItem("oigausted-gigs") || "[]")
    const sellerGigs = savedGigs.filter((g: any) => 
      g.seller && g.seller.toLowerCase().replace(/\s+/g, '') === username
    )
    setGigs(sellerGigs)
  }, [username])

  if (!seller) {
    return (
      <div className="container py-20 text-center">
        <h1 className="text-3xl font-bold">Vendedor no encontrado</h1>
        <p className="text-gray-500 mt-4">El perfil que buscas no existe.</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="container max-w-5xl mx-auto px-6 py-12">
          <div className="flex flex-col md:flex-row gap-8 items-center">
            {seller.logo ? (
              <img 
                src={seller.logo} 
                alt="logo" 
                className="w-32 h-32 rounded-2xl object-cover border-4 border-white shadow-lg" 
              />
            ) : (
              <div className="w-32 h-32 rounded-2xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-5xl text-white font-bold">
                {username[0]?.toUpperCase()}
              </div>
            )}

            <div className="flex-1 text-center md:text-left">
              <h1 className="text-5xl font-bold mb-2">{username}</h1>
              <p className="text-xl text-gray-600 max-w-md mx-auto md:mx-0">
                {seller.bio || "Vendedor profesional en Colombia. Ofrezco servicios de calidad con entrega rápida."}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container max-w-5xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2">
            <h2 className="text-2xl font-semibold mb-6">Portafolio</h2>
            {seller.portfolio && seller.portfolio.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {seller.portfolio.map((img: string, index: number) => (
                  <div key={index} className="aspect-square rounded-2xl overflow-hidden border">
                    <img src={img} alt="portfolio" className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">Este vendedor aún no ha agregado portafolio.</p>
            )}
          </div>

          <div>
            <h2 className="text-2xl font-semibold mb-6">Servicios Disponibles</h2>
            {gigs.length > 0 ? (
              <div className="space-y-4">
                {gigs.map((gig) => (
                  <Card key={gig.id}>
                    <CardContent className="p-6">
                      <h3 className="font-medium">{gig.title}</h3>
                      <p className="text-2xl font-bold text-yellow-600 mt-2">
                        ${gig.price.toLocaleString()}
                      </p>
                      <Button asChild className="w-full mt-4" variant="outline">
                        <Link href={`/gigs/${gig.id}`}>Ver Detalles</Link>
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">Este vendedor aún no tiene gigs publicados.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
